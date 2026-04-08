from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from django.db.models import Q
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

class IsOwnerOrReadOnly:
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.owner == request.user

class RecipeViewSet(ModelViewSet):
    queryset = Recipe.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeWriteSerializer
        return RecipeSerializer

    def get_queryset(self):
        user = self.request.user
        personal = self.request.query_params.get('personal', '').lower() == 'true'
        owner_username = self.request.query_params.get('owner', '').strip()

        if personal and user.is_authenticated:
            return Recipe.objects.filter(owner=user)

        if owner_username:
            qs = Recipe.objects.filter(owner__username=owner_username, is_public=True)
            if user.is_authenticated and user.username == owner_username:
                qs = Recipe.objects.filter(owner=user)
            return qs

        if user.is_authenticated:
            return Recipe.objects.filter(Q(is_public=True) | Q(owner=user))

        return Recipe.objects.filter(is_public=True)

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        recipe = serializer.instance
        read_serializer = RecipeSerializer(recipe, context={'request': request})
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        if instance.owner and instance.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this recipe."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        recipe = serializer.save()
        read_serializer = RecipeSerializer(recipe, context={"request": request})
        return Response(read_serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.owner and instance.owner != request.user:
            return Response(
                {"detail": "You do not have permission to delete this recipe."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)
