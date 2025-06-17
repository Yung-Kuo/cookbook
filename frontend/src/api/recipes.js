// fetch function for recipes
export const fetchRecipes = async (setRecipes) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/recipes/`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    setRecipes(data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
export const createRecipe = async (recipeData) => {
  try {
    console.log("Sending data to API:", JSON.stringify(recipeData, null, 2));

    const response = await fetch(`${import.meta.env.VITE_API_URL}/recipes/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
