"use client";

import { useState, useEffect } from "react";
import { toggleLike } from "@/api/likes";
import RoundedButton from "./RoundedButton";
import ExpandableCircleButton from "./ExpandableCircleButton";
import { recipeActionCircleIconClass } from "@/components/UI/Recipe/RecipeActionRailIcons";

function HeartIcon({ filled, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

/**
 * @param {object} recipe - recipe object with id, like_count, is_liked
 * @param {function} onRecipeChange - (patch) => void, patch includes id, like_count, is_liked
 */
export default function LikeButton({
  recipe,
  isAuthenticated,
  isOwnRecipe,
  onRecipeChange,
  /** Recipe detail right column: circle that expands to show label on hover */
  expandCircle = false,
}) {
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState(null);

  useEffect(() => {
    setOptimistic(null);
  }, [recipe?.id]);

  const likeCount = optimistic?.like_count ?? recipe?.like_count ?? 0;
  const isLiked = optimistic?.is_liked ?? recipe?.is_liked ?? false;

  const handleClick = async () => {
    if (!recipe?.id || !isAuthenticated || isOwnRecipe || busy) return;
    const prevCount = recipe.like_count ?? 0;
    const prevLiked = recipe.is_liked ?? false;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));
    setOptimistic({ like_count: nextCount, is_liked: nextLiked });
    setBusy(true);
    try {
      const data = await toggleLike(recipe.id);
      setOptimistic(null);
      onRecipeChange?.({
        id: recipe.id,
        like_count: data.like_count,
        is_liked: data.liked,
      });
    } catch (e) {
      console.error(e);
      setOptimistic(null);
    } finally {
      setBusy(false);
    }
  };

  const disabled = !isAuthenticated || isOwnRecipe || busy;

  const titleText =
    !isAuthenticated
      ? "Log in to like recipes"
      : isOwnRecipe
        ? "Your recipe"
        : isLiked
          ? "Unlike"
          : "Like this recipe";

  const expandLabel = isOwnRecipe
    ? "Your recipe"
    : !isAuthenticated
      ? "Log in to like"
      : `${isLiked ? "Unlike" : "Like"}${likeCount > 0 ? ` · ${likeCount}` : ""}`;

  if (expandCircle) {
    /** Optical nudge: heart path sits high/right in 24×24 viewBox; red only when liked (not overridden by parent [&_svg] rules) */
    const heartClass = `${recipeActionCircleIconClass} -translate-x-px translate-y-px${isLiked ? " text-red-300" : ""}`;
    return (
      <ExpandableCircleButton
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={titleText}
        icon={<HeartIcon filled={isLiked} className={heartClass} />}
        label={expandLabel}
      />
    );
  }

  return (
    <RoundedButton
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`cursor-pointer overflow-hidden border border-neutral-600 bg-transparent text-neutral-300 transition-all hover:border-red-400/50 ${isLiked ? "border-red-400 !bg-red-950/40 text-red-300 hover:border-red-400" : ""} ${disabled ? "!cursor-not-allowed opacity-80" : ""} `}
      title={titleText}
    >
      {/* <div className="flex items-center justify-center h-10 w-10 min-w-10 rounded-full"> */}
      <HeartIcon filled={isLiked} className="h-5 w-5 shrink-0" />
      {/* </div> */}
      {/* {likeCount > 0 && ( */}
      <span className={`font-bold tabular-nums transition-all`}>
        {likeCount}
      </span>
      {/* )} */}
    </RoundedButton>
  );
}
