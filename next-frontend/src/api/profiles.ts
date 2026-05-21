import { apiFetch } from "@/api/client"
import type { UserProfile } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const fetchProfileByUserId = async (
  userId: string | number,
): Promise<UserProfile> => {
  const response = await apiFetch(
    `${API_URL}/profiles/user-id/${userId}/`,
  )
  if (!response.ok) {
    throw new Error("Failed to load profile")
  }
  return (await response.json()) as UserProfile
}
