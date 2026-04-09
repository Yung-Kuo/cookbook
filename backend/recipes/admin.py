from django.contrib import admin
from .models import (
    Tag,
    Ingredient,
    Recipe,
    RecipeImage,
    RecipeIngredient,
    RecipeInstruction,
    Heart,
    Collection,
    CollectionRecipe,
)

# Register your models here.
admin.site.register(Tag)
admin.site.register(Ingredient)
admin.site.register(RecipeIngredient)
admin.site.register(RecipeInstruction)
admin.site.register(Recipe)
admin.site.register(RecipeImage)
admin.site.register(Heart)
admin.site.register(Collection)
admin.site.register(CollectionRecipe)