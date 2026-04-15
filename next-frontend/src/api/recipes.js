import { getAuthHeaders } from "@/api/auth";
import { apiFetch } from "@/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** Builds query string; repeats `tags` so the API ANDs them (recipes must match every tag). */
export function recipeListQueryString(params = {}) {
  const { tags, ...rest } = params;
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(rest)) {
    if (value == null || value === "") continue;
    sp.set(key, String(value));
  }
  if (Array.isArray(tags)) {
    tags.forEach((id) => {
      if (id != null && id !== "") sp.append("tags", String(id));
    });
  } else if (tags != null && tags !== "") {
    sp.append("tags", String(tags));
  }
  return sp.toString();
}

export const fetchRecipes = async (setRecipes, params = {}) => {
  try {
    const query = recipeListQueryString(params);
    const url = query ? `${API_URL}/recipes/?${query}` : `${API_URL}/recipes/`;
    const response = await apiFetch(url, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const fetchPersonalRecipes = async (setRecipes, params = {}) => {
  try {
    const query = recipeListQueryString({ personal: "true", ...params });
    const response = await apiFetch(`${API_URL}/recipes/?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching personal recipes:", error);
  }
};

/** Returns current user's recipes (for pin picker, etc.) */
export async function fetchPersonalRecipesList(params = {}) {
  const query = recipeListQueryString({ personal: "true", ...params });
  const response = await apiFetch(`${API_URL}/recipes/?${query}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!response.ok) throw new Error("Failed to load recipes");
  return response.json();
}

export const fetchUserRecipes = async (userId, setRecipes, params = {}) => {
  try {
    const query = recipeListQueryString({
      owner_id: String(userId),
      ...params,
    });
    const response = await apiFetch(`${API_URL}/recipes/?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching user recipes:", error);
  }
};

export const fetchLikedRecipes = async (setRecipes, params = {}) => {
  try {
    const query = recipeListQueryString({
      liked: "true",
      ...params,
    });
    const response = await apiFetch(`${API_URL}/recipes/?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching liked recipes:", error);
  }
};

export const fetchRecipeById = async (id) => {
  try {
    const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      const detail =
        response.status === 404
          ? "Recipe not found (or not visible without login)."
          : `Failed to fetch recipe (${response.status})`;
      throw new Error(detail);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw error;
  }
};

function buildRecipeBody(recipeData) {
  return {
    body: JSON.stringify(recipeData),
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
  };
}

export const createRecipe = async (recipeData) => {
  try {
    const { body, headers } = buildRecipeBody(recipeData);
    const response = await apiFetch(`${API_URL}/recipes/`, {
      method: "POST",
      headers,
      body,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("API Error Response:", responseData);
      throw new Error(responseData.detail || JSON.stringify(responseData));
    }

    return { data: responseData };
  } catch (error) {
    console.error("Error creating recipe:", error);
    return { error: error.message };
  }
};

export const updateRecipe = async (id, recipeData) => {
  try {
    const { body, headers } = buildRecipeBody(recipeData);
    const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
      method: "PUT",
      headers,
      body,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("API Error Response:", responseData);
      throw new Error(responseData.detail || JSON.stringify(responseData));
    }

    return { data: responseData };
  } catch (error) {
    console.error("Error updating recipe:", error);
    return { error: error.message };
  }
};

export const deleteRecipe = async (id) => {
  try {
    const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      let message = "Failed to delete recipe";
      try {
        const responseData = await response.json();
        message = responseData.detail || JSON.stringify(responseData);
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return { data: true };
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return { error: error.message };
  }
};
