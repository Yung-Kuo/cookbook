from rest_framework.routers import DefaultRouter
from recipes.api.urls import recipe_router
from django.urls import path, include

router = DefaultRouter()

#recipes
router.registry.extend(recipe_router.registry)

urlpatterns = [
    path('', include(router.urls))
]