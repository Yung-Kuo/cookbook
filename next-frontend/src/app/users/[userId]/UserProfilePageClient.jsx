"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import Recipe from "@/components/UI/Recipe/Recipe"
import RecipeListPanel from "@/components/UI/RecipeList/RecipeListPanel"
import dynamic from "next/dynamic"
import ProfilePanel from "@/components/UI/Profile/ProfilePanel"
import SplitPageLayout from "@/components/UI/Layout/SplitPageLayout"
import { useProfilePage } from "@/hooks/useProfilePage"

const RecipeFormModal = dynamic(
  () => import("@/components/UI/Popups/RecipeFormModal"),
  { ssr: false },
)

function UserProfilePageContent({ profileUserId }) {
  const profile = useProfilePage(profileUserId)
  const {
    recipeList,
    handleRecipeChange,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
    isAuthenticated,
    loginHref,
  } = profile

  const showFormModal =
    recipeList.isFormOpen || Boolean(recipeList.recipeToEdit)

  return (
    <>
      {showFormModal && (
        <RecipeFormModal
          show={showFormModal}
          onClose={recipeList.handleCloseForm}
          onRecipeCreated={handleRecipeCreated}
          existingRecipe={recipeList.recipeToEdit}
          onRecipeUpdated={handleRecipeUpdated}
          onRecipeDeleted={handleRecipeDeleted}
        />
      )}

      <SplitPageLayout
        leftPanel={
          <RecipeListPanel
            recipeList={recipeList}
            isAuthenticated={isAuthenticated}
            loginHref={loginHref}
            profileUserId={profileUserId}
            withModal={false}
          >
            {recipeList.recipeListItems}
          </RecipeListPanel>
        }
        rightPanel={<ProfilePanel profile={profile} />}
        overlay={
          recipeList.selectedRecipe != null ? (
            <Recipe
              selectedRecipe={recipeList.selectedRecipe}
              onClose={() => recipeList.setSelectedRecipe(null)}
              onEdit={() => recipeList.setRecipeToEdit(recipeList.selectedRecipe)}
              onRecipeChange={handleRecipeChange}
            />
          ) : null
        }
      />
    </>
  )
}

function UserPageContent() {
  const { userId } = useParams()
  const id = Array.isArray(userId) ? userId[0] : userId
  const numericId = Number(id)

  if (!Number.isFinite(numericId)) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 p-8 text-neutral-200">
        Invalid profile link.
      </div>
    )
  }

  return <UserProfilePageContent profileUserId={numericId} />
}

export default function UserProfilePageClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
          Loading…
        </div>
      }
    >
      <UserPageContent />
    </Suspense>
  )
}
