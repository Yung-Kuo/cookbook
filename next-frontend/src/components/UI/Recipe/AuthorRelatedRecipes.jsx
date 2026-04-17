"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchUserRecipes } from "@/api/recipes";
import RecipeCard from "@/components/UI/Cards/RecipeCard";

const MAX_RECIPES = 5;

/**
 * Other recipes by the same author — horizontal scroll strip on all breakpoints.
 */
export default function AuthorRelatedRecipes({
  ownerId,
  currentRecipeId,
  ownerDisplayName = "Author",
}) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ownerId == null || !Number.isFinite(Number(ownerId))) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      await fetchUserRecipes(ownerId, (data) => {
        if (!cancelled) {
          setRecipes(Array.isArray(data) ? data : []);
        }
      });
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const others = useMemo(() => {
    return recipes
      .filter((r) => r.id !== currentRecipeId)
      .slice(0, MAX_RECIPES);
  }, [recipes, currentRecipeId]);

  if (ownerId == null) return null;

  return (
    <aside
      data-recipe-author-more=""
      className="flex w-full min-w-0 shrink-0 flex-col gap-4 border-t border-neutral-700 bg-neutral-900/80 px-4 py-6"
    >
      <div className="flex flex-col items-end gap-1 text-lg lg:flex-row lg:gap-4">
        <h2 className="text-2xl font-bold text-neutral-100">
          More from {ownerDisplayName}
        </h2>
        <Link
          href={`/users/${ownerId}`}
          className="font-medium text-red-300 hover:text-red-200"
        >
          View all recipes
        </Link>
      </div>

      {loading && <p className="text-neutral-500">Loading…</p>}

      {!loading && others.length === 0 && (
        <p className="text-neutral-500">No other recipes yet.</p>
      )}

      <div className="flex flex-row gap-3 overflow-x-auto pb-2">
        {others.map((recipe) => (
          <div key={recipe.id} className="shrink-0">
            <RecipeCard
              recipe={recipe}
              href={`/users/${ownerId}/recipes/${recipe.id}`}
              showPrivateBadge
              className="h-full"
            />
          </div>
        ))}
      </div>
    </aside>
  );
}
