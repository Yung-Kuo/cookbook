import json
from rest_framework import serializers
from ..models import (
    Recipe,
    Tag,
    Ingredient,
    RecipeIngredient,
    RecipeInstruction,
    RecipeImage,
    UserProfile,
    Collection,
    PinnedRecipe,
)


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        read_only_fields = ['id']


class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name']
        read_only_fields = ['id']


class RecipeIngredientSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all())

    class Meta:
        model = RecipeIngredient
        fields = ['id', 'name', 'quantity', 'unit', 'ingredient']
        read_only_fields = ['id', 'name']


class RecipeInstructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeInstruction
        fields = ['id', 'text', 'order']


class RecipeImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = RecipeImage
        fields = ['id', 'image_url', 'is_cover', 'order']
        read_only_fields = ['id']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'user_id', 'username', 'display_name', 'bio', 'avatar', 'avatar_url', 'created_at']
        read_only_fields = ['id', 'user_id', 'username', 'created_at']
        extra_kwargs = {
            'avatar': {'write_only': True},
        }

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None


def _recipe_cover_url_from_images(recipe):
    """Return cover URL for a recipe (cover image or first image)."""
    cover = recipe.images.filter(is_cover=True).first()
    if cover and cover.image:
        return cover.image.url
    first = recipe.images.first()
    if first and first.image:
        return first.image.url
    return None


class RecipeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    recipe_ingredients = serializers.SerializerMethodField(method_name='get_recipe_ingredients')
    recipe_instructions = serializers.SerializerMethodField(method_name='get_recipe_instructions')
    owner_username = serializers.CharField(source='owner.username', read_only=True, default=None, allow_null=True)
    owner_id = serializers.IntegerField(read_only=True, allow_null=True)
    owner_display_name = serializers.SerializerMethodField()
    owner_avatar_url = serializers.SerializerMethodField()
    images = RecipeImageSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_pinned = serializers.SerializerMethodField()

    def get_like_count(self, obj):
        return getattr(obj, 'like_count', 0)

    def get_is_liked(self, obj):
        return getattr(obj, 'is_liked', False)

    def get_is_pinned(self, obj):
        return getattr(obj, 'is_pinned', False)

    def get_recipe_ingredients(self, obj):
        return RecipeIngredientSerializer(obj.recipeingredient_set.all(), many=True).data

    def get_recipe_instructions(self, obj):
        return RecipeInstructionSerializer(obj.recipeinstruction_set.all(), many=True).data

    def get_cover_image_url(self, obj):
        return _recipe_cover_url_from_images(obj)

    def get_owner_display_name(self, obj):
        owner = obj.owner
        if not owner:
            return None
        profile = getattr(owner, 'profile', None)
        if profile and profile.display_name and str(profile.display_name).strip():
            return str(profile.display_name).strip()
        return owner.username

    def get_owner_avatar_url(self, obj):
        owner = obj.owner
        if not owner:
            return None
        profile = getattr(owner, 'profile', None)
        if profile and profile.avatar:
            return profile.avatar.url
        return None

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'recipe_instructions',
            'prep_time', 'cook_time', 'servings',
            'tags', 'recipe_ingredients',
            'owner_username', 'owner_id', 'owner_display_name', 'owner_avatar_url',
            'is_public', 'images', 'cover_image_url',
            'like_count', 'is_liked', 'is_pinned',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner_username', 'owner_id', 'created_at']


