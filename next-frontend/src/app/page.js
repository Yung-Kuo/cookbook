"use client";

import RecipeListView from "@/components/UI/Main/RecipeListView";
import { fetchRecipes } from "@/api/recipes";

export default function PublicPage() {
  return <RecipeListView fetchFn={fetchRecipes} />;
}
