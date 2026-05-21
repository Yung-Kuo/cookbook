"use client"

import { Suspense } from "react"
import { useAppNav } from "@/hooks/useAppNav"
import { useRecipeList } from "@/hooks/useRecipeList"
import RecipeListPanel from "@/components/UI/RecipeList/RecipeListPanel"
import Recipe from "@/components/UI/Recipe/Recipe"
import SplitPageLayout from "@/components/UI/Layout/SplitPageLayout"

function PublicPageContent() {
  const { isAuthenticated, loginHref } = useAppNav()
  const recipeList = useRecipeList({
    listScope: "public",
    publicCatalogOnly: true,
  })

  return (
    <SplitPageLayout
      leftPanel={
        <RecipeListPanel
          recipeList={recipeList}
          isAuthenticated={isAuthenticated}
          loginHref={loginHref}
        >
          {recipeList.recipeListItems}
        </RecipeListPanel>
      }
      overlay={
        recipeList.selectedRecipe != null ? (
          <Recipe
            selectedRecipe={recipeList.selectedRecipe}
            onClose={() => recipeList.setSelectedRecipe(null)}
            onEdit={() => recipeList.setRecipeToEdit(recipeList.selectedRecipe)}
            onRecipeChange={recipeList.handleRecipeChange}
          />
        ) : null
      }
    />
  )
}

export default function PublicPageClient() {
  return (
    <Suspense
      fallback={
        <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800" />
      }
    >
      <PublicPageContent />
    </Suspense>
  )
}
