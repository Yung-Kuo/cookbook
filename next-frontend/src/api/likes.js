const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

/**
 * Toggle like on a recipe. Returns { liked, like_count }.
 */
export async function toggleLike(recipeId) {
  const response = await fetch(`${API_URL}/recipes/${recipeId}/like/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not update like");
  }
  return response.json();
}
