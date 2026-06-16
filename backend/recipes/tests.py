from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.models import Like, Recipe, RecipeImage, Tag

User = get_user_model()


class RecipeListIsLikedTests(APITestCase):
    """is_liked on list reflects the authenticated viewer, not whether anyone liked."""

    def setUp(self):
        self.user_a = User.objects.create_user(username="alice", password="pass")
        self.user_b = User.objects.create_user(username="bob", password="pass")
        self.token_a = Token.objects.create(user=self.user_a)
        self.token_b = Token.objects.create(user=self.user_b)
        self.recipe = Recipe.objects.create(
            title="Shared",
            owner=self.user_a,
            is_public=True,
        )
        Like.objects.create(user=self.user_a, recipe=self.recipe)

    def test_other_user_sees_is_liked_false_while_like_count_positive(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token_b.key}")
        res = self.client.get("/api/recipes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        row = next(r for r in res.data if r["id"] == self.recipe.id)
        self.assertFalse(row["is_liked"])
        self.assertEqual(row["like_count"], 1)

    def test_after_viewer_likes_is_liked_true(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token_b.key}")
        like_res = self.client.post(f"/api/recipes/{self.recipe.id}/like/")
        self.assertEqual(like_res.status_code, status.HTTP_200_OK)
        self.assertTrue(like_res.data["liked"])

        res = self.client.get("/api/recipes/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        row = next(r for r in res.data if r["id"] == self.recipe.id)
        self.assertTrue(row["is_liked"])
        self.assertEqual(row["like_count"], 2)


class RecipeTagFilterTests(APITestCase):
    """Multiple ?tags= params use AND (recipe must have every tag)."""

    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.tag_a = Tag.objects.create(name="A")
        self.tag_b = Tag.objects.create(name="B")
        self.only_a = Recipe.objects.create(
            title="Only A",
            owner=self.user,
            is_public=True,
        )
        self.only_a.tags.add(self.tag_a)
        self.only_b = Recipe.objects.create(
            title="Only B",
            owner=self.user,
            is_public=True,
        )
        self.only_b.tags.add(self.tag_b)
        self.both = Recipe.objects.create(
            title="A and B",
            owner=self.user,
            is_public=True,
        )
        self.both.tags.add(self.tag_a, self.tag_b)

    def test_multiple_tags_require_all(self):
        res = self.client.get(
            "/api/recipes/",
            {"tags": [self.tag_a.id, self.tag_b.id]},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in res.data}
        self.assertEqual(ids, {self.both.id})

    def test_single_tag_still_matches_any_recipe_with_that_tag(self):
        res = self.client.get("/api/recipes/", {"tags": [self.tag_a.id]})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in res.data}
        self.assertEqual(ids, {self.only_a.id, self.both.id})


class RecipeMutationSafetyTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.other_user = User.objects.create_user(username="other", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other_user)

    def _recipe_payload(self, **overrides):
        payload = {
            "title": "Private soup",
            "description": "Keep this private",
            "is_public": False,
            "recipe_instructions": [{"text": "Simmer", "order": 1}],
        }
        payload.update(overrides)
        return payload

    def test_private_recipe_create_returns_saved_recipe(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.post(
            "/api/recipes/",
            self._recipe_payload(),
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["owner_id"], self.user.pk)
        self.assertFalse(res.data["is_public"])
        self.assertEqual(Recipe.objects.filter(owner=self.user).count(), 1)

    def test_non_owner_cannot_edit_ownerless_recipe(self):
        recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.patch(
            f"/api/recipes/{recipe.pk}/",
            {"title": "Hijacked"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        recipe.refresh_from_db()
        self.assertEqual(recipe.title, "Template")

    def test_non_owner_cannot_delete_ownerless_recipe(self):
        recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.delete(f"/api/recipes/{recipe.pk}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=recipe.pk).exists())

    def test_non_owner_cannot_mutate_ownerless_recipe_images(self):
        recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        image = RecipeImage.objects.create(
            recipe=recipe,
            image="recipes/template.jpg",
            is_cover=False,
            order=1,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        upload_res = self.client.post(f"/api/recipes/{recipe.pk}/images/")
        set_cover_res = self.client.patch(
            f"/api/recipes/{recipe.pk}/images/{image.pk}/set-cover/",
        )
        delete_res = self.client.delete(
            f"/api/recipes/{recipe.pk}/images/{image.pk}/",
        )

        self.assertEqual(upload_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(set_cover_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)
        image.refresh_from_db()
        self.assertFalse(image.is_cover)
