"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Recipe from "@/components/UI/Main/Recipe";
import RecipeListItem from "@/components/UI/Main/RecipeListItem";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import NewRecipePopup from "@/components/UI/Popups/NewRecipePopup";
import { fetchCategories } from "@/api/categories";

export default function RecipeListView({ fetchFn }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const doFetch = useCallback(
    (searchVal, categoryVal) => {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (categoryVal) params.category = categoryVal;
      fetchFn(setRecipes, params);
    },
    [fetchFn],
  );

  useEffect(() => {
    doFetch(search, categoryFilter);
  }, [categoryFilter, doFetch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(val, categoryFilter);
    }, 350);
  };

  const handleCloseRecipePopup = () => {
    setShowNewRecipe(false);
    setRecipeToEdit(null);
  };

  const handleRecipeUpdated = (updated) => {
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev));
  };

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
        className={`flex h-full w-full flex-col lg:w-2/5 ${showNewRecipe || recipeToEdit || selectedRecipe ? "overflow-hidden lg:overflow-scroll" : "overflow-scroll"}`}
      >
        {/* Search & Filter Bar */}
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-neutral-800 px-4 py-3">
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 py-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`w-full transition-all ${selectedRecipe?.id === recipe.id ? "pr-0 pl-4" : "pr-8 pl-4"}`}
            >
              <RecipeListItem
                recipe={recipe}
                isSelected={selectedRecipe?.id === recipe.id}
                onSelect={() => {
                  if (selectedRecipe?.id === recipe.id) {
                    setSelectedRecipe(null);
                    return;
                  }
                  setSelectedRecipe(recipe);
                }}
              />
            </div>
          ))}
        </div>
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
