from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from ..models import Recipe, Category, Ingredient, RecipeIngredient, RecipeInstruction
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
    
    
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        recipe = serializer.save()
        # Now serialize with the read serializer
        read_serializer = RecipeSerializer(recipe, context={'request': request})
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


