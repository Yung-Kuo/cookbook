from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.api.serializers import RecipeWriteSerializer
from recipes.models import (
    Collection,
    CollectionRecipe,
    Ingredient,
    Like,
    Recipe,
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


class RecipePrivateCreateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)

    def test_authenticated_user_can_create_private_recipe(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.post(
            "/api/recipes/",
            {
                "title": "Private draft",
                "description": "",
                "is_public": False,
                "recipe_instructions": [
                    {"text": "Mix quietly", "order": 1},
                ],
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["is_public"])
        self.assertEqual(res.data["owner_id"], self.user.id)


class PrivateRecipeActionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.recipe = Recipe.objects.create(
            title="Private",
            owner=self.user,
            is_public=False,
        )

    def test_owner_can_like_own_private_recipe(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.post(f"/api/recipes/{self.recipe.id}/like/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["liked"])
        self.assertTrue(Like.objects.filter(user=self.user, recipe=self.recipe).exists())


class OwnerlessRecipeMutationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )

    def test_authenticated_user_cannot_update_ownerless_recipe(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.put(
            f"/api/recipes/{self.recipe.id}/",
            {
                "title": "Vandalized",
                "description": "",
                "is_public": True,
                "recipe_instructions": [
                    {"text": "Rewrite", "order": 1},
                ],
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.title, "Template")


class IngredientPermissionTests(APITestCase):
    def test_anonymous_user_cannot_create_ingredient(self):
        res = self.client.post(
            "/api/ingredients/",
            {"name": "Ghost pepper"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Ingredient.objects.filter(name="Ghost pepper").exists())

    def test_authenticated_user_cannot_delete_shared_ingredient(self):
        user = User.objects.create_user(username="chef", password="pass")
        token = Token.objects.create(user=user)
        ingredient = Ingredient.objects.create(name="Salt")
        recipe = Recipe.objects.create(title="Soup", owner=user, is_public=True)
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=ingredient,
            quantity=1,
            unit="tsp",
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        res = self.client.delete(f"/api/ingredients/{ingredient.id}/")

        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Ingredient.objects.filter(id=ingredient.id).exists())
        self.assertTrue(
            RecipeIngredient.objects.filter(
                recipe=recipe,
                ingredient=ingredient,
            ).exists()
        )


class CollectionPrivateRecipeVisibilityTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="pass")
        self.bob = User.objects.create_user(username="bob", password="pass")
        self.bob_token = Token.objects.create(user=self.bob)
        self.private_recipe = Recipe.objects.create(
            title="Alice private",
            owner=self.alice,
            is_public=False,
        )
        self.collection = Collection.objects.create(
            user=self.bob,
            name="Bob collection",
            is_public=True,
        )

    def test_cannot_add_another_users_private_recipe_to_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.bob_token.key}")
        res = self.client.post(
            f"/api/collections/{self.collection.id}/recipes/",
            {"recipe_id": self.private_recipe.id},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(
            CollectionRecipe.objects.filter(
                collection=self.collection,
                recipe=self.private_recipe,
            ).exists()
        )

    def test_unavailable_collection_entry_does_not_expose_recipe_id(self):
        CollectionRecipe.objects.create(
            collection=self.collection,
            recipe=self.private_recipe,
        )

        res = self.client.get(f"/api/collections/{self.collection.id}/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["entries"]), 1)
        entry = res.data["entries"][0]
        self.assertFalse(entry["is_available"])
        self.assertNotIn("recipe_id", entry)
        self.assertIsNone(entry["recipe"])


class RecipeWriteAtomicityTests(APITestCase):
    def test_update_rolls_back_nested_deletes_when_recreate_fails(self):
        user = User.objects.create_user(username="chef", password="pass")
        ingredient = Ingredient.objects.create(name="Salt")
        recipe = Recipe.objects.create(title="Soup", owner=user, is_public=True)
        RecipeIngredient.objects.create(
            recipe=recipe,
            ingredient=ingredient,
            quantity=1,
            unit="tsp",
        )
        RecipeInstruction.objects.create(recipe=recipe, text="Warm", order=1)
        serializer = RecipeWriteSerializer(
            recipe,
            data={
                "title": "Soup",
                "description": "",
                "is_public": True,
                "recipe_ingredients": [
                    {"ingredient": ingredient.id, "quantity": 1, "unit": "tsp"},
                    {"ingredient": ingredient.id, "quantity": 2, "unit": "tbsp"},
                ],
                "recipe_instructions": [
                    {"text": "Warm", "order": 1},
                ],
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with self.assertRaises(IntegrityError):
            serializer.save()

        self.assertEqual(
            RecipeIngredient.objects.filter(recipe=recipe, ingredient=ingredient).count(),
            1,
        )
        self.assertTrue(
            RecipeInstruction.objects.filter(recipe=recipe, text="Warm", order=1).exists()
        )
