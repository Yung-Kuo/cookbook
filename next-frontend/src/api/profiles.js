import { apiFetch } from "@/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * @param {string|number} userId
 * @returns {Promise<object>}
 */
export async function fetchProfileByUserId(userId) {
  const response = await apiFetch(
    `${API_URL}/profiles/user-id/${userId}/`,
  );
  if (!response.ok) {
    throw new Error("Failed to load profile");
  }
  return response.json();
}
