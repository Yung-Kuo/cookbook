from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet, CategoryViewSet, IngredientViewSet

recipe_router = DefaultRouter()
recipe_router.register(r'recipes', RecipeViewSet)
recipe_router.register(r'categories', CategoryViewSet)
recipe_router.register(r'ingredients', IngredientViewSet)