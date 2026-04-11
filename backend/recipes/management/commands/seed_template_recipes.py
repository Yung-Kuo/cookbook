"""
Load many public template recipes for local scroll/UI testing.

Run from the backend directory (with your virtualenv activated):

    python manage.py seed_template_recipes

Safe to run multiple times: new titles are inserted; existing template titles get
their tags re-synced to TEMPLATE_RECIPE_TAGS (so tag updates apply).

When Cloudinary env vars are set, each template recipe gets one or two stock food
photos (Pexels URLs uploaded via Cloudinary). Recipes that already have images are
skipped unless you pass --replace-template-images (deletes and re-uploads).
"""

from django.conf import settings
from django.core.management.base import BaseCommand

from recipes.models import (
    Ingredient,
    Recipe,
    RecipeImage,
    RecipeIngredient,
    RecipeInstruction,
    Tag,
)

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

# Stock food photos (Pexels — free to use). Optional second URL adds a gallery strip in the UI.


def _pexels(photo_id: int) -> str:
    return (
        f"https://images.pexels.com/photos/{photo_id}/pexels-photo-{photo_id}.jpeg"
        "?auto=compress&cs=tinysrgb&w=1600"
    )


_STOCK = {
    "eggs": _pexels(6210743),
    "avocado": _pexels(1640777),
    "yogurt": _pexels(3184183),
    "soup": _pexels(1437267),
    "salad": _pexels(1640777),
    "sandwich": _pexels(1040685),
    "wok": _pexels(3296273),
    "tacos": _pexels(7259913),
    "curry": _pexels(7625056),
    "salmon": _pexels(1435899),
    "risotto": _pexels(376464),
    "pasta": _pexels(3184183),
    "noodles": _pexels(3296273),
    "fried_rice": _pexels(6210743),
    "chili": _pexels(7692896),
    "stew": _pexels(1437267),
    "veg": _pexels(1640772),
    "potatoes": _pexels(842142),
    "bread": _pexels(1640784),
    "cookies": _pexels(1640783),
    "brownies": _pexels(376464),
    "dessert": _pexels(1640774),
    "pancakes": _pexels(1040685),
    "french_toast": _pexels(6210743),
    "smoothie": _pexels(3184183),
    "granola": _pexels(1647163),
    "banana_bread": _pexels(1640780),
    "apple": _pexels(1640784),
    "prep": _pexels(1640773),
}

# Parallel to TEMPLATE_TITLES: [cover, ...optional gallery]
TEMPLATE_RECIPE_IMAGE_URLS = [
    [_STOCK["eggs"], _STOCK["prep"]],
    [_STOCK["avocado"]],
    [_STOCK["yogurt"], _STOCK["prep"]],
    [_STOCK["soup"]],
    [_STOCK["salad"], _STOCK["prep"]],
    [_STOCK["sandwich"]],
    [_STOCK["wok"], _STOCK["prep"]],
    [_STOCK["tacos"]],
    [_STOCK["curry"]],
    [_STOCK["salmon"], _STOCK["prep"]],
    [_STOCK["risotto"]],
    [_STOCK["pasta"], _STOCK["prep"]],
    [_STOCK["noodles"]],
    [_STOCK["fried_rice"], _STOCK["prep"]],
    [_STOCK["chili"]],
    [_STOCK["stew"]],
    [_STOCK["veg"], _STOCK["prep"]],
    [_STOCK["potatoes"]],
    [_STOCK["bread"], _STOCK["prep"]],
    [_STOCK["cookies"]],
    [_STOCK["brownies"], _STOCK["prep"]],
    [_STOCK["dessert"]],
    [_STOCK["pancakes"], _STOCK["prep"]],
    [_STOCK["french_toast"]],
    [_STOCK["smoothie"], _STOCK["prep"]],
    [_STOCK["granola"]],
    [_STOCK["banana_bread"], _STOCK["prep"]],
    [_STOCK["apple"]],
]


class Command(BaseCommand):
    help = (
        "Insert public template recipes for scroll testing. "
        "Run from the project backend: python manage.py seed_template_recipes"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--replace-template-images",
            action="store_true",
            help=(
                "Delete existing photos on template recipes and re-upload stock images "
                "(requires Cloudinary)."
            ),
        )

    def handle(self, *args, **options):
        replace_images = options["replace_template_images"]
        if len(TEMPLATE_RECIPE_TAGS) != len(TEMPLATE_TITLES):
            raise ValueError(
                "TEMPLATE_RECIPE_TAGS must have the same length as TEMPLATE_TITLES"
            )
        if len(TEMPLATE_RECIPE_IMAGE_URLS) != len(TEMPLATE_TITLES):
            raise ValueError(
                "TEMPLATE_RECIPE_IMAGE_URLS must have the same length as TEMPLATE_TITLES"
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
        images_created = 0
        recipes_skipped_images_present = 0
        cloud_ok = self._cloudinary_ready()
        if not cloud_ok:
            self.stdout.write(
                self.style.WARNING(
                    "CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET not set; "
                    "skipping recipe images."
                )
            )

        for i, title in enumerate(TEMPLATE_TITLES):
            tag_objs = [tag_by_name[n] for n in TEMPLATE_RECIPE_TAGS[i]]
            existing = Recipe.objects.filter(title=title).first()
            if existing:
                existing.tags.set(tag_objs)
                tags_synced += 1
                recipe = existing
            else:
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

            had_images_before = recipe.images.exists()
            if replace_images and cloud_ok and had_images_before:
                recipe.images.all().delete()
            n_new = self._ensure_template_images(
                recipe, TEMPLATE_RECIPE_IMAGE_URLS[i], cloud_ok
            )
            images_created += n_new
            if cloud_ok and had_images_before and n_new == 0 and not replace_images:
                recipes_skipped_images_present += 1

        msg = (
            f"seed_template_recipes: created {created} recipe(s); "
            f"synced tags on {tags_synced} existing template recipe(s)."
        )
        if cloud_ok:
            msg += (
                f" Added {images_created} image(s)"
                f" ({recipes_skipped_images_present} recipes already had photos)."
            )
        self.stdout.write(self.style.SUCCESS(msg))

    def _cloudinary_ready(self):
        c = getattr(settings, "CLOUDINARY_STORAGE", None) or {}
        return bool(c.get("CLOUD_NAME") and c.get("API_KEY") and c.get("API_SECRET"))

    def _ensure_template_images(self, recipe, image_urls, cloud_ok):
        """Upload remote URLs to Cloudinary; return number of RecipeImage rows created."""
        if not cloud_ok or not image_urls:
            return 0
        if recipe.images.exists():
            return 0

        import cloudinary
        import cloudinary.uploader

        c = settings.CLOUDINARY_STORAGE
        cloudinary.config(
            cloud_name=c["CLOUD_NAME"],
            api_key=c["API_KEY"],
            api_secret=c["API_SECRET"],
        )

        created = 0
        for order, url in enumerate(image_urls):
            try:
                result = cloudinary.uploader.upload(
                    url,
                    folder="cookbook/recipes",
                    resource_type="image",
                    overwrite=False,
                    unique_filename=True,
                )
                RecipeImage.objects.create(
                    recipe=recipe,
                    image=result["public_id"],
                    is_cover=(order == 0),
                    order=order,
                )
                created += 1
            except Exception as exc:
                self.stderr.write(
                    self.style.WARNING(
                        f"Could not upload image for {recipe.title} ({url[:60]}…): {exc}"
                    )
                )
        return created
