// fetch functions for category
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchCategories = async () => {
  console.log("API_URL: ", API_URL);
  try {
    const response = await fetch(`${API_URL}/categories/`);
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await fetch(`${API_URL}/categories/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      throw new Error("Failed to create category");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};
