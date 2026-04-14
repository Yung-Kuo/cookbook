"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";
import { fetchRecipeById } from "@/api/recipes";
import Recipe from "@/components/UI/Recipe/Recipe";

export default function RecipeDetailPage() {
  const { userId, id } = useParams();
  const uid = Array.isArray(userId) ? userId[0] : userId;
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const recipeId = Array.isArray(id) ? id[0] : id;
    fetchRecipeById(recipeId)
      .then(setRecipe)
      .catch(() => setError("Recipe not found"));
  }, [id]);

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

  return (
    <Recipe
      selectedRecipe={recipe}
      onClose={null}
      onRecipeChange={(patch) =>
        setRecipe((prev) => (prev ? { ...prev, ...patch } : prev))
      }
      className="h-full w-full"
    />
  );
}
