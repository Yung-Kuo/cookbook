from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.models import (
    Ingredient,
    Like,
    Recipe,
    RecipeImage,
    RecipeIngredient,
    RecipeInstruction,
    Tag,
)

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
    """Public ownerless recipes are shared templates and must not be user-editable."""

    def setUp(self):
        self.user = User.objects.create_user(username="mallory", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.image = RecipeImage.objects.create(
            recipe=self.recipe,
            image="cookbook/recipes/template.jpg",
            is_cover=True,
            order=1,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_authenticated_user_cannot_update_ownerless_recipe(self):
        res = self.client.patch(
            f"/api/recipes/{self.recipe.id}/",
            {"title": "Defaced"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.title, "Template")

    def test_authenticated_user_cannot_delete_ownerless_recipe(self):
        res = self.client.delete(f"/api/recipes/{self.recipe.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.recipe.pk).exists())

    def test_authenticated_user_cannot_mutate_ownerless_recipe_images(self):
        upload_res = self.client.post(
            f"/api/recipes/{self.recipe.id}/images/",
            {},
            format="multipart",
        )
        self.assertEqual(upload_res.status_code, status.HTTP_403_FORBIDDEN)

        cover_res = self.client.patch(
            f"/api/recipes/{self.recipe.id}/images/{self.image.id}/set-cover/",
            {},
            format="json",
        )
        self.assertEqual(cover_res.status_code, status.HTTP_403_FORBIDDEN)

        delete_res = self.client.delete(
            f"/api/recipes/{self.recipe.id}/images/{self.image.id}/"
        )
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(RecipeImage.objects.filter(pk=self.image.pk).exists())


class TaxonomyPermissionTests(APITestCase):
    """Shared tags/ingredients can be read and created, but not destructively edited by users."""

    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.ingredient = Ingredient.objects.create(name="Salt")
        self.tag = Tag.objects.create(name="Dinner")

    def test_anonymous_user_cannot_create_ingredient(self):
        res = self.client.post(
            "/api/ingredients/",
            {"name": "Pepper"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_create_ingredient(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.post(
            "/api/ingredients/",
            {"name": "Pepper"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_authenticated_user_cannot_delete_ingredient(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.delete(f"/api/ingredients/{self.ingredient.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Ingredient.objects.filter(pk=self.ingredient.pk).exists())

    def test_authenticated_user_cannot_update_or_delete_tag(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        patch_res = self.client.patch(
            f"/api/tags/{self.tag.id}/",
            {"name": "Renamed"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)

        delete_res = self.client.delete(f"/api/tags/{self.tag.id}/")
        self.assertEqual(delete_res.status_code, status.HTTP_403_FORBIDDEN)
        self.tag.refresh_from_db()
        self.assertEqual(self.tag.name, "Dinner")


class RecipeNestedWriteValidationTests(APITestCase):
    """Invalid nested updates should fail before deleting existing recipe rows."""

    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.salt = Ingredient.objects.create(name="Salt")
        self.recipe = Recipe.objects.create(
            title="Soup",
            owner=self.user,
            is_public=False,
        )
        RecipeIngredient.objects.create(
            recipe=self.recipe,
            ingredient=self.salt,
            quantity=1,
            unit="tsp",
        )
        RecipeInstruction.objects.create(
            recipe=self.recipe,
            text="Simmer",
            order=1,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_duplicate_ingredient_update_is_rejected_without_deleting_existing_rows(self):
        res = self.client.patch(
            f"/api/recipes/{self.recipe.id}/",
            {
                "recipe_ingredients": [
                    {"ingredient": self.salt.id, "quantity": 1, "unit": "tsp"},
                    {"ingredient": self.salt.id, "quantity": 2, "unit": "tbsp"},
                ]
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        rows = list(RecipeIngredient.objects.filter(recipe=self.recipe))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].ingredient_id, self.salt.id)
        self.assertEqual(rows[0].quantity, 1)
        self.assertEqual(rows[0].unit, "tsp")

    def test_duplicate_instruction_update_is_rejected_without_deleting_existing_rows(self):
        res = self.client.patch(
            f"/api/recipes/{self.recipe.id}/",
            {
                "recipe_instructions": [
                    {"text": "Chop", "order": 1},
                    {"text": "Boil", "order": 1},
                ]
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        rows = list(RecipeInstruction.objects.filter(recipe=self.recipe))
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0].text, "Simmer")
        self.assertEqual(rows[0].order, 1)
