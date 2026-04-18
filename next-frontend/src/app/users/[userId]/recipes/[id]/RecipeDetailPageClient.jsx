"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import RoundedButton from "@/components/UI/Buttons/RoundedButton"
import { fetchRecipeById } from "@/api/recipes"
import Recipe from "@/components/UI/Recipe/Recipe"
import AuthorRelatedRecipes from "@/components/UI/Recipe/AuthorRelatedRecipes"
import ProfileCard from "@/components/UI/Cards/ProfileCard"
import RecipeActionPanel from "@/components/UI/Recipe/RecipeActionPanel"
import RecipeNavBackButton from "@/components/UI/Recipe/RecipeNavBackButton"
import { useAuth } from "@/context/AuthContext"
import { useAppNav } from "@/hooks/useAppNav"
import { queryKeys } from "@/lib/queryKeys"
import { OWNERLESS_RECIPE_USER_SEGMENT } from "@/lib/recipeRoutes"
import "./recipe-detail-print.css"

const RecipeFormModal = dynamic(
  () => import("@/components/UI/Popups/RecipeFormModal"),
  { ssr: false },
)

function RecipePrintSourceFooter() {
  const [url, setUrl] = useState("")

  useEffect(() => {
    setUrl(typeof window !== "undefined" ? window.location.href : "")
  }, [])

  if (!url) return null

  return (
    <p
      data-recipe-print-footer=""
      className="mt-8 border-t border-neutral-600 pt-4 text-sm text-neutral-500"
    >
      Source: {url}
    </p>
  )
}

export default function RecipeDetailPageClient() {
  const { userId, id } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const uid = Array.isArray(userId) ? userId[0] : userId
  const { user } = useAuth()
  const { isAuthenticated, loginHref } = useAppNav()
  const [recipeToEdit, setRecipeToEdit] = useState(null)

  const rawId = Array.isArray(id) ? id[0] : id

  const {
    data: recipe,
    isError,
    isPending,
  } = useQuery({
    queryKey: queryKeys.recipes.detail(rawId),
    queryFn: () => fetchRecipeById(rawId),
    enabled: Boolean(rawId),
  })

  const patchRecipe = useCallback(
    (patch) => {
      if (!recipe?.id) return
      queryClient.setQueryData(queryKeys.recipes.detail(recipe.id), (prev) =>
        prev ? { ...prev, ...patch } : prev,
      )
    },
    [queryClient, recipe?.id],
  )

  const handleRecipeUpdated = useCallback(
    (updated) => {
      queryClient.setQueryData(queryKeys.recipes.detail(updated.id), updated)
      setRecipeToEdit(null)
    },
    [queryClient],
  )

  const handleRecipeDeleted = useCallback(() => {
    setRecipeToEdit(null)
    const uidNum = Number(uid)
    if (uidNum === 0) router.push("/")
    else router.push(`/users/${uid}`)
  }, [router, uid])

  const ownerLabel =
    recipe?.owner_display_name?.trim() || recipe?.owner_username || "Author"

  const isOwnRecipe =
    user?.pk != null && recipe?.owner_id != null && user.pk === recipe.owner_id

  const backFromDetailHref =
    uid === OWNERLESS_RECIPE_USER_SEGMENT ? "/" : `/users/${uid}`

  if (isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 text-neutral-100">
        <p className="text-2xl">Recipe not found</p>
        <RoundedButton
          href={backFromDetailHref}
          className="cursor-pointer bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
        >
          Back to Recipes
        </RoundedButton>
      </div>
    )
  }

  if (isPending || !recipe) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-xl text-neutral-400">
        Loading...
      </div>
    )
  }

  const ownerId = recipe.owner_id
  const showFormModal = Boolean(recipeToEdit)

  return (
    <>
      {showFormModal && (
        <RecipeFormModal
          show={showFormModal}
          onClose={() => setRecipeToEdit(null)}
          onRecipeCreated={() => setRecipeToEdit(null)}
          existingRecipe={recipeToEdit}
          onRecipeUpdated={handleRecipeUpdated}
          onRecipeDeleted={handleRecipeDeleted}
        />
      )}

      <div
        data-recipe-detail-page=""
        className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-neutral-900 pb-24"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 lg:px-8">
          <div className="hidden w-52 shrink-0 flex-col gap-4 lg:sticky lg:top-18 lg:flex lg:self-start">
            <RecipeNavBackButton className="group grid h-10 w-10 grid-cols-1 grid-rows-1 rounded-full transition-all" />
            {ownerId != null && (
              <ProfileCard ownerId={ownerId} recipe={recipe} />
            )}
          </div>

          <div className="recipe-detail-main-column mx-auto w-full max-w-3xl min-w-0 flex-1">
            <Recipe
              selectedRecipe={recipe}
              isPage
              shareTitle={recipe.title}
              shareText={recipe.description ?? ""}
              onClose={null}
              onEdit={isOwnRecipe ? () => setRecipeToEdit(recipe) : null}
              onRecipeChange={patchRecipe}
              className="w-full min-w-0"
            />
            <div className="px-4 pb-4 lg:px-0">
              <RecipePrintSourceFooter />
            </div>
          </div>

          <div className="hidden w-44 shrink-0 lg:sticky lg:top-18 lg:flex lg:self-start">
            <RecipeActionPanel
              recipe={recipe}
              isOwnRecipe={isOwnRecipe}
              onEdit={isOwnRecipe ? () => setRecipeToEdit(recipe) : null}
              shareTitle={recipe.title}
              shareText={recipe.description ?? ""}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
              onRecipeChange={patchRecipe}
            />
          </div>
        </div>

        {ownerId != null && (
          <AuthorRelatedRecipes
            ownerId={ownerId}
            currentRecipeId={recipe.id}
            ownerDisplayName={ownerLabel}
          />
        )}
      </div>
    </>
  )
}
