import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type { ApiErrorBody, CollectionDetail, CollectionListItem } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** When recipeId is set, each collection includes contains_recipe */
export const fetchCollections = async (
  recipeId?: number | string,
): Promise<CollectionListItem[]> => {
  const sp = new URLSearchParams()
  if (recipeId != null && recipeId !== "") {
    sp.set("recipe_id", String(recipeId))
  }
  const q = sp.toString()
  const url = q
    ? `${API_URL}/collections/?${q}`
    : `${API_URL}/collections/`
  const response = await apiFetch(url, {
    headers: { ...getAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to load collections")
  return (await response.json()) as CollectionListItem[]
}

/** Profile user whose collections to list */
export const fetchUserCollections = async (
  userId: number | string,
): Promise<CollectionListItem[]> => {
  const response = await apiFetch(
    `${API_URL}/collections/?user_id=${encodeURIComponent(String(userId))}`,
    {
      headers: { ...getAuthHeaders() },
    },
  )
  if (!response.ok) throw new Error("Failed to load collections")
  return (await response.json()) as CollectionListItem[]
}

export const fetchCollectionById = async (
  id: number | string,
): Promise<CollectionDetail> => {
  const response = await apiFetch(`${API_URL}/collections/${id}/`, {
    headers: { ...getAuthHeaders() },
  })
  if (!response.ok) throw new Error("Failed to load collection")
  return (await response.json()) as CollectionDetail
}

type CreateCollectionInput = {
  name: string
  description?: string
  is_public?: boolean
}

export const createCollection = async ({
  name,
  description = "",
  is_public = false,
}: CreateCollectionInput): Promise<CollectionListItem> => {
  const response = await apiFetch(`${API_URL}/collections/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name, description, is_public }),
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : JSON.stringify(err) || "Create failed",
    )
  }
  return (await response.json()) as CollectionListItem
}

export const addRecipeToCollection = async (
  collectionId: number | string,
  recipeId: number | string,
): Promise<unknown> => {
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
  )
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Could not add to collection",
    )
  }
  return response.json()
}

export const removeRecipeFromCollection = async (
  collectionId: number | string,
  recipeId: number | string,
): Promise<void> => {
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/recipes/${recipeId}/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  )
  if (!response.ok && response.status !== 204) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : "Could not remove from collection",
    )
  }
}

export const deleteCollection = async (
  collectionId: number | string,
): Promise<void> => {
  const response = await apiFetch(`${API_URL}/collections/${collectionId}/`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  })
  if (!response.ok && response.status !== 204) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(typeof err.detail === "string" ? err.detail : "Delete failed")
  }
}

export const toggleCollectionVisibility = async (
  collectionId: number | string,
): Promise<CollectionListItem> => {
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/visibility/`,
    {
      method: "PATCH",
      headers: { ...getAuthHeaders() },
    },
  )
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : "Could not update visibility",
    )
  }
  return (await response.json()) as CollectionListItem
}

export const uploadCollectionCover = async (
  collectionId: number | string,
  file: File,
): Promise<CollectionListItem> => {
  const body = new FormData()
  body.append("image", file)
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/cover/`,
    {
      method: "POST",
      headers: { ...getAuthHeaders() },
      body,
    },
  )
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(typeof err.detail === "string" ? err.detail : "Upload failed")
  }
  return (await response.json()) as CollectionListItem
}

export const deleteCollectionCover = async (
  collectionId: number | string,
): Promise<CollectionListItem> => {
  const response = await apiFetch(
    `${API_URL}/collections/${collectionId}/cover/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  )
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Could not remove cover",
    )
  }
  return (await response.json()) as CollectionListItem
}
