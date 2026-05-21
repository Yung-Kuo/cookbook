"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { fetchUserRecipesData } from "@/api/recipes"
import RecipeCard from "@/components/UI/Cards/RecipeCard"
import { queryKeys } from "@/lib/queryKeys"
import { getRecipesFromListData } from "@/lib/recipeListShape"
import { useAuth } from "@/context/AuthContext"
import type { Recipe, RecipeListFilters, RecipeListViewer } from "@/types"

const MAX_RECIPES = 5

type AuthorRelatedRecipesProps = {
  ownerId: string | number | null
  currentRecipeId: number
  ownerDisplayName?: string
}

/**
 * Other recipes by the same author — horizontal scroll strip on all breakpoints.
 */
export default function AuthorRelatedRecipes({
  ownerId,
  currentRecipeId,
  ownerDisplayName = "Author",
}: AuthorRelatedRecipesProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const ownerNumeric = Number(ownerId)
  const viewerKey: RecipeListViewer =
    !authLoading && isAuthenticated ? "auth" : "anon"
  const viewerUserId = viewerKey === "auth" ? (user?.pk ?? null) : null

  const filters = useMemo((): RecipeListFilters => {
    return {
      scope: "user",
      ownerUserId: Number.isFinite(ownerNumeric) ? ownerNumeric : null,
      search: "",
      tagIds: [],
      viewer: viewerKey,
      viewerUserId,
    }
  }, [ownerNumeric, viewerKey, viewerUserId])

  const { data: listData, isPending: loading } = useQuery({
    queryKey: queryKeys.recipes.list(filters),
    queryFn: () => fetchUserRecipesData(ownerNumeric, {}),
    enabled:
      ownerId != null &&
      Number.isFinite(ownerNumeric) &&
      !authLoading,
  })

  const recipes = useMemo(
    () => getRecipesFromListData(listData),
    [listData],
  )

  const others = useMemo((): Recipe[] => {
    return recipes
      .filter((r) => r.id !== currentRecipeId)
      .slice(0, MAX_RECIPES)
  }, [recipes, currentRecipeId])

  if (ownerId == null) return null

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
  )
}
