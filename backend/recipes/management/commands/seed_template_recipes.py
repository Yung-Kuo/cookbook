"""
Load many public template recipes for local scroll/UI testing.

Run from the backend directory (with your virtualenv activated):

    python manage.py seed_template_recipes

Safe to run multiple times: new titles are inserted; existing template titles get
their tags re-synced to TEMPLATE_RECIPE_TAGS (so tag updates apply).

When Cloudinary env vars are set, template recipes get photos from Wikimedia Commons
URLs chosen to match each dish title (uploaded via Cloudinary). Uploads use scaled
Commons thumbnail URLs when possible (smaller fetch, fewer HTTP 429 / size-limit issues),
with a fallback to the full file URL if needed. A few recipes include several photos to
exercise the image gallery. Recipes that already have images are skipped unless you pass
--replace-template-images (deletes and re-uploads).

After changing image URLs in this file, run:

    python manage.py seed_template_recipes --replace-template-images

so existing template rows pick up the new cover order and assets (Cloudinary uploads).
"""

import time
from urllib.parse import unquote, urlparse

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

_COMMONS_PATH = "/wikipedia/commons/"


def _commons_thumb_url_for_cloudinary(full_url: str, max_edge: int = 1600) -> str:
    """
    Point Cloudinary at a Commons *thumbnail* URL instead of the full-resolution file.

    Smaller downloads stay under typical remote-fetch size caps, and Wikimedia’s CDN
    is less likely to return HTTP 429 when Cloudinary’s servers fetch many images in a row.
    """
    parsed = urlparse(full_url.strip())
    if parsed.netloc != "upload.wikimedia.org":
        return full_url
    path = parsed.path
    if "/thumb/" in path:
        return full_url
    if _COMMONS_PATH not in path:
        return full_url
    lower = path.lower()
    if not lower.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
        return full_url
    rel = path.split(_COMMONS_PATH, 1)[1]
    dir_file = rel.rsplit("/", 1)
    if len(dir_file) != 2:
        return full_url
    dir_part, file_enc = dir_file
    base_decoded = unquote(file_enc)
    thumb_rel = f"thumb/{dir_part}/{file_enc}/{max_edge}px-{base_decoded}"
    return f"{parsed.scheme}://{parsed.netloc}{_COMMONS_PATH}{thumb_rel}"


# Template image curation (each list in TEMPLATE_RECIPE_IMAGE_URLS):
# - Index 0 is the cover (best hero for the exact template title).
# - Every photo must match the dish; extras are alternate angles of the same dish type.
# - Prefer landscape originals (width >= height) for the fixed-height hero; check Commons
#   imageinfo dimensions when swapping URLs.
# Wikimedia Commons — CC / free licenses; stable CDN links.
_W = "https://upload.wikimedia.org/wikipedia/commons"

_IM = {
    "herb_omelette": f"{_W}/a/a7/346_-_Mon_Ami_Gabi.jpg",
    "avocado_toast": f"{_W}/4/4a/Avocado_toast.jpg",
    # Landscape bowl: fruit, yogurt, granola (replaces portrait-only yogurt shot).
    "yogurt_bowl": f"{_W}/9/9c/Fruit%2C_yogurt%2C_granola_%2833887713066%29.jpg",
    "tomato_soup": f"{_W}/b/b5/Tomato_soup.jpg",
    # Cover = landscape plate under Cloudinary’s 10MB fetch cap (Bali original was too large).
    "caesar_gallery": [
        f"{_W}/f/f7/Caesar_Salad_-_Purezza_2023-11-22.jpg",
        f"{_W}/2/23/Caesar_salad_%282%29.jpg",
        f"{_W}/a/a1/Caesar_salad.jpg",
    ],
    "grilled_cheese": f"{_W}/8/89/Grilled_cheese_sandwich.jpg",
    "stir_fry": f"{_W}/e/e7/Chicken_stir_fry.jpg",
    # Cover = mixed taco platter (landscape, includes carne asada); extra = carne asada plate.
    "tacos_gallery": [
        f"{_W}/7/73/001_Tacos_de_carnitas%2C_carne_asada_y_al_pastor.jpg",
        f"{_W}/4/49/Carne_asada_taco.jpg",
    ],
    "veggie_curry": f"{_W}/8/8e/Chana_masala.jpg",
    "salmon": f"{_W}/3/34/Salmon_dish.jpg",
    "mushroom_risotto": f"{_W}/e/ee/Mushroom_risotto_%283990739885%29.jpg",
    # Cover = meatballs + sauce (landscape); drop tiny portrait generic spaghetti.jpg.
    "spaghetti_marinara_gallery": [
        f"{_W}/7/7c/Spaghetti_and_meatballs_1.jpg",
        f"{_W}/9/9d/Liat_Portal_for_Foodie_Disorder_-_Spaghetti_with_Tomato_Sauce.jpg",
    ],
    # Cover = classic pad thai on a plate (clear dish read); Bangkok street last.
    "pad_thai_gallery": [
        f"{_W}/e/ed/Pad_Thai.JPG",
        f"{_W}/0/01/Pad_Thai_Noodles_-_Little_Thai%2C_Brighton_2024-03-21.jpg",
        f"{_W}/6/63/Thai-Pad-Thai_2023-06-04.jpg",
        f"{_W}/3/39/Phat_Thai_kung_Chang_Khien_street_stall.jpg",
    ],
    "fried_rice": f"{_W}/5/50/Fried_rice.jpg",
    "bean_chili": f"{_W}/2/24/Chili_con_carne.jpg",
    # Landscape bowl (replaces portrait lentil soup file).
    "lentil_stew": f"{_W}/e/ee/Bowl_of_lentil_soup_with_green_and_red_lentils.jpg",
    "roasted_veg": f"{_W}/1/1d/Roasted_vegetables.jpg",
    # Landscape bowl (replaces square crop of generic mashed_potatoes.jpg).
    "mashed_potatoes": f"{_W}/3/39/MashedPotatoes.jpg",
    "garlic_bread": f"{_W}/4/4b/Garlic_bread.jpg",
    # Cover = tray of cookies (landscape); single cookie last.
    "cookies_gallery": [
        f"{_W}/5/50/Chocolate_chip_cookies.jpg",
        f"{_W}/a/a9/Chocolate_Chip_Cookies.jpg",
        f"{_W}/a/ab/Chocolate_chip_cookie.jpg",
    ],
    # Higher-res tray shot (replaces small generic Brownies.jpg if fetch/upload flaky).
    "brownies": f"{_W}/3/35/Chocolate_brownies.jpg",
    "fruit_crumble": f"{_W}/2/25/Rhubarb_crumble.jpg",
    "pancakes": f"{_W}/2/2d/Pancakes.jpg",
    "french_toast": f"{_W}/1/16/French_Toast.jpg",
    "smoothie_bowl": f"{_W}/3/35/Smoothie_bowl.jpg",
    "granola_bar": f"{_W}/f/fb/Granola_bar.jpg",
    "banana_bread": f"{_W}/e/ee/Banana_bread.jpg",
    "apple_crisp": f"{_W}/e/e3/Apple_Crisp.jpg",
}

