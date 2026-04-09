from django.conf import settings
from django.db import models
from cloudinary.models import CloudinaryField


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar = CloudinaryField('avatar', folder='cookbook/avatars', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s profile"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Recipe(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    image = CloudinaryField('image', folder='cookbook/recipes', blank=True, null=True)
    prep_time = models.IntegerField(help_text="Preparation time in minutes", null=True, blank=True, default=None)
    cook_time = models.IntegerField(help_text="Cooking time in minutes", null=True, blank=True, default=None)
    servings = models.IntegerField(null=True, blank=True, default=None)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='recipes')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.FloatField()
    unit = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        unique_together = ('recipe', 'ingredient')

    def __str__(self):
        return f"{self.ingredient.name}: {self.quantity} {self.unit} for {self.recipe.title}"

class RecipeInstruction(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    text = models.TextField()
    order = models.PositiveIntegerField()

    class Meta:
        unique_together = ('recipe', 'order')
        ordering = ['order']

    def __str__(self):
        return f"Step {self.order} for {self.recipe.title}: {self.text[:50]}..."
