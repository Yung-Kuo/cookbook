import django_filters

from ..models import Recipe, Tag


class RecipeFilter(django_filters.FilterSet):
    """Tag filter uses AND: recipes must include every selected tag."""

    tags = django_filters.ModelMultipleChoiceFilter(
        field_name="tags",
        queryset=Tag.objects.all(),
        conjoined=True,
    )

    class Meta:
        model = Recipe
        fields = ["owner", "owner__username"]
