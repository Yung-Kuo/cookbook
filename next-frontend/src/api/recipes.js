const API_URL = process.env.NEXT_PUBLIC_API_URL;

import { getAuthHeaders } from "@/api/auth";

export const fetchRecipes = async (setRecipes) => {
  try {
    const response = await fetch(`${API_URL}/recipes/`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

export const fetchPersonalRecipes = async (setRecipes) => {
  try {
    const response = await fetch(`${API_URL}/recipes/?personal=true`, {
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

export const fetchUserRecipes = async (username, setRecipes) => {
  try {
    const response = await fetch(`${API_URL}/recipes/?owner=${encodeURIComponent(username)}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching user recipes:", error);
  }
};

export const fetchRecipeById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/recipes/${id}/`);
    if (!response.ok) {
      throw new Error("Failed to fetch recipe");
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching recipe:", error);
    throw error;
  }
};

export const createRecipe = async (recipeData) => {
  try {
    const response = await fetch(`${API_URL}/recipes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(recipeData),
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
    const response = await fetch(`${API_URL}/recipes/${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(recipeData),
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
