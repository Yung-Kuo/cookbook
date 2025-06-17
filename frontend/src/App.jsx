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

  const [showRecipe, setShowRecipe] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  //
  const [showNewRecipe, setShowNewRecipe] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-800 p-5 text-4xl">
      {/* Mask popup */}
      {/* <MaskPopup /> */}
      {/* New recipe popup */}
      <NewRecipePopup
        show={showNewRecipe}
        onClose={() => setShowNewRecipe(false)}
      />
      {/* AddRecipe button */}
      <AddRecipeButton onClick={() => setShowNewRecipe(true)} />
      {/* left panel */}
      <div className="flex h-full w-2/5 flex-col overflow-scroll">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className={`flex cursor-pointer items-center gap-4 border-b-2 p-2 transition-all ${showRecipe === recipe.id ? "box-border border-white text-red-300" : "border-transparent"}`}
          >
            <span
              className={`rounded-full bg-red-300 transition-all ${showRecipe === recipe.id ? "h-5 w-5 opacity-100" : "h-0 w-0 opacity-0"}`}
            ></span>
            <h2
              onClick={() => {
                if (showRecipe === recipe.id) {
                  setShowRecipe(null);
                  setSelectedRecipe(null);
                  return;
                }
                setShowRecipe(recipe.id);
                setSelectedRecipe(recipe);
              }}
            >
              {recipe.title}
            </h2>
          </div>
        ))}
      </div>
      {/* right panel */}
      {selectedRecipe && <Recipe selectedRecipe={selectedRecipe} />}
    </div>
  );
}

export default App;
