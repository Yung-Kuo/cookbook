const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

/**
 * @param {number|string} recipeId
 * @param {File} file
 * @param {boolean} [isCover]
 */
export async function uploadRecipeImage(recipeId, file, isCover = false) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_cover", isCover ? "true" : "false");

  const response = await fetch(`${API_URL}/recipes/${recipeId}/images/`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || JSON.stringify(data) || "Upload failed");
  }
  return data;
}

export async function deleteRecipeImage(recipeId, imageId) {
  const response = await fetch(
    `${API_URL}/recipes/${recipeId}/images/${imageId}/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || "Delete failed");
  }
}

export async function setCoverImage(recipeId, imageId) {
  const response = await fetch(
    `${API_URL}/recipes/${recipeId}/images/${imageId}/set-cover/`,
    {
      method: "PATCH",
      headers: { ...getAuthHeaders() },
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Set cover failed");
  }
  return data;
}
