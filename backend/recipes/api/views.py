from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import RetrieveModelMixin, UpdateModelMixin
from django.db.models import Q, Max
from django.shortcuts import get_object_or_404
from ..models import Recipe, Tag, Ingredient, UserProfile, RecipeImage
from .serializers import (
    RecipeSerializer,
    RecipeWriteSerializer,
    TagSerializer,
    IngredientSerializer,
    UserProfileSerializer,
    RecipeImageSerializer,
)


class TagViewSet(ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class IngredientViewSet(ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer


class UserProfileViewSet(RetrieveModelMixin, UpdateModelMixin, GenericViewSet):
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        return self.request.user.profile

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        profile = request.user.profile
        if request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<username>[^/.]+)')
    def by_username(self, request, username=None):
        profile = get_object_or_404(UserProfile, user__username=username)
        return Response(self.get_serializer(profile).data)


class RecipeViewSet(ModelViewSet):
    queryset = Recipe.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['tags', 'owner__username']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeWriteSerializer
        return RecipeSerializer

    def get_queryset(self):
        user = self.request.user
        personal = self.request.query_params.get('personal', '').lower() == 'true'
        owner_username = self.request.query_params.get('owner', '').strip()

        if personal and user.is_authenticated:
            qs = Recipe.objects.filter(owner=user)
        elif owner_username:
            qs = Recipe.objects.filter(owner__username=owner_username, is_public=True)
            if user.is_authenticated and user.username == owner_username:
                qs = Recipe.objects.filter(owner=user)
        elif user.is_authenticated:
            qs = Recipe.objects.filter(Q(is_public=True) | Q(owner=user))
        else:
            qs = Recipe.objects.filter(is_public=True)

        return qs.prefetch_related('images', 'tags')

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

    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        url_path='images',
    )
    def upload_image(self, request, pk=None):
        """POST multipart with field 'image' and optional 'is_cover' (true/false)."""
        recipe = self.get_object()
        if recipe.owner and recipe.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this recipe."},
                status=status.HTTP_403_FORBIDDEN,
            )
        image_file = request.FILES.get('image')
        if not image_file:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        is_cover = str(request.data.get('is_cover', 'false')).lower() in ('1', 'true', 'yes')
        max_order = recipe.images.aggregate(m=Max('order'))['m']
        next_order = (max_order or 0) + 1

        if is_cover:
            recipe.images.update(is_cover=False)

        ri = RecipeImage.objects.create(
            recipe=recipe,
            image=image_file,
            is_cover=is_cover,
            order=next_order,
        )
        return Response(RecipeImageSerializer(ri).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=['delete'],
        url_path=r'images/(?P<image_id>[^/.]+)',
    )
    def delete_image(self, request, pk=None, image_id=None):
        recipe = self.get_object()
        if recipe.owner and recipe.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this recipe."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ri = get_object_or_404(RecipeImage, pk=image_id, recipe=recipe)
        was_cover = ri.is_cover
        ri.delete()
        if was_cover:
            first = recipe.images.order_by('order').first()
            if first:
                first.is_cover = True
                first.save(update_fields=['is_cover'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=['patch'],
        url_path=r'images/(?P<image_id>[^/.]+)/set-cover',
    )
    def set_cover_image(self, request, pk=None, image_id=None):
        recipe = self.get_object()
        if recipe.owner and recipe.owner != request.user:
            return Response(
                {"detail": "You do not have permission to edit this recipe."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ri = get_object_or_404(RecipeImage, pk=image_id, recipe=recipe)
        recipe.images.update(is_cover=False)
        ri.is_cover = True
        ri.save(update_fields=['is_cover'])
        return Response(RecipeImageSerializer(ri).data)
