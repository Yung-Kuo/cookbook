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
