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


class RecipeSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    recipe_ingredients = serializers.SerializerMethodField(method_name='get_recipe_ingredients')
    recipe_instructions = serializers.SerializerMethodField(method_name='get_recipe_instructions')
    owner_username = serializers.CharField(source='owner.username', read_only=True, default=None, allow_null=True)
    owner_id = serializers.IntegerField(read_only=True, allow_null=True)
    images = RecipeImageSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    heart_count = serializers.SerializerMethodField()
    is_hearted = serializers.SerializerMethodField()

    def get_heart_count(self, obj):
        return getattr(obj, 'heart_count', 0)

    def get_is_hearted(self, obj):
        return getattr(obj, 'is_hearted', False)

    def get_recipe_ingredients(self, obj):
        return RecipeIngredientSerializer(obj.recipeingredient_set.all(), many=True).data

    def get_recipe_instructions(self, obj):
        return RecipeInstructionSerializer(obj.recipeinstruction_set.all(), many=True).data

    def get_cover_image_url(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if cover and cover.image:
            return cover.image.url
        first = obj.images.first()
        if first and first.image:
            return first.image.url
        return None

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'recipe_instructions',
            'prep_time', 'cook_time', 'servings',
            'tags', 'recipe_ingredients',
            'owner_username', 'owner_id', 'is_public', 'images', 'cover_image_url',
            'heart_count', 'is_hearted',
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
    contains_recipe = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            'id', 'name', 'description', 'created_at',
            'recipe_count', 'cover_image_url', 'contains_recipe',
        ]
        read_only_fields = ['id', 'created_at', 'recipe_count', 'cover_image_url', 'contains_recipe']

    def get_recipe_count(self, obj):
        return getattr(obj, 'recipe_count', 0)

    def get_contains_recipe(self, obj):
        return getattr(obj, 'contains_recipe', False)

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        entries = getattr(obj, '_prefetched_objects_cache', {}).get('entries')
        if entries is None:
            entries = (
                obj.entries.select_related('recipe', 'recipe__owner')
                .prefetch_related('recipe__images')
                .order_by('-added_at')
            )
        for entry in entries:
            r = entry.recipe
            if r.is_public or (user and r.owner_id == user.pk):
                cover = r.images.filter(is_cover=True).first()
                if cover and cover.image:
                    return cover.image.url
                first = r.images.first()
                if first and first.image:
                    return first.image.url
        return None


class CollectionDetailSerializer(serializers.ModelSerializer):
    entries = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = ['id', 'name', 'description', 'created_at', 'entries']
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
