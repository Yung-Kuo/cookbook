from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.api.serializers import RecipeWriteSerializer
from recipes.models import Like, Recipe, RecipeInstruction, Tag

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


class RecipeCreateTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="owner", password="pass")
        self.token = Token.objects.create(user=self.user)

    def test_authenticated_user_can_create_private_recipe(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.post(
            "/api/recipes/",
            {
                "title": "Private draft",
                "description": "Not ready to share",
                "is_public": False,
                "recipe_ingredients": [],
                "recipe_instructions": [
                    {"text": "Keep it private", "order": 1},
                ],
            },
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["owner_id"], self.user.id)
        self.assertFalse(res.data["is_public"])
        self.assertTrue(
            Recipe.objects.filter(
                id=res.data["id"],
                owner=self.user,
                is_public=False,
            ).exists()
        )


class RecipeWriteSerializerAtomicTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.recipe = Recipe.objects.create(
            title="Original",
            description="Keep this recipe",
            owner=self.user,
            is_public=True,
        )
        RecipeInstruction.objects.create(
            recipe=self.recipe,
            text="Original step",
            order=1,
        )

    def test_create_rolls_back_recipe_when_instruction_create_fails(self):
        serializer = RecipeWriteSerializer(
            data={
                "title": "Partial create",
                "description": "Should not persist",
                "is_public": True,
                "recipe_ingredients": [],
                "recipe_instructions": [
                    {"text": "New step", "order": 1},
                ],
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with patch(
            "recipes.api.serializers.RecipeInstruction.objects.create",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertRaises(RuntimeError):
                serializer.save(owner=self.user)

        self.assertFalse(Recipe.objects.filter(title="Partial create").exists())

    def test_update_rolls_back_recipe_and_instructions_when_replace_fails(self):
        serializer = RecipeWriteSerializer(
            self.recipe,
            data={
                "title": "Changed",
                "description": "Changed description",
                "is_public": False,
                "recipe_ingredients": [],
                "recipe_instructions": [
                    {"text": "Replacement step", "order": 1},
                ],
            },
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with patch(
            "recipes.api.serializers.RecipeInstruction.objects.create",
            side_effect=RuntimeError("boom"),
        ):
            with self.assertRaises(RuntimeError):
                serializer.save()

        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.title, "Original")
        self.assertEqual(self.recipe.description, "Keep this recipe")
        self.assertTrue(self.recipe.is_public)
        self.assertEqual(
            list(
                self.recipe.recipeinstruction_set.values_list(
                    "text",
                    "order",
                )
            ),
            [("Original step", 1)],
        )
