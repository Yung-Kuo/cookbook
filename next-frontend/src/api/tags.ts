import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type { Tag, TagCreatePayload } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const fetchTags = async (): Promise<Tag[]> => {
  const response = await apiFetch(`${API_URL}/tags/`)
  if (!response.ok) {
    throw new Error("Failed to fetch tags")
  }
  return (await response.json()) as Tag[]
}

export const createTag = async (tagData: TagCreatePayload): Promise<Tag> => {
  const response = await apiFetch(`${API_URL}/tags/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(tagData),
  })
  if (!response.ok) {
    throw new Error("Failed to create tag")
  }
  return (await response.json()) as Tag
}
