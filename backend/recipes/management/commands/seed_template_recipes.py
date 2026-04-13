"""
Load many public template recipes for local scroll/UI testing.

Run from the backend directory (with your virtualenv activated):

    python manage.py seed_template_recipes

Safe to run multiple times: new titles are inserted; existing template titles get
their tags re-synced to TEMPLATE_RECIPE_TAGS and instructions re-synced to
TEMPLATE_RECIPE_INSTRUCTIONS (so updates apply).

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

# Parallel to TEMPLATE_TITLES: ordered cooking steps (authentic to each dish).
TEMPLATE_RECIPE_INSTRUCTIONS = [
    [
        "Whisk 2–3 eggs with a pinch of salt, a grind of pepper, and finely chopped soft herbs (parsley, chives, or tarragon).",
        "Heat a nonstick skillet over medium with butter or oil until foaming but not brown.",
        "Pour in the eggs; let the bottom set briefly, then lift edges and tilt the pan so uncooked egg flows underneath until almost set.",
        "Fold the omelette in half or roll it; slide onto a warm plate and serve immediately.",
    ],
    [
        "Toast good bread until crisp outside but still a little chewy inside.",
        "Mash ripe avocado with salt, lemon or lime juice, and black pepper to taste.",
        "Spread the avocado thickly on the toast; top with red pepper flakes, seeds, or a soft egg if you like.",
        "Serve right away so the bread stays crisp.",
    ],
    [
        "Spoon thick Greek yogurt into a bowl and smooth the top with the back of the spoon.",
        "Add fresh fruit, berries, or compote on one side.",
        "Sprinkle granola, nuts, or seeds for crunch.",
        "Finish with a drizzle of honey or maple syrup and serve cold.",
    ],
    [
        "Sauté chopped onion and garlic in olive oil until soft and fragrant.",
        "Add canned whole tomatoes, crushing them with a spoon, plus a pinch of sugar, salt, and pepper; simmer 20–25 minutes.",
        "Stir in torn fresh basil off the heat.",
        "Blend until smooth if you prefer a silky soup, or leave chunky; adjust seasoning and serve hot with a drizzle of olive oil.",
    ],
    [
        "Whisk anchovy (optional), garlic, lemon juice, Dijon, egg yolk, and olive oil into a creamy dressing, or use a good bottled Caesar.",
        "Tear romaine into bite-sized pieces and toss with dressing until lightly coated.",
        "Add shaved Parmesan and crunchy croutons.",
        "Finish with black pepper and extra cheese; serve at once.",
    ],
    [
        "Butter one side of each bread slice (or both for extra crunch).",
        "Layer cheese between the bread, buttered sides out.",
        "Cook in a skillet over medium-low, pressing gently, until golden and the cheese melts, flipping once.",
        "Rest 1 minute, then cut and serve hot.",
    ],
    [
        "Cut chicken into even bite-sized pieces; pat dry and season.",
        "Stir-fry in a very hot wok or large skillet with oil in batches until golden; remove.",
        "Stir-fry vegetables until crisp-tender; return chicken, add aromatics (ginger, garlic) briefly.",
        "Pour in sauce, toss until glossy and thickened; serve over rice.",
    ],
    [
        "Season ground beef with cumin, chili powder, salt, and pepper; cook until browned and crumbled.",
        "Warm soft corn or flour tortillas on a dry skillet or over a flame.",
        "Fill with beef, diced onion, cilantro, and salsa.",
        "Serve with lime wedges, hot sauce, and extra toppings as you like.",
    ],
    [
        "Sauté onion in oil until golden; add garlic, ginger, and your spice blend until fragrant.",
        "Add chopped vegetables and chickpeas or lentils; stir to coat in spices.",
        "Pour in coconut milk or tomatoes and simmer until vegetables are tender and the sauce thickens.",
        "Stir in garam masala or fresh cilantro; taste and adjust salt; serve with rice or flatbread.",
    ],
    [
        "Heat oven to 400°F (200°C). Pat salmon fillets dry and season with salt and pepper.",
        "Place skin-side down on an oiled sheet or in a baking dish; add lemon slices or herbs if you like.",
        "Roast until the fish flakes easily and the center is just opaque, about 12–15 minutes depending on thickness.",
        "Rest briefly; serve with a squeeze of lemon.",
    ],
    [
        "Simmer stock in a saucepan and keep it warm on low.",
        "Sauté chopped onion in butter and oil until soft; add sliced mushrooms until browned and their liquid evaporates.",
        "Stir in rice to toast 1–2 minutes; add wine if using and stir until absorbed.",
        "Add stock one ladle at a time, stirring often, until rice is creamy and al dente; finish with butter, Parmesan, and parsley.",
    ],
    [
        "Sauté garlic and optional red pepper flakes in olive oil until fragrant but not brown.",
        "Add canned crushed tomatoes, salt, and a pinch of sugar; simmer 15–20 minutes until slightly thickened.",
        "Cook spaghetti in salted water until al dente; reserve a splash of pasta water.",
        "Toss pasta with sauce, adding pasta water to loosen; finish with basil and grated Parmesan.",
    ],
    [
        "Soak rice noodles in warm water until pliable; drain well.",
        "Make sauce from tamarind, fish sauce, sugar, and optional chili; have bean sprouts, peanuts, and lime ready.",
        "Stir-fry protein in a hot wok, push aside; scramble egg, then add noodles and sauce; toss until coated.",
        "Fold in bean sprouts and garlic chives; top with peanuts, lime, and chili; serve immediately.",
    ],
    [
        "Use day-old cold rice for best texture; break up any clumps.",
        "Stir-fry aromatics (garlic, ginger, scallion whites) in very hot oil.",
        "Add protein and vegetables; cook through, then add rice and toss until hot and slightly crisp in spots.",
        "Season with soy sauce; fold in scallion greens and serve hot.",
    ],
    [
        "Sauté onion, bell pepper, and garlic in oil until softened.",
        "Add ground meat or extra beans, chili powder, cumin, and oregano; cook through.",
        "Stir in tomatoes, broth, and drained beans; simmer uncovered until thick and flavorful, 30–45 minutes.",
        "Adjust salt and heat; serve with sour cream, cheese, and cornbread or rice.",
    ],
    [
        "Rinse lentils and pick over for debris.",
        "Sauté onion, carrot, and celery in oil until soft; add garlic and spices briefly.",
        "Add lentils, broth, tomatoes if using, and bay leaf; simmer until lentils are tender, 25–35 minutes.",
        "Stir in greens or lemon; adjust seasoning; serve as a thick stew or soup.",
    ],
    [
        "Heat oven to 425°F (220°C). Cut vegetables into even pieces; toss with olive oil, salt, and pepper.",
        "Spread in a single layer on baking sheets without crowding.",
        "Roast until caramelized and tender, turning once, 25–40 minutes depending on size.",
        "Finish with herbs, vinegar, or a squeeze of lemon; serve hot or at room temperature.",
    ],
    [
        "Peel and cube starchy potatoes; boil in salted water until very tender.",
        "Drain well; return to the pot over low heat briefly to steam off excess moisture.",
        "Mash with warm milk or cream and butter until smooth or slightly chunky as you prefer.",
        "Season with salt and white pepper; keep warm until serving.",
    ],
    [
        "Mix softened butter with minced garlic, parsley, and a pinch of salt.",
        "Halve a baguette lengthwise or slice thick country bread.",
        "Spread garlic butter generously; optionally add cheese.",
        "Bake at 375°F (190°C) until golden and crisp on the edges; slice and serve warm.",
    ],
    [
        "Cream butter with white and brown sugars until light; beat in eggs and vanilla.",
        "Whisk flour, baking soda, and salt; mix into the butter until just combined.",
        "Fold in chocolate chips or chunks.",
        "Drop rounded spoonfuls onto lined sheets; bake at 350°F (175°C) until edges are golden and centers look set, 9–12 minutes; cool on the sheet briefly.",
    ],
    [
        "Melt butter with chocolate; cool slightly. Whisk in sugar, then eggs and vanilla.",
        "Fold in flour, cocoa, and salt until just combined; avoid overmixing.",
        "Spread in a lined pan; optional: swirl in extra chocolate.",
        "Bake at 350°F (175°C) until a toothpick has moist crumbs, 25–35 minutes; cool completely before cutting.",
    ],
    [
        "Toss fruit with sugar, a pinch of salt, lemon juice, and spice (cinnamon or nutmeg).",
        "Spread in a baking dish.",
        "Rub cold butter into flour, oats, sugar, and pinch of salt until crumbly.",
        "Top the fruit and bake at 375°F (190°C) until bubbling and golden; rest 10 minutes; serve with cream or ice cream.",
    ],
    [
        "Whisk flour, baking powder, sugar, and salt; combine wet ingredients separately.",
        "Mix wet into dry until just combined; small lumps are fine.",
        "Heat a griddle or skillet; lightly butter. Pour batter for each pancake.",
        "Flip when bubbles form and edges look dry; cook until golden. Stack and serve with butter and maple syrup.",
    ],
    [
        "Whisk eggs, milk, vanilla, cinnamon, and a pinch of salt in a shallow dish.",
        "Dip thick slices of day-old bread until soaked but not falling apart.",
        "Cook in butter over medium until golden on both sides.",
        "Dust with powdered sugar or serve with maple syrup and berries.",
    ],
    [
        "Blend frozen fruit, banana, and a little liquid (juice, milk, or yogurt) until thick and spoonable—like soft ice cream.",
        "Pour into a chilled bowl and smooth the top.",
        "Arrange toppings in rows: granola, fresh fruit, coconut, seeds, or nut butter.",
        "Serve immediately with a spoon.",
    ],
    [
        "Toast oats and nuts lightly; cool.",
        "Warm honey, nut butter, and butter until smooth; stir in vanilla and a pinch of salt.",
        "Combine with oats, mix-ins (dried fruit, chocolate chips), and bind until sticky.",
        "Press firmly into a lined pan; chill until firm, then slice into bars.",
    ],
    [
        "Mash very ripe bananas; mix with melted butter, eggs, sugar, and vanilla.",
        "Fold in flour, baking soda, and salt until just combined; optional: nuts or chocolate chips.",
        "Pour into a greased loaf pan.",
        "Bake at 350°F (175°C) until a skewer comes out clean, 50–65 minutes; cool in the pan before slicing.",
    ],
    [
        "Toss sliced apples with sugar, cinnamon, lemon juice, and a pinch of salt.",
        "Spread in a buttered baking dish.",
        "Blend flour, oats, brown sugar, and cold butter until crumbly; cover the apples evenly.",
        "Bake at 375°F (190°C) until the topping is crisp and the fruit is bubbling; cool slightly; serve with ice cream or cream.",
    ],
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
        if len(TEMPLATE_RECIPE_INSTRUCTIONS) != len(TEMPLATE_TITLES):
            raise ValueError(
                "TEMPLATE_RECIPE_INSTRUCTIONS must have the same length as TEMPLATE_TITLES"
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
        instructions_synced = 0
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
                created += 1

            self._sync_template_instructions(recipe, TEMPLATE_RECIPE_INSTRUCTIONS[i])
            instructions_synced += 1

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
            f"synced tags on {tags_synced} existing template recipe(s); "
            f"refreshed instructions on {instructions_synced} template recipe(s)."
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

    def _sync_template_instructions(self, recipe, instruction_texts):
        """Replace all steps for this recipe with the given ordered texts."""
        RecipeInstruction.objects.filter(recipe=recipe).delete()
        for order, text in enumerate(instruction_texts, start=1):
            RecipeInstruction.objects.create(recipe=recipe, text=text, order=order)

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
