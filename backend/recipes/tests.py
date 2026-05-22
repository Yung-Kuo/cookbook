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


class OwnerlessRecipeMutationPermissionTests(APITestCase):
    """Ownerless template recipes are public to read but not mutable through the API."""

    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        self.template = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.image = RecipeImage.objects.create(
            recipe=self.template,
            image="cookbook/recipes/template.jpg",
            is_cover=True,
            order=1,
        )

    def test_authenticated_user_cannot_patch_ownerless_recipe(self):
        res = self.client.patch(
            f"/api/recipes/{self.template.id}/",
            {"title": "Vandalized"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.template.refresh_from_db()
        self.assertEqual(self.template.title, "Template")

    def test_authenticated_user_cannot_delete_ownerless_recipe(self):
        res = self.client.delete(f"/api/recipes/{self.template.id}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.template.pk).exists())

    def test_authenticated_user_cannot_upload_ownerless_recipe_image(self):
        res = self.client.post(f"/api/recipes/{self.template.id}/images/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.template.images.count(), 1)

    def test_authenticated_user_cannot_delete_ownerless_recipe_image(self):
        res = self.client.delete(
            f"/api/recipes/{self.template.id}/images/{self.image.id}/"
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(RecipeImage.objects.filter(pk=self.image.pk).exists())

    def test_authenticated_user_cannot_set_ownerless_recipe_cover_image(self):
        res = self.client.patch(
            f"/api/recipes/{self.template.id}/images/{self.image.id}/set-cover/"
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.image.refresh_from_db()
        self.assertTrue(self.image.is_cover)

    def test_owner_can_still_patch_owned_recipe(self):
        recipe = Recipe.objects.create(
            title="Mine",
            owner=self.user,
            is_public=True,
        )

        res = self.client.patch(
            f"/api/recipes/{recipe.id}/",
            {"title": "Updated"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        recipe.refresh_from_db()
        self.assertEqual(recipe.title, "Updated")
