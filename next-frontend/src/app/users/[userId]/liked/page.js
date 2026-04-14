"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAppNav } from "@/hooks/useAppNav";
import { useRecipeList } from "@/hooks/useRecipeList";
import { fetchLikedRecipes } from "@/api/recipes";
import RecipeListPanel from "@/components/UI/RecipeList/RecipeListPanel";
import Recipe from "@/components/UI/Recipe/Recipe";
import SplitPageLayout from "@/components/UI/Layout/SplitPageLayout";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";

function LikedPageContent({ profileUserId }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { loginHref } = useAppNav();
  const recipeList = useRecipeList({
    fetchFn: fetchLikedRecipes,
    publicCatalogOnly: false,
  });

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-xl text-neutral-200">
        <p>Log in to see recipes you have liked.</p>
        <RoundedButton
          href="/login"
          className="cursor-pointer bg-red-300 text-neutral-800 hover:bg-red-400"
        >
          Login
        </RoundedButton>
      </div>
    );
  }

  if (user?.pk !== profileUserId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <p>This page only shows your own liked recipes.</p>
        <RoundedButton
          href={`/users/${user.pk}/liked`}
          className="cursor-pointer bg-sky-600 text-neutral-100 hover:bg-sky-500"
        >
          Go to my liked recipes
        </RoundedButton>
      </div>
    );
  }

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
  );
}

function LikedPageInner() {
  const { userId } = useParams();
  const id = Array.isArray(userId) ? userId[0] : userId;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 p-8 text-neutral-200">
        Invalid profile link.
      </div>
    );
  }

  return <LikedPageContent profileUserId={numericId} />;
}

export default function LikedPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800" />
      }
    >
      <LikedPageInner />
    </Suspense>
  );
}
