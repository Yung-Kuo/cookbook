from rest_framework import status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from django.db.models import (
    Q,
    Max,
    Count,
    Exists,
    OuterRef,
    Value,
    BooleanField,
    Prefetch,
)
from django.shortcuts import get_object_or_404
from ..models import (
    Recipe,
    Tag,
    Ingredient,
    UserProfile,
    RecipeImage,
    Like,
    Collection,
    CollectionRecipe,
)
from .serializers import (
    RecipeSerializer,
    RecipeWriteSerializer,
    TagSerializer,
    IngredientSerializer,
    UserProfileSerializer,
    RecipeImageSerializer,
    CollectionSerializer,
    CollectionDetailSerializer,
)


class TagViewSet(ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class IngredientViewSet(ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer


class UserProfileViewSet(GenericViewSet):
    serializer_class = UserProfileSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated], url_path='me')
    def me(self, request):
        profile = request.user.profile
        if request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(self.get_serializer(profile).data)

    @action(detail=False, methods=['get'], url_path=r'user-id/(?P<user_id>[0-9]+)')
    def by_user_id(self, request, user_id=None):
        profile = get_object_or_404(UserProfile, user_id=int(user_id))
        return Response(self.get_serializer(profile).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<username>[^/.]+)')
    def by_username(self, request, username=None):
        profile = get_object_or_404(UserProfile, user__username=username)
        return Response(self.get_serializer(profile).data)


class RecipeViewSet(ModelViewSet):
    queryset = Recipe.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_fields = ['tags', 'owner', 'owner__username']
    search_fields = ['title', 'description']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RecipeWriteSerializer
        return RecipeSerializer

    def _annotate_likes(self, qs):
        user = self.request.user
        qs = qs.annotate(like_count=Count('likes', distinct=True))
        if user.is_authenticated:
            qs = qs.annotate(
                is_liked=Exists(
                    Like.objects.filter(
                        recipe_id=OuterRef('pk'),
                        user_id=user.pk,
                    )
                )
            )
        else:
            qs = qs.annotate(
                is_liked=Value(False, output_field=BooleanField())
            )
        return qs

    def get_queryset(self):
        user = self.request.user
        liked = self.request.query_params.get('liked', '').lower() == 'true'
        personal = self.request.query_params.get('personal', '').lower() == 'true'
        owner_id_param = self.request.query_params.get('owner_id', '').strip()
        owner_username = self.request.query_params.get('owner', '').strip()

        if liked:
            if not user.is_authenticated:
                qs = Recipe.objects.none()
            else:
                qs = (
                    Recipe.objects.filter(likes__user=user)
                    .filter(Q(is_public=True) | Q(owner=user))
                    .distinct()
                )
        elif personal and user.is_authenticated:
            qs = Recipe.objects.filter(owner=user)
        elif owner_id_param:
            try:
                oid = int(owner_id_param)
            except (ValueError, TypeError):
                qs = Recipe.objects.none()
            else:
                if user.is_authenticated and user.pk == oid:
                    qs = Recipe.objects.filter(owner=user)
                else:
                    qs = Recipe.objects.filter(owner_id=oid, is_public=True)
        elif owner_username:
            qs = Recipe.objects.filter(owner__username=owner_username, is_public=True)
            if user.is_authenticated and user.username == owner_username:
                qs = Recipe.objects.filter(owner=user)
        elif user.is_authenticated:
            qs = Recipe.objects.filter(Q(is_public=True) | Q(owner=user))
        else:
            qs = Recipe.objects.filter(is_public=True)

        qs = self._annotate_likes(qs)
        return qs.select_related('owner', 'owner__profile').prefetch_related('images', 'tags')

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        url_path='like',
    )
    def like(self, request, pk=None):
        recipe = self.get_object()
        like_obj = Like.objects.filter(user=request.user, recipe=recipe).first()
        if like_obj:
            like_obj.delete()
            liked = False
        else:
            Like.objects.create(user=request.user, recipe=recipe)
            liked = True
        like_count = Like.objects.filter(recipe=recipe).count()
        return Response({'liked': liked, 'like_count': like_count})

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(owner=self.request.user)
        else:
            serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        recipe = self.get_queryset().get(pk=serializer.instance.pk)
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
        serializer.save()
        recipe = self.get_queryset().get(pk=instance.pk)
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


class CollectionViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionSerializer

    def get_queryset(self):
        qs = Collection.objects.filter(user=self.request.user).annotate(
            recipe_count=Count('entries')
        )
        rid = self.request.query_params.get('recipe_id')
        if rid:
            try:
                rid_int = int(rid)
                qs = qs.annotate(
                    contains_recipe=Exists(
                        CollectionRecipe.objects.filter(
                            collection_id=OuterRef('pk'),
                            recipe_id=rid_int,
                        )
                    )
                )
            except (ValueError, TypeError):
                pass

        qs = qs.order_by('-created_at')
        if self.action == 'list':
            qs = qs.prefetch_related(
                Prefetch(
                    'entries',
                    queryset=CollectionRecipe.objects.select_related(
                        'recipe', 'recipe__owner'
                    ).prefetch_related('recipe__images').order_by('-added_at'),
                )
            )
        elif self.action == 'retrieve':
            qs = qs.prefetch_related(
                Prefetch(
                    'entries',
                    queryset=CollectionRecipe.objects.select_related(
                        'recipe', 'recipe__owner'
                    ).prefetch_related(
                        'recipe__images',
                        'recipe__tags',
                        'recipe__recipeingredient_set__ingredient',
                        'recipe__recipeinstruction_set',
                    ).order_by('-added_at'),
                )
            )
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CollectionDetailSerializer
        return CollectionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='recipes')
    def add_recipe(self, request, pk=None):
        collection = self.get_object()
        recipe_id = request.data.get('recipe_id')
        if recipe_id is None:
            return Response(
                {'detail': 'recipe_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            recipe_id = int(recipe_id)
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid recipe_id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        cr, created = CollectionRecipe.objects.get_or_create(
            collection=collection,
            recipe=recipe,
        )
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(
            {
                'id': cr.id,
                'collection_id': collection.id,
                'recipe_id': recipe.id,
                'added_at': cr.added_at,
            },
            status=code,
        )

    @action(
        detail=True,
        methods=['delete'],
        url_path=r'recipes/(?P<recipe_id>[^/.]+)',
    )
    def remove_recipe(self, request, pk=None, recipe_id=None):
        collection = self.get_object()
        try:
            rid = int(recipe_id)
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Invalid recipe id.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        deleted, _ = CollectionRecipe.objects.filter(
            collection=collection,
            recipe_id=rid,
        ).delete()
        if not deleted:
            return Response(
                {'detail': 'Recipe not in this collection.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
