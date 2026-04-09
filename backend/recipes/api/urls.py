from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecipeViewSet,
    TagViewSet,
    IngredientViewSet,
    UserProfileViewSet,
    CollectionViewSet,
)

recipe_router = DefaultRouter()
recipe_router.register(r'recipes', RecipeViewSet)
recipe_router.register(r'tags', TagViewSet)
recipe_router.register(r'ingredients', IngredientViewSet)
recipe_router.register(r'profiles', UserProfileViewSet, basename='profile')
recipe_router.register(r'collections', CollectionViewSet, basename='collection')