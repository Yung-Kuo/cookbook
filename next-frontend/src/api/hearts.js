const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

/**
 * Toggle heart on a recipe. Returns { hearted, heart_count }.
 */
export async function toggleHeart(recipeId) {
  const response = await fetch(`${API_URL}/recipes/${recipeId}/heart/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not update heart");
  }
  return response.json();
}
