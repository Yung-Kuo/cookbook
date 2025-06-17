from django.contrib import admin
from .models import Category, Ingredient, Recipe, RecipeIngredient

# Register your models here.
admin.site.register(Category)
admin.site.register(Ingredient)
admin.site.register(RecipeIngredient)
admin.site.register(Recipe)