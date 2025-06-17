from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ..models import Recipe, Category, Ingredient, RecipeIngredient
from .serializers import (
    RecipeSerializer,
    RecipeWriteSerializer,
    CategorySerializer,
    IngredientSerializer,
)

class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class IngredientViewSet(ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

class RecipeViewSet(ModelViewSet):
    queryset = Recipe.objects.all()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeWriteSerializer
        return RecipeSerializer
    
    # def create(self, request, *args, **kwargs):

    #     # print(request.data)
    #     # return super().create(request, *args, **kwargs)

    #     serializer = self.get_serializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)

    #     validated_data = serializer.validated_data

    #     # Pop the nested data first
    #     recipe_ingredients_data = validated_data.pop('recipe_ingredients', [])
        
    #     # Create the Recipe instance
    #     recipe = Recipe.objects.create(**validated_data)

    #     # Create RecipeIngredient instances
    #     for ingredient_data in recipe_ingredients_data:
    #         # The 'ingredient' key in ingredient_data will already be an Ingredient instance
    #         # because PrimaryKeyRelatedField handled the lookup for us.
    #         RecipeIngredient.objects.create(recipe=recipe, **ingredient_data)

    #     # self.perform_create(serializer)
    #     headers = self.get_success_headers(serializer.data)
    #     return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


