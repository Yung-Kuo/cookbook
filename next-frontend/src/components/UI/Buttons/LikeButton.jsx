"use client";

import { useState, useEffect } from "react";
import { toggleLike } from "@/api/likes";
import RoundedButton from "./RoundedButton";

function HeartIcon({ filled, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
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

  return (
    <RoundedButton
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`cursor-pointer border border-neutral-600 bg-transparent text-neutral-300 transition-all hover:border-red-400/50 ${isLiked ? "border-red-400 !bg-red-950/40 text-red-400 hover:border-red-400" : ""} ${disabled ? "!cursor-not-allowed opacity-80" : ""}`.trim()}
      title={
        !isAuthenticated
          ? "Log in to like recipes"
          : isOwnRecipe
            ? "Your recipe"
            : isLiked
              ? "Unlike"
              : "Like this recipe"
      }
    >
      <HeartIcon filled={isLiked} className="h-5 w-5 shrink-0" />
      <span className="font-bold tabular-nums">{likeCount}</span>
    </RoundedButton>
  );
}
