"""
Load many public template recipes for local scroll/UI testing.

Run from the backend directory (with your virtualenv activated):

    python manage.py seed_template_recipes

Safe to run multiple times: existing titles prefixed with "Template:" are skipped.
"""

from django.core.management.base import BaseCommand

from recipes.models import Ingredient, Recipe, RecipeIngredient, RecipeInstruction, Tag


TAG_NAMES = ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack"]

# Titles must stay stable so re-runs stay idempotent.
TEMPLATE_TITLES = [
    "Template: Herb omelette",
    "Template: Avocado toast",
    "Template: Greek yogurt bowl",
    "Template: Tomato basil soup",
    "Template: Caesar salad",
    "Template: Grilled cheese",
    "Template: Chicken stir-fry",
    "Template: Beef tacos",
    "Template: Veggie curry",
    "Template: Baked salmon",
    "Template: Mushroom risotto",
    "Template: Spaghetti marinara",
    "Template: Pad thai",
    "Template: Fried rice",
    "Template: Bean chili",
    "Template: Lentil stew",
    "Template: Roasted vegetables",
    "Template: Mashed potatoes",
    "Template: Garlic bread",
    "Template: Chocolate chip cookies",
    "Template: Brownies",
    "Template: Fruit crumble",
    "Template: Pancakes",
    "Template: French toast",
    "Template: Smoothie bowl",
    "Template: Granola bars",
    "Template: Banana bread",
    "Template: Apple crisp",
]


class Command(BaseCommand):
    help = (
        "Insert public template recipes for scroll testing. "
        "Run from the project backend: python manage.py seed_template_recipes"
    )

    def handle(self, *args, **options):
        tags = [Tag.objects.get_or_create(name=n)[0] for n in TAG_NAMES]

        ingredient_rows = [
            ("Salt", 1, "tsp"),
            ("Black pepper", 0.5, "tsp"),
            ("Olive oil", 2, "tbsp"),
            ("Butter", 1, "tbsp"),
            ("Garlic", 2, "cloves"),
        ]
        ingredients = []
        for name, qty, unit in ingredient_rows:
            ing, _ = Ingredient.objects.get_or_create(name=name)
            ingredients.append((ing, qty, unit))

        created = 0
        skipped = 0

        for i, title in enumerate(TEMPLATE_TITLES):
            if Recipe.objects.filter(title=title).exists():
                skipped += 1
                continue

            recipe = Recipe.objects.create(
                title=title,
                description=f"Demo recipe for UI testing ({title}).",
                prep_time=10 + (i % 20),
                cook_time=15 + (i % 45),
                servings=2 + (i % 6),
                is_public=True,
                owner=None,
            )
            recipe.tags.add(tags[i % len(tags)])

            for ing, qty, unit in ingredients:
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    ingredient=ing,
                    quantity=qty,
                    unit=unit,
                )

            RecipeInstruction.objects.create(
                recipe=recipe,
                text="Prepare ingredients and workspace.",
                order=1,
            )
            RecipeInstruction.objects.create(
                recipe=recipe,
                text="Cook according to the recipe style; taste and adjust seasoning.",
                order=2,
            )
            RecipeInstruction.objects.create(
                recipe=recipe,
                text="Serve warm and enjoy.",
                order=3,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"seed_template_recipes: created {created} recipe(s), skipped {skipped} existing."
            )
        )
