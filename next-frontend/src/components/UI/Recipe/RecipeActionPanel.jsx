"use client";

import ExpandableCircleButton from "@/components/UI/Buttons/ExpandableCircleButton";
import LikeButton from "@/components/UI/Buttons/LikeButton";
import CollectionButton from "@/components/UI/Buttons/CollectionButton";
import RecipeShareButton from "@/components/UI/Recipe/RecipeShareButton";
import {
  RecipeActionPencilIcon,
  RecipeActionPrintIcon,
} from "@/components/UI/Recipe/RecipeActionRailIcons";

/**
 * Vertical action groups for recipe detail (lg+ right column).
 * Buttons use circles that expand on hover to show labels.
 */
export default function RecipeActionPanel({
  recipe,
  isOwnRecipe,
  onEdit,
  shareTitle = "",
  shareText = "",
  isAuthenticated,
  loginHref,
  onRecipeChange,
}) {
  if (!recipe?.id) return null;

  return (
    <div
      data-recipe-action-panel=""
      className="flex w-full flex-col items-start gap-3 text-base"
    >
      {isOwnRecipe && onEdit && (
        <ExpandableCircleButton
          type="button"
          onClick={onEdit}
          title="Edit recipe"
          icon={<RecipeActionPencilIcon />}
          label="Edit"
        />
      )}

      <LikeButton
        recipe={recipe}
        isAuthenticated={isAuthenticated}
        isOwnRecipe={isOwnRecipe}
        onRecipeChange={onRecipeChange}
        expandCircle
      />
      <CollectionButton
        recipeId={recipe.id}
        isAuthenticated={isAuthenticated}
        loginHref={loginHref}
        expandCircle
      />

      <RecipeShareButton
        title={shareTitle}
        text={shareText}
        expandCircle
      />
      <ExpandableCircleButton
        type="button"
        onClick={() => window.print()}
        title="Print recipe"
        aria-label="Print or save as PDF"
        icon={<RecipeActionPrintIcon />}
        label="Print"
      />

      {recipe.is_public === false && (
        <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-transparent bg-neutral-700 px-4 text-sm text-neutral-300">
          Private
        </span>
      )}
    </div>
  );
}
