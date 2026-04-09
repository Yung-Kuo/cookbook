import json
from rest_framework import serializers
from ..models import Recipe, Category, Ingredient, RecipeIngredient, RecipeInstruction, UserProfile


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
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


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'display_name', 'bio', 'avatar', 'avatar_url', 'created_at']
        read_only_fields = ['id', 'username', 'created_at']
        extra_kwargs = {
            'avatar': {'write_only': True},
        }

    def get_avatar_url(self, obj):
        if obj.avatar:
            return obj.avatar.url
        return None


class RecipeSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    recipe_ingredients = serializers.SerializerMethodField(method_name='get_recipe_ingredients')
    recipe_instructions = serializers.SerializerMethodField(method_name='get_recipe_instructions')
    owner = serializers.CharField(source='owner.username', read_only=True, default=None)
    image_url = serializers.SerializerMethodField()

    def get_recipe_ingredients(self, obj):
        return RecipeIngredientSerializer(obj.recipeingredient_set.all(), many=True).data

    def get_recipe_instructions(self, obj):
        return RecipeInstructionSerializer(obj.recipeinstruction_set.all(), many=True).data

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'recipe_instructions',
            'prep_time', 'cook_time', 'servings',
            'category', 'recipe_ingredients',
            'owner', 'is_public', 'image_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'created_at']


class RecipeWriteSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), allow_null=True
    )
    recipe_ingredients = RecipeIngredientSerializer(many=True, required=False)
    recipe_instructions = RecipeInstructionSerializer(many=True, required=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'recipe_instructions',
            'prep_time', 'cook_time', 'servings',
            'category', 'recipe_ingredients', 'is_public', 'image',
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
            for field in ('recipe_ingredients', 'recipe_instructions'):
                parsed = self._parse_json_field(mutable, field)
                if parsed is not None:
                    mutable.pop(field, None)
                    mutable[field] = parsed
            return super().to_internal_value(mutable)
        return super().to_internal_value(data)

    def create(self, validated_data):
        recipe_ingredients_data = validated_data.pop('recipe_ingredients', [])
        recipe_instructions_data = validated_data.pop('recipe_instructions', [])

        recipe = Recipe.objects.create(**validated_data)

        for ingredient_data in recipe_ingredients_data:
            RecipeIngredient.objects.create(recipe=recipe, **ingredient_data)

        for instruction_data in recipe_instructions_data:
            RecipeInstruction.objects.create(recipe=recipe, **instruction_data)

        return recipe

    def update(self, instance, validated_data):
        recipe_ingredients_data = validated_data.pop('recipe_ingredients', None)
        recipe_instructions_data = validated_data.pop('recipe_instructions', None)

        instance = super().update(instance, validated_data)

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