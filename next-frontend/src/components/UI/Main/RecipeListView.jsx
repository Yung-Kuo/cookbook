"use client";

import { useState, useEffect } from "react";
import Recipe from "@/components/UI/Main/Recipe";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import NewRecipePopup from "@/components/UI/Popups/NewRecipePopup";

export default function RecipeListView({ fetchFn }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  const handleCloseRecipePopup = () => {
    setShowNewRecipe(false);
    setRecipeToEdit(null);
  };

  const handleRecipeUpdated = (updated) => {
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev));
  };

  useEffect(() => {
    fetchFn(setRecipes);
  }, [fetchFn]);

  return (
    <div className="grid h-full w-full grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800 text-4xl lg:flex">
      <NewRecipePopup
        show={showNewRecipe || !!recipeToEdit}
        onClose={handleCloseRecipePopup}
        onRecipeCreated={(newRecipe) =>
          setRecipes((prev) => [...prev, newRecipe])
        }
        existingRecipe={recipeToEdit}
        onRecipeUpdated={handleRecipeUpdated}
      />
      <AddRecipeButton onClick={() => setShowNewRecipe(true)} />
      {/* left panel */}
      <div
        className={`flex h-full w-full flex-col gap-2 lg:w-2/5 lg:pl-5 lg:py-5 ${showNewRecipe || recipeToEdit || selectedRecipe ? "overflow-hidden lg:overflow-scroll" : "overflow-scroll"}`}
      >
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => {
              if (selectedRecipe?.id === recipe.id) {
                setSelectedRecipe(null);
                return;
              }
              setSelectedRecipe(recipe);
            }}
            className={`flex w-full hover:bg-neutral-600 bg-neutral-700 break-words whitespace-pre-wrap cursor-pointer items-center border-b-2 py-2 pr-5 transition-all ${selectedRecipe?.id === recipe.id ? "box-border border-white text-red-300" : "border-transparent"}`}
          >
            <div
              className={`flex h-full items-center justify-center transition-all ${selectedRecipe?.id === recipe.id ? "px-4" : "px-2"}`}
            >
              <span
                className={`rounded-full bg-red-300 transition-all ${selectedRecipe?.id === recipe.id ? "h-5 w-5 opacity-100" : "h-0 w-0 opacity-0"}`}
              />
            </div>
            <h2 className="w-[calc(100%-2rem)] ">{recipe.title}</h2>
          </div>
        ))}
      </div>
      {/* right panel */}
      {selectedRecipe && (
        <Recipe
          selectedRecipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onEdit={() => setRecipeToEdit(selectedRecipe)}
          className="z-20 h-full w-full lg:w-3/5"
        />
      )}
    </div>
  );
}
