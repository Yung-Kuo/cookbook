# Data migration: Category -> Tag + recipe.tags; Recipe.image -> RecipeImage (cover)

from django.db import migrations


def migrate_forward(apps, schema_editor):
    Category = apps.get_model('recipes', 'Category')
    Tag = apps.get_model('recipes', 'Tag')
    Recipe = apps.get_model('recipes', 'Recipe')
    RecipeImage = apps.get_model('recipes', 'RecipeImage')

    for cat in Category.objects.all():
        Tag.objects.get_or_create(name=cat.name)

    for recipe in Recipe.objects.all():
        if recipe.category_id:
            cat = Category.objects.get(pk=recipe.category_id)
            tag, _ = Tag.objects.get_or_create(name=cat.name)
            recipe.tags.add(tag)

    for recipe in Recipe.objects.all():
        if recipe.image:
            RecipeImage.objects.create(
                recipe=recipe,
                image=recipe.image,
                is_cover=True,
                order=0,
            )


def migrate_backward(apps, schema_editor):
    RecipeImage = apps.get_model('recipes', 'RecipeImage')
    Tag = apps.get_model('recipes', 'Tag')
    Recipe = apps.get_model('recipes', 'Recipe')

    RecipeImage.objects.all().delete()
    for recipe in Recipe.objects.all():
        recipe.tags.clear()
    Tag.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0007_add_tags_recipeimage_and_m2m'),
    ]

    operations = [
        migrations.RunPython(migrate_forward, migrate_backward),
    ]
