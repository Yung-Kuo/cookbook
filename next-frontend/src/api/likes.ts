import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type { ApiErrorBody, LikeToggleResponse } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Toggle like on a recipe. Returns { liked, like_count }. */
export const toggleLike = async (
  recipeId: string | number,
): Promise<LikeToggleResponse> => {
  const response = await apiFetch(`${API_URL}/recipes/${recipeId}/like/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Could not update like",
    )
  }
  return (await response.json()) as LikeToggleResponse
}
