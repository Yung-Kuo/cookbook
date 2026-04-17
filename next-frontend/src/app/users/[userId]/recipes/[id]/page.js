"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";
import { fetchRecipeById } from "@/api/recipes";
import Recipe from "@/components/UI/Recipe/Recipe";
import AuthorRelatedRecipes from "@/components/UI/Recipe/AuthorRelatedRecipes";
import RecipeAuthorCard from "@/components/UI/Recipe/RecipeAuthorCard";
import RecipeActionPanel from "@/components/UI/Recipe/RecipeActionPanel";
import RecipeFormModal from "@/components/UI/Popups/RecipeFormModal";
import RecipeNavBackButton from "@/components/UI/Recipe/RecipeNavBackButton";
import { useAuth } from "@/context/AuthContext";
import { useAppNav } from "@/hooks/useAppNav";

function RecipePrintSourceFooter() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(typeof window !== "undefined" ? window.location.href : "");
  }, []);

  if (!url) return null;

  return (
    <p
      data-recipe-print-footer=""
      className="mt-8 border-t border-neutral-600 pt-4 text-sm text-neutral-500"
    >
      Source: {url}
    </p>
  );
}

export default function RecipeDetailPage() {
  const { userId, id } = useParams();
  const router = useRouter();
  const uid = Array.isArray(userId) ? userId[0] : userId;
  const { user } = useAuth();
  const { isAuthenticated, loginHref } = useAppNav();
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  useEffect(() => {
    if (!id) return;
    const recipeId = Array.isArray(id) ? id[0] : id;
    fetchRecipeById(recipeId)
      .then(setRecipe)
      .catch(() => setError("Recipe not found"));
  }, [id]);

  const handleRecipeUpdated = useCallback((updated) => {
    setRecipe(updated);
    setRecipeToEdit(null);
  }, []);

  const handleRecipeDeleted = useCallback(() => {
    setRecipeToEdit(null);
    router.push(`/users/${uid}`);
  }, [router, uid]);

  const ownerLabel =
    recipe?.owner_display_name?.trim() || recipe?.owner_username || "Author";

  const isOwnRecipe =
    user?.pk != null && recipe?.owner_id != null && user.pk === recipe.owner_id;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 text-neutral-100">
        <p className="text-2xl">{error}</p>
        <RoundedButton
          href={`/users/${uid}`}
          className="cursor-pointer bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
        >
          Back to Recipes
        </RoundedButton>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-xl text-neutral-400">
        Loading...
      </div>
    );
  }

  const ownerId = recipe.owner_id;

  return (
    <>
      <RecipeFormModal
        show={!!recipeToEdit}
        onClose={() => setRecipeToEdit(null)}
        onRecipeCreated={() => setRecipeToEdit(null)}
        existingRecipe={recipeToEdit}
        onRecipeUpdated={handleRecipeUpdated}
        onRecipeDeleted={handleRecipeDeleted}
      />

      <div
        data-recipe-detail-page=""
        className="flex h-full min-h-0 flex-col overflow-x-hidden overflow-y-auto bg-neutral-900 pb-24"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-8 lg:px-8">
          <div className="hidden w-52 shrink-0 flex-col gap-4 lg:sticky lg:top-18 lg:flex lg:self-start">
            <RecipeNavBackButton className="group grid h-10 w-10 grid-cols-1 grid-rows-1 rounded-full transition-all" />
            {ownerId != null && (
              <RecipeAuthorCard ownerId={ownerId} recipe={recipe} />
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
              onRecipeChange={(patch) =>
                setRecipe((prev) => (prev ? { ...prev, ...patch } : prev))
              }
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
              onRecipeChange={(patch) =>
                setRecipe((prev) => (prev ? { ...prev, ...patch } : prev))
              }
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
  );
}
