from rest_framework.routers import DefaultRouter
from recipes.api.urls import recipe_router
from django.urls import path, include

from core.health import health

router = DefaultRouter()

#recipes
router.registry.extend(recipe_router.registry)

urlpatterns = [
    path("health/", health),
    path('', include(router.urls)),
]