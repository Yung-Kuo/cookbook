const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

/**
 * @param {number | string | undefined} recipeId - when set, each collection includes contains_recipe
 */
export async function fetchCollections(recipeId) {
  const q =
    recipeId != null && recipeId !== ""
      ? `?recipe_id=${encodeURIComponent(String(recipeId))}`
      : "";
  const response = await fetch(`${API_URL}/collections/${q}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to load collections");
  return response.json();
}

export async function fetchCollectionById(id) {
  const response = await fetch(`${API_URL}/collections/${id}/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to load collection");
  return response.json();
}

export async function createCollection({ name, description = "" }) {
  const response = await fetch(`${API_URL}/collections/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, description }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || "Create failed");
  }
  return response.json();
}

export async function addRecipeToCollection(collectionId, recipeId) {
  const response = await fetch(
    `${API_URL}/collections/${collectionId}/recipes/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not add to collection");
  }
  return response.json();
}

export async function removeRecipeFromCollection(collectionId, recipeId) {
  const response = await fetch(
    `${API_URL}/collections/${collectionId}/recipes/${recipeId}/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not remove from collection");
  }
}

export async function deleteCollection(collectionId) {
  const response = await fetch(`${API_URL}/collections/${collectionId}/`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Delete failed");
  }
}
