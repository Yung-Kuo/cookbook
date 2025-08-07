import { useState, useEffect } from "react";
import { fetchRecipes } from "./api/recipes";
import Recipe from "./components/UI/Main/Recipe";
import AddRecipeButton from "./components/UI/Buttons/AddRecipeButton";
// import MaskPopup from "./components/UI/Popups/MaskPopup";
import NewRecipePopup from "./components/UI/Popups/NewRecipePopup";

function App() {
  const [recipes, setRecipes] = useState([]);

  const [IngredientList, setIngredientList] = useState([
    { ingredient: "", quantity: "", unit: "" },
  ]);

  const [category, setCategory] = useState([]);
  const units = [
    "g",
    "kg",
    "ml",
    "l",
    "tsp",
    "tbsp",
    "cup",
    "stalk",
    "piece",
    "unit",
  ];

  useEffect(() => {
    fetchRecipes(setRecipes);
  }, []);

  // const [showRecipe, setShowRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  //
  const [showNewRecipe, setShowNewRecipe] = useState(false);

  return (
    <div className="grid h-screen w-screen grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800 text-4xl lg:flex">
      {/* Mask popup */}
      {/* <MaskPopup /> */}
      {/* New recipe popup */}
      <NewRecipePopup
        show={showNewRecipe}
        onClose={() => setShowNewRecipe(false)}
        onRecipeCreated={(newRecipe) => setRecipes([...recipes, newRecipe])}
      />
      {/* AddRecipe button */}
      <AddRecipeButton onClick={() => setShowNewRecipe(true)} />
      {/* left panel */}
      <div className="flex h-full w-full flex-col overflow-scroll lg:w-2/5 lg:p-5">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className={`flex cursor-pointer items-center border-b-2 py-2 transition-all ${selectedRecipe?.id === recipe.id ? "box-border border-white text-red-300" : "border-transparent"}`}
          >
            <div
              className={`flex h-full items-center justify-center transition-all ${selectedRecipe?.id === recipe.id ? "px-4" : "px-2"}`}
            >
              <span
                className={`rounded-full bg-red-300 transition-all ${selectedRecipe?.id === recipe.id ? "h-5 w-5 opacity-100" : "h-0 w-0 opacity-0"}`}
              />
            </div>
            <h2
              onClick={() => {
                if (selectedRecipe?.id === recipe.id) {
                  // setShowRecipe(null);
                  setSelectedRecipe(null);
                  return;
                }
                // setShowRecipe(recipe.id);
                setSelectedRecipe(recipe);
              }}
            >
              {recipe.title}
            </h2>
          </div>
        ))}
      </div>
      {/* right panel */}
      {selectedRecipe && (
        <Recipe
          selectedRecipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          className="z-20 h-full w-full lg:w-3/5"
        />
      )}
    </div>
  );
}

export default App;
