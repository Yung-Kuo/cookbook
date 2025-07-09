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

export const createIngredient = async (ingredientData) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/ingredients/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ingredientData),
      },
    );
    const responseData = await response.json();

    if (!response.ok) {
      console.error("API Error Response:", responseData);
      throw new Error(responseData.detail || JSON.stringify(responseData));
    }

    return responseData;
  } catch (error) {
    console.error("Error creating ingredient:", error);
    throw error;
  }
};
