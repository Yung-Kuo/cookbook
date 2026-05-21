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


class RecipeMutationPermissionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.other = User.objects.create_user(username="mallory", password="pass")
        self.user_token = Token.objects.create(user=self.user)
        self.other_token = Token.objects.create(user=self.other)
        self.ownerless_recipe = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.private_recipe = Recipe.objects.create(
            title="Private",
            owner=self.user,
            is_public=False,
        )

    def authenticate_as(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def test_authenticated_user_cannot_update_ownerless_recipe(self):
        self.authenticate_as(self.other_token)

        res = self.client.patch(
            f"/api/recipes/{self.ownerless_recipe.id}/",
            {"title": "Defaced"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.ownerless_recipe.refresh_from_db()
        self.assertEqual(self.ownerless_recipe.title, "Template")

    def test_authenticated_user_cannot_delete_ownerless_recipe(self):
        self.authenticate_as(self.other_token)

        res = self.client.delete(f"/api/recipes/{self.ownerless_recipe.id}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.ownerless_recipe.pk).exists())

    def test_owner_can_set_cover_image_on_private_recipe(self):
        self.authenticate_as(self.user_token)
        image = RecipeImage.objects.create(
            recipe=self.private_recipe,
            image="",
            is_cover=False,
        )

        res = self.client.patch(
            f"/api/recipes/{self.private_recipe.id}/images/{image.id}/set-cover/"
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        image.refresh_from_db()
        self.assertTrue(image.is_cover)

    def test_ownerless_recipe_image_mutation_is_forbidden(self):
        self.authenticate_as(self.other_token)
        image = RecipeImage.objects.create(
            recipe=self.ownerless_recipe,
            image="",
            is_cover=False,
        )

        res = self.client.patch(
            f"/api/recipes/{self.ownerless_recipe.id}/images/{image.id}/set-cover/"
        )

        self.assertIn(
            res.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        image.refresh_from_db()
        self.assertFalse(image.is_cover)


class SharedCatalogPermissionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.ingredient = Ingredient.objects.create(name="Salt")
        self.recipe = Recipe.objects.create(
            title="Seasoned",
            owner=self.user,
            is_public=True,
        )
        RecipeIngredient.objects.create(
            recipe=self.recipe,
            ingredient=self.ingredient,
            quantity=1,
            unit="tsp",
        )

    def test_unauthenticated_delete_ingredient_is_forbidden(self):
        res = self.client.delete(f"/api/ingredients/{self.ingredient.id}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Ingredient.objects.filter(pk=self.ingredient.pk).exists())
        self.assertTrue(
            RecipeIngredient.objects.filter(ingredient=self.ingredient).exists()
        )

    def test_authenticated_non_staff_delete_ingredient_is_forbidden(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.delete(f"/api/ingredients/{self.ingredient.id}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Ingredient.objects.filter(pk=self.ingredient.pk).exists())
        self.assertTrue(
            RecipeIngredient.objects.filter(ingredient=self.ingredient).exists()
        )

    def test_authenticated_user_can_create_ingredient(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        res = self.client.post(
            "/api/ingredients/",
            {"name": "Pepper"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Ingredient.objects.filter(name="Pepper").exists())
