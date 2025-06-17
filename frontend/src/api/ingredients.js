export const fetchIngredients = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/ingredients/`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch ingredients");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};
