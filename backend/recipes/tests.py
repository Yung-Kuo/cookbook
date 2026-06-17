from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from recipes.models import Collection, CollectionRecipe, Like, Recipe, Tag

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


class CollectionRecipePrivacyTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="pass")
        self.viewer = User.objects.create_user(username="viewer", password="pass")
        self.owner_token = Token.objects.create(user=self.owner)
        self.viewer_token = Token.objects.create(user=self.viewer)
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

    def test_cannot_add_another_users_private_recipe_to_collection(self):
        collection = Collection.objects.create(user=self.viewer, name="Viewer")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.viewer_token.key}")

        res = self.client.post(
            f"/api/collections/{collection.id}/recipes/",
            {"recipe_id": self.private_recipe.id},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(
            CollectionRecipe.objects.filter(
                collection=collection,
                recipe=self.private_recipe,
            ).exists()
        )

    def test_can_add_visible_recipe_to_collection(self):
        collection = Collection.objects.create(user=self.viewer, name="Viewer")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.viewer_token.key}")

        res = self.client.post(
            f"/api/collections/{collection.id}/recipes/",
            {"recipe_id": self.public_recipe.id},
            format="json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CollectionRecipe.objects.filter(
                collection=collection,
                recipe=self.public_recipe,
            ).exists()
        )

    def test_contains_recipe_does_not_reveal_private_membership_to_other_users(self):
        collection = Collection.objects.create(
            user=self.owner,
            name="Owner public",
            is_public=True,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.private_recipe,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.viewer_token.key}")

        res = self.client.get(
            "/api/collections/",
            {"user_id": self.owner.id, "recipe_id": self.private_recipe.id},
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]["contains_recipe"])
        self.assertEqual(res.data[0]["recipe_count"], 0)

    def test_owner_still_sees_private_collection_membership(self):
        collection = Collection.objects.create(
            user=self.owner,
            name="Owner public",
            is_public=True,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.private_recipe,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.owner_token.key}")

        res = self.client.get(
            "/api/collections/",
            {"user_id": self.owner.id, "recipe_id": self.private_recipe.id},
        )

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertTrue(res.data[0]["contains_recipe"])
        self.assertEqual(res.data[0]["recipe_count"], 1)

    def test_collection_detail_omits_private_entries_from_other_users(self):
        collection = Collection.objects.create(
            user=self.owner,
            name="Owner public",
            is_public=True,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.private_recipe,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.public_recipe,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.viewer_token.key}")

        res = self.client.get(f"/api/collections/{collection.id}/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        recipe_ids = {entry["recipe_id"] for entry in res.data["entries"]}
        self.assertEqual(recipe_ids, {self.public_recipe.id})

    def test_collection_owner_sees_private_entries_in_detail(self):
        collection = Collection.objects.create(
            user=self.owner,
            name="Owner public",
            is_public=True,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.private_recipe,
        )
        CollectionRecipe.objects.create(
            collection=collection,
            recipe=self.public_recipe,
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.owner_token.key}")

        res = self.client.get(f"/api/collections/{collection.id}/")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        recipe_ids = {entry["recipe_id"] for entry in res.data["entries"]}
        self.assertEqual(recipe_ids, {self.private_recipe.id, self.public_recipe.id})
