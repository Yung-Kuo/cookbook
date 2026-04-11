"""
Load many public template recipes for local scroll/UI testing.

Run from the backend directory (with your virtualenv activated):

    python manage.py seed_template_recipes

Safe to run multiple times: new titles are inserted; existing template titles get
their tags re-synced to TEMPLATE_RECIPE_TAGS (so tag updates apply).
"""

from django.core.management.base import BaseCommand

from recipes.models import Ingredient, Recipe, RecipeIngredient, RecipeInstruction, Tag

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

# Parallel to TEMPLATE_TITLES: meal/course, dish type, and cuisine tags.
TEMPLATE_RECIPE_TAGS = [
    ["Breakfast", "French"],
    ["Breakfast", "American"],
    ["Breakfast", "Mediterranean"],
    ["Lunch", "Soup", "Italian"],
    ["Lunch", "Salad", "Italian"],
    ["Lunch", "American", "Snack"],
    ["Dinner", "Chinese"],
    ["Dinner", "Mexican"],
    ["Dinner", "Indian"],
    ["Dinner", "Mediterranean"],
    ["Dinner", "Italian"],
    ["Dinner", "Italian"],
    ["Dinner", "Thai"],
    ["Dinner", "Vietnamese"],
    ["Dinner", "American"],
    ["Dinner", "Soup", "Indian"],
    ["Dinner", "Mediterranean"],
    ["Dinner", "American"],
    ["Snack", "Italian"],
    ["Dessert", "American"],
    ["Dessert", "American"],
    ["Dessert", "American"],
    ["Breakfast", "American"],
    ["Breakfast", "French"],
    ["Breakfast", "Snack"],
    ["Snack", "American"],
    ["Dessert", "Snack"],
    ["Dessert", "American"],
]

TAG_NAMES = sorted({name for group in TEMPLATE_RECIPE_TAGS for name in group})


class Command(BaseCommand):
    help = (
        "Insert public template recipes for scroll testing. "
        "Run from the project backend: python manage.py seed_template_recipes"
    )

    def handle(self, *args, **options):
        if len(TEMPLATE_RECIPE_TAGS) != len(TEMPLATE_TITLES):
            raise ValueError(
                "TEMPLATE_RECIPE_TAGS must have the same length as TEMPLATE_TITLES"
            )

        tag_by_name = {n: Tag.objects.get_or_create(name=n)[0] for n in TAG_NAMES}

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
        tags_synced = 0

        for i, title in enumerate(TEMPLATE_TITLES):
            tag_objs = [tag_by_name[n] for n in TEMPLATE_RECIPE_TAGS[i]]
            existing = Recipe.objects.filter(title=title).first()
            if existing:
                existing.tags.set(tag_objs)
                tags_synced += 1
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
            recipe.tags.set(tag_objs)

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
                "seed_template_recipes: "
                f"created {created} recipe(s); "
                f"synced tags on {tags_synced} existing template recipe(s)."
            )
        )
