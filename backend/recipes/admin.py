from django.contrib import admin
from .models import Category, Ingredient, Recipe, RecipeIngredient, RecipeInstruction

# Register your models here.
admin.site.register(Category)
admin.site.register(Ingredient)
admin.site.register(RecipeIngredient)
admin.site.register(RecipeInstruction)
admin.site.register(Recipe)