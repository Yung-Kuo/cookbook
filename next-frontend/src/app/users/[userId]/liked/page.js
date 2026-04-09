"use client";

import { useParams } from "next/navigation";
import RecipeListView from "@/components/UI/Main/RecipeListView";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";
import { fetchLikedRecipes } from "@/api/recipes";
import { useAuth } from "@/context/AuthContext";

export default function LikedPage() {
  const { userId } = useParams();
  const id = Array.isArray(userId) ? userId[0] : userId;
  const { user, isAuthenticated, loading } = useAuth();

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

  if (user?.pk !== Number(id)) {
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

  return <RecipeListView fetchFn={fetchLikedRecipes} />;
}
