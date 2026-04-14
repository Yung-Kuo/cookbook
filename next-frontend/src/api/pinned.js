import { getAuthHeaders } from "@/api/auth";
import { apiFetch } from "@/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function isProbablyHtml(body) {
  const s = String(body ?? "")
    .trimStart()
    .slice(0, 64)
    .toLowerCase();
  return s.startsWith("<!doctype") || s.startsWith("<html");
}

function messageForHtmlError(response) {
  if (response.status === 404) {
    return "Pinned recipes API not found (404). Deploy the latest backend so /api/profiles/me/pinned-recipes/ exists.";
  }
  return `Server returned ${response.status} with an HTML error page instead of JSON.`;
}

/** Best-effort message from DRF / JSON error bodies */
async function messageFromErrorResponse(response) {
  const raw = await response.text();
  if (isProbablyHtml(raw)) {
    return messageForHtmlError(response);
  }
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    return raw || `Request failed (${response.status})`;
  }
  const d = data.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof item === "object" && item?.msg != null
            ? String(item.msg)
            : JSON.stringify(item),
      )
      .join(" ");
  }
  if (d && typeof d === "object") {
    return JSON.stringify(d);
  }
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return data.non_field_errors.join(" ");
  }
  return raw || `Request failed (${response.status})`;
}

/**
 * @param {number | string} userId
 * @returns {Promise<Array<{ order: number, recipe: { id, title, cover_image_url, is_public, owner_id } }>>}
 */
export async function fetchPinnedRecipes(userId) {
  const response = await apiFetch(
    `${API_URL}/profiles/user-id/${encodeURIComponent(String(userId))}/pinned-recipes/`,
    {
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok) throw new Error("Failed to load pinned recipes");
  return response.json();
}

export async function pinRecipe(recipeId) {
  const response = await apiFetch(`${API_URL}/profiles/me/pinned-recipes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ recipe_id: recipeId }),
  });
  if (!response.ok) {
    const msg = await messageFromErrorResponse(response);
    throw new Error(msg || "Could not pin recipe");
  }
  return response.json();
}

export async function unpinRecipe(recipeId) {
  const response = await apiFetch(
    `${API_URL}/profiles/me/pinned-recipes/${encodeURIComponent(String(recipeId))}/`,
    {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    },
  );
  if (!response.ok && response.status !== 204) {
    const msg = await messageFromErrorResponse(response);
    throw new Error(msg || "Could not unpin recipe");
  }
}
