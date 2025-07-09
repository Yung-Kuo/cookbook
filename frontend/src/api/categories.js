// fetch functions for category
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/categories/`);
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
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/categories/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      },
    );
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
