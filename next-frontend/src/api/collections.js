import { getAuthHeaders } from "@/api/auth";
import { apiFetch } from "@/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * @param {number | string | undefined} recipeId - when set, each collection includes contains_recipe
 */
export async function fetchCollections(recipeId) {
  const sp = new URLSearchParams();
  if (recipeId != null && recipeId !== "") {
    sp.set("recipe_id", String(recipeId));
  }
  const q = sp.toString();
  const url = q
    ? `${API_URL}/collections/?${q}`
    : `${API_URL}/collections/`;
  const response = await apiFetch(url, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to load collections");
  return response.json();
}

/**
 * @param {number | string} userId - profile user whose collections to list
 */
export async function fetchUserCollections(userId) {
  const response = await apiFetch(
    `${API_URL}/collections/?user_id=${encodeURIComponent(String(userId))}`,
    {
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok) throw new Error("Failed to load collections");
  return response.json();
}

export async function fetchCollectionById(id) {
  const response = await apiFetch(`${API_URL}/collections/${id}/`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to load collection");
  return response.json();
}

export async function createCollection({
  name,
  description = "",
  is_public = false,
}) {
  const response = await apiFetch(`${API_URL}/collections/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, description, is_public }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || JSON.stringify(err) || "Create failed");
  }
  return response.json();
}

export async function addRecipeToCollection(collectionId, recipeId) {
  const response = await apiFetch(
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
  const response = await apiFetch(
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
  const response = await apiFetch(`${API_URL}/collections/${collectionId}/`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Delete failed");
  }
}

export async function toggleCollectionVisibility(collectionId) {
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/visibility/`,
    {
      method: "PATCH",
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not update visibility");
  }
  return response.json();
}

export async function uploadCollectionCover(collectionId, file) {
  const body = new FormData();
  body.append("image", file);
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/cover/`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body,
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }
  return response.json();
}

export async function deleteCollectionCover(collectionId) {
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/cover/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Could not remove cover");
  }
  return response.json();
}
