"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import RecipeListView from "@/components/UI/Main/RecipeListView";
import { fetchHeartedRecipes } from "@/api/recipes";
import { useAuth } from "@/context/AuthContext";

export default function HeartedPage() {
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
        <p>Log in to see recipes you have hearted.</p>
        <Link
          href="/login"
          className="rounded-full bg-red-300 px-5 py-2 text-neutral-900"
        >
          Login
        </Link>
      </div>
    );
  }

  if (user?.pk !== Number(id)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <p>This page only shows your own hearted recipes.</p>
        <Link
          href={`/users/${user.pk}/hearted`}
          className="rounded-full bg-sky-600 px-5 py-2 text-neutral-100 transition-all hover:bg-sky-500"
        >
          Go to my hearted recipes
        </Link>
      </div>
    );
  }

  return <RecipeListView fetchFn={fetchHeartedRecipes} />;
}
