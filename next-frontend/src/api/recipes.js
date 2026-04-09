const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

export const fetchRecipes = async (setRecipes, params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_URL}/recipes/?${query}` : `${API_URL}/recipes/`;
    const response = await fetch(url, {
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
    const query = new URLSearchParams({ personal: "true", ...params }).toString();
    const response = await fetch(`${API_URL}/recipes/?${query}`, {
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

export const fetchUserRecipes = async (userId, setRecipes, params = {}) => {
  try {
    const query = new URLSearchParams({
      owner_id: String(userId),
      ...params,
    }).toString();
    const response = await fetch(`${API_URL}/recipes/?${query}`, {
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

export const fetchHeartedRecipes = async (setRecipes, params = {}) => {
  try {
    const query = new URLSearchParams({
      hearted: "true",
      ...params,
    }).toString();
    const response = await fetch(`${API_URL}/recipes/?${query}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching hearted recipes:", error);
  }
};

export const fetchRecipeById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/recipes/${id}/`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
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
    const response = await fetch(`${API_URL}/recipes/`, {
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
    const response = await fetch(`${API_URL}/recipes/${id}/`, {
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
