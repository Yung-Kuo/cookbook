import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type { ApiErrorBody, RecipeImage } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const uploadRecipeImage = async (
  recipeId: number | string,
  file: File,
  isCover = false,
): Promise<RecipeImage> => {
  const formData = new FormData()
  formData.append("image", file)
  formData.append("is_cover", isCover ? "true" : "false")

  const response = await apiFetch(`${API_URL}/recipes/${recipeId}/images/`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  })

  const data = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Partial<RecipeImage>
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data) || "Upload failed",
    )
  }
  return data as RecipeImage
}

export const deleteRecipeImage = async (
  recipeId: number | string,
  imageId: number | string,
): Promise<void> => {
  const response = await apiFetch(
    `${API_URL}/recipes/${recipeId}/images/${imageId}/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  )
  if (!response.ok && response.status !== 204) {
    const data = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Delete failed",
    )
  }
}

export const setCoverImage = async (
  recipeId: number | string,
  imageId: number | string,
): Promise<RecipeImage> => {
  const response = await apiFetch(
    `${API_URL}/recipes/${recipeId}/images/${imageId}/set-cover/`,
    {
      method: "PATCH",
      headers: { ...getAuthHeaders() },
    },
  )
  const data = (await response.json().catch(() => ({}))) as ApiErrorBody &
    Partial<RecipeImage>
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string" ? data.detail : "Set cover failed",
    )
  }
  return data as RecipeImage
}