class RecipeWriteSerializer(serializers.ModelSerializer):
    tags = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, required=False
    )
    recipe_ingredients = RecipeIngredientSerializer(many=True, required=False)
    recipe_instructions = RecipeInstructionSerializer(many=True, required=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'recipe_instructions',
            'prep_time', 'cook_time', 'servings',
            'tags', 'recipe_ingredients', 'is_public',
        ]

    def _parse_json_field(self, data, field_name):
        """Parse a field that may arrive as a JSON string (from FormData) or as a list."""
        value = data.get(field_name)
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        return value

    def to_internal_value(self, data):
        """Handle FormData where nested fields arrive as JSON strings."""
        if hasattr(data, 'getlist'):
            mutable = data.copy()
            for field in ('recipe_ingredients', 'recipe_instructions', 'tags'):
                parsed = self._parse_json_field(mutable, field)
                if parsed is not None:
                    mutable.pop(field, None)
                    mutable[field] = parsed
            return super().to_internal_value(mutable)
        return super().to_internal_value(data)

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        recipe_ingredients_data = validated_data.pop('recipe_ingredients', [])
        recipe_instructions_data = validated_data.pop('recipe_instructions', [])

        recipe = Recipe.objects.create(**validated_data)
        if tags_data:
            recipe.tags.set(tags_data)

        for ingredient_data in recipe_ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **ingredient_data)

        for instruction_data in recipe_instructions_data:
            RecipeInstruction.objects.create(recipe=recipe, **instruction_data)

        return recipe

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        recipe_ingredients_data = validated_data.pop('recipe_ingredients', None)
        recipe_instructions_data = validated_data.pop('recipe_instructions', None)

        instance = super().update(instance, validated_data)

        if tags_data is not None:
            instance.tags.set(tags_data)

        if recipe_ingredients_data is not None:
            instance.recipeingredient_set.all().delete()
            for ingredient_data in recipe_ingredients_data:
                RecipeIngredient.objects.create(recipe=instance, **ingredient_data)

        if recipe_instructions_data is not None:
            instance.recipeinstruction_set.all().delete()
            for instruction_data in recipe_instructions_data:
                instruction_data = {
                    k: v for k, v in instruction_data.items() if k != "id"
                }
                RecipeInstruction.objects.create(recipe=instance, **instruction_data)

        return instance


class CollectionSerializer(serializers.ModelSerializer):
    recipe_count = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    recipe_cover_urls = serializers.SerializerMethodField()
    contains_recipe = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            'id', 'name', 'description', 'is_public', 'created_at',
            'recipe_count', 'cover_image_url', 'recipe_cover_urls', 'contains_recipe',
        ]
        read_only_fields = [
            'id', 'created_at', 'recipe_count', 'cover_image_url',
            'recipe_cover_urls', 'contains_recipe',
        ]

    def get_recipe_count(self, obj):
        return getattr(obj, 'recipe_count', 0)

    def get_contains_recipe(self, obj):
        return getattr(obj, 'contains_recipe', False)

    def _visible_entries(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        entries = getattr(obj, '_prefetched_objects_cache', {}).get('entries')
        if entries is None:
            entries = (
                obj.entries.select_related('recipe', 'recipe__owner')
                .prefetch_related('recipe__images')
                .order_by('-added_at')
            )
        out = []
        for entry in entries:
            r = entry.recipe
            if r.is_public or (user and r.owner_id == user.pk):
                out.append(entry)
        return out

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.url
        for entry in self._visible_entries(obj):
            url = _recipe_cover_url_from_images(entry.recipe)
            if url:
                return url
        return None

    def get_recipe_cover_urls(self, obj):
        urls = []
        for entry in self._visible_entries(obj):
            url = _recipe_cover_url_from_images(entry.recipe)
            if url:
                urls.append(url)
            if len(urls) >= 4:
                break
        while len(urls) < 4:
            urls.append(None)
        return urls[:4]


class CollectionDetailSerializer(serializers.ModelSerializer):
    entries = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'description', 'is_public', 'created_at', 'entries']
        read_only_fields = ['id', 'name', 'description', 'created_at', 'entries']

    def get_entries(self, collection):
        request = self.context['request']
        user = request.user
        qs = (
            collection.entries.select_related('recipe', 'recipe__owner')
            .prefetch_related(
                'recipe__images',
                'recipe__tags',
                'recipe__recipeingredient_set__ingredient',
                'recipe__recipeinstruction_set',
            )
            .order_by('-added_at')
        )
        read_ctx = {'request': request}
        out = []
        for entry in qs:
            r = entry.recipe
            is_available = r.is_public or (user.is_authenticated and r.owner_id == user.pk)
            if is_available:
                out.append({
                    'added_at': entry.added_at,
                    'is_available': True,
                    'recipe_id': r.id,
                    'recipe': RecipeSerializer(r, context=read_ctx).data,
                })
            else:
                out.append({
                    'added_at': entry.added_at,
                    'is_available': False,
                    'recipe_id': r.id,
                    'recipe': None,
                })
        return out


class PinnedRecipeSerializer(serializers.ModelSerializer):
    """Pinned recipe row for profile; nested recipe card fields."""

    recipe = serializers.SerializerMethodField()

    class Meta:
        model = PinnedRecipe
        fields = ['order', 'recipe']

    def get_recipe(self, obj):
        r = obj.recipe
        return {
            'id': r.id,
            'title': r.title,
            'cover_image_url': _recipe_cover_url_from_images(r),
            'is_public': r.is_public,
            'owner_id': r.owner_id,
        }
