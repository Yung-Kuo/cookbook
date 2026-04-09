"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Recipe from "@/components/UI/Main/Recipe";
import RecipeListItem from "@/components/UI/Main/RecipeListItem";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import NewRecipePopup from "@/components/UI/Popups/NewRecipePopup";
import { fetchTags } from "@/api/tags";

export default function RecipeListView({ fetchFn }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [tags, setTags] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchTags().then(setTags).catch(() => {});
  }, []);

  const doFetch = useCallback(
    (searchVal, tagVal) => {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (tagVal) params.tags = tagVal;
      fetchFn(setRecipes, params);
    },
    [fetchFn],
  );

  useEffect(() => {
    doFetch(search, tagFilter);
  }, [tagFilter, doFetch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(val, tagFilter);
    }, 350);
  };

  const handleCloseRecipePopup = () => {
    setShowNewRecipe(false);
    setRecipeToEdit(null);
  };

  const handleRecipeChange = useCallback((patch) => {
    if (!patch?.id) return;
    setRecipes((prev) =>
      prev.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)),
    );
    setSelectedRecipe((prev) =>
      prev?.id === patch.id ? { ...prev, ...patch } : prev,
    );
  }, []);

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
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full rounded-md bg-neutral-900 px-3 py-2 text-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-sky-600"
          >
            <option value="">All tags</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
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
          onRecipeChange={handleRecipeChange}
          className="z-20 h-full w-full lg:w-3/5"
        />
      )}
    </div>
  );
}
