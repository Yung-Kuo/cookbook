"use client";

import { useParams } from "next/navigation";
import RecipeListView from "@/components/UI/Main/RecipeListView";
import { fetchPersonalRecipes, fetchUserRecipes } from "@/api/recipes";
import { useAuth } from "@/context/AuthContext";

export default function UserPage() {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();

  const isOwnProfile = isAuthenticated && user?.username === username;

  const fetchFn = isOwnProfile
    ? fetchPersonalRecipes
    : (setRecipes) => fetchUserRecipes(username, setRecipes);

  return <RecipeListView fetchFn={fetchFn} />;
}
