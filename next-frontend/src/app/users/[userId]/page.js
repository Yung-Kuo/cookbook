"use client";

import { useParams } from "next/navigation";
import RecipeListView from "@/components/UI/Main/RecipeListView";
import { fetchPersonalRecipes, fetchUserRecipes } from "@/api/recipes";
import { useAuth } from "@/context/AuthContext";

export default function UserPage() {
  const { userId } = useParams();
  const id = Array.isArray(userId) ? userId[0] : userId;
  const { user, isAuthenticated } = useAuth();

  const isOwnProfile =
    isAuthenticated && user?.pk === Number(id);

  const fetchFn = isOwnProfile
    ? fetchPersonalRecipes
    : (setRecipes, params) => fetchUserRecipes(id, setRecipes, params);

  const numericId = Number(id);
  return (
    <RecipeListView
      fetchFn={fetchFn}
      profileUserId={Number.isFinite(numericId) ? numericId : null}
    />
  );
}
