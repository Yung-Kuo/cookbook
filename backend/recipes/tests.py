from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.models import (
    Collection,
    CollectionRecipe,
    Ingredient,
    Like,
    Recipe,
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
        self.user = User.objects.create_user(username="chef", password="pass")
        self.other = User.objects.create_user(username="other", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.ownerless = Recipe.objects.create(
            title="Template",
            owner=None,
            is_public=True,
        )
        self.owned = Recipe.objects.create(
            title="Mine",
            owner=self.user,
            is_public=True,
        )

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_authenticated_user_cannot_edit_ownerless_recipe(self):
        self.authenticate()
        res = self.client.patch(
            f"/api/recipes/{self.ownerless.id}/",
            {"title": "Hijacked"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.ownerless.refresh_from_db()
        self.assertEqual(self.ownerless.title, "Template")

    def test_authenticated_user_cannot_delete_ownerless_recipe(self):
        self.authenticate()
        res = self.client.delete(f"/api/recipes/{self.ownerless.id}/")

        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.ownerless.pk).exists())

    def test_owner_can_still_edit_own_recipe(self):
        self.authenticate()
        res = self.client.patch(
            f"/api/recipes/{self.owned.id}/",
            {"title": "Updated"},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.owned.refresh_from_db()
        self.assertEqual(self.owned.title, "Updated")


class IngredientPermissionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chef", password="pass")
        self.token = Token.objects.create(user=self.user)
        self.recipe = Recipe.objects.create(
            title="Soup",
            owner=self.user,
            is_public=True,
        )
        self.ingredient = Ingredient.objects.create(name="Salt")
        self.recipe_ingredient = RecipeIngredient.objects.create(
            recipe=self.recipe,
            ingredient=self.ingredient,
            quantity=1,
            unit="tsp",
        )

    def test_anonymous_user_cannot_delete_shared_ingredient(self):
        res = self.client.delete(f"/api/ingredients/{self.ingredient.id}/")

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertTrue(Ingredient.objects.filter(pk=self.ingredient.pk).exists())
        self.assertTrue(
            RecipeIngredient.objects.filter(pk=self.recipe_ingredient.pk).exists()
        )

    def test_authenticated_user_cannot_delete_shared_ingredient(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.delete(f"/api/ingredients/{self.ingredient.id}/")

        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertTrue(Ingredient.objects.filter(pk=self.ingredient.pk).exists())
        self.assertTrue(
            RecipeIngredient.objects.filter(pk=self.recipe_ingredient.pk).exists()
        )


class CollectionRecipePermissionTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="pass")
        self.viewer = User.objects.create_user(username="viewer", password="pass")
        self.viewer_token = Token.objects.create(user=self.viewer)
        self.collection = Collection.objects.create(
            user=self.viewer,
            name="Saved",
            is_public=False,
        )
        self.private_recipe = Recipe.objects.create(
            title="Private",
            owner=self.owner,
            is_public=False,
        )
        self.public_recipe = Recipe.objects.create(
            title="Public",
            owner=self.owner,
            is_public=True,
        )

    def authenticate(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.viewer_token.key}")

    def test_cannot_add_another_users_private_recipe_to_collection(self):
        self.authenticate()
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

    def test_can_add_visible_public_recipe_to_collection(self):
        self.authenticate()
        res = self.client.post(
            f"/api/collections/{self.collection.id}/recipes/",
            {"recipe_id": self.public_recipe.id},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CollectionRecipe.objects.filter(
                collection=self.collection,
                recipe=self.public_recipe,
            ).exists()
        )