# Parallel to TEMPLATE_TITLES: list of image URLs (first = cover).
TEMPLATE_RECIPE_IMAGE_URLS = [
    [_IM["herb_omelette"]],
    [_IM["avocado_toast"]],
    [_IM["yogurt_bowl"]],
    [_IM["tomato_soup"]],
    list(_IM["caesar_gallery"]),
    [_IM["grilled_cheese"]],
    [_IM["stir_fry"]],
    list(_IM["tacos_gallery"]),
    [_IM["veggie_curry"]],
    [_IM["salmon"]],
    [_IM["mushroom_risotto"]],
    list(_IM["spaghetti_marinara_gallery"]),
    list(_IM["pad_thai_gallery"]),
    [_IM["fried_rice"]],
    [_IM["bean_chili"]],
    [_IM["lentil_stew"]],
    [_IM["roasted_veg"]],
    [_IM["mashed_potatoes"]],
    [_IM["garlic_bread"]],
    list(_IM["cookies_gallery"]),
    [_IM["brownies"]],
    [_IM["fruit_crumble"]],
    [_IM["pancakes"]],
    [_IM["french_toast"]],
    [_IM["smoothie_bowl"]],
    [_IM["granola_bar"]],
    [_IM["banana_bread"]],
    [_IM["apple_crisp"]],
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

        # Space every Cloudinary→Commons fetch (including the first image of each recipe) so
        # Wikimedia does not rate-limit remote loads with HTTP 429.
        self._first_template_image_fetch = True

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

        missing_img = []
        for title in TEMPLATE_TITLES:
            r = Recipe.objects.filter(title=title).first()
            if r is not None and not r.images.exists():
                missing_img.append(title)
        if missing_img:
            self.stdout.write(
                self.style.WARNING(
                    "Template recipes still have no images (configure Cloudinary and re-run, "
                    "or use --replace-template-images): "
                    + "; ".join(missing_img[:12])
                    + ("; …" if len(missing_img) > 12 else "")
                )
            )

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
            thumb_url = _commons_thumb_url_for_cloudinary(url)
            fetch_chain = [thumb_url] if thumb_url == url else [thumb_url, url]
            # Pause before every remote fetch (including the first image of each recipe) so
            # Commons is less likely to return 429 to Cloudinary’s origin fetcher.
            if not getattr(self, "_first_template_image_fetch", False):
                time.sleep(1.75)
            self._first_template_image_fetch = False

            result = None
            last_exc = None
            for fetch_url in fetch_chain:
                if result:
                    break
                for attempt in range(4):
                    try:
                        result = cloudinary.uploader.upload(
                            fetch_url,
                            folder="cookbook/recipes",
                            resource_type="image",
                            overwrite=False,
                            unique_filename=True,
                        )
                        last_exc = None
                        break
                    except Exception as exc:
                        last_exc = exc
                        err = str(exc).lower()
                        if attempt < 3 and (
                            "429" in err
                            or "too many" in err
                            or "timed out" in err
                        ):
                            time.sleep(12 * (attempt + 1))
                            continue
                        break
                if result:
                    break

            if result:
                RecipeImage.objects.create(
                    recipe=recipe,
                    image=result["public_id"],
                    is_cover=(order == 0),
                    order=order,
                )
                created += 1
            elif last_exc:
                self.stderr.write(
                    self.style.WARNING(
                        f"Could not upload image for {recipe.title} ({url[:60]}…): {last_exc}"
                    )
                )
        return created
