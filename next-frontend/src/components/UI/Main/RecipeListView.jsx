"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Recipe from "@/components/UI/Main/Recipe";
import RecipeListItem from "@/components/UI/Main/RecipeListItem";
import RecipeListSearchBar from "@/components/UI/Main/RecipeListSearchBar";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import NewRecipePopup from "@/components/UI/Popups/NewRecipePopup";
import { fetchTags } from "@/api/tags";
import { useAuth } from "@/context/AuthContext";

export default function RecipeListView({ fetchFn }) {
  const { isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [tags, setTags] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchTags()
      .then(setTags)
      .catch(() => {});
  }, []);

  const doFetch = useCallback(
    (searchVal, tagIds) => {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (tagIds?.length) params.tags = tagIds;
      fetchFn(setRecipes, params);
    },
    [fetchFn],
  );

  useEffect(() => {
    doFetch(
      search,
      selectedFilterTags.map((t) => t.id).filter((id) => id != null),
    );
  }, [selectedFilterTags, doFetch]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(
        val,
        selectedFilterTags.map((t) => t.id).filter((id) => id != null),
      );
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
      {isAuthenticated && (
        <AddRecipeButton onClick={() => setShowNewRecipe(true)} />
      )}
      {/* left panel */}
      <div className="flex h-full w-full flex-col overflow-hidden lg:w-2/5">
        <RecipeListSearchBar
          search={search}
          onSearchChange={handleSearchChange}
          tags={tags}
          selectedFilterTags={selectedFilterTags}
          onFilterTagsChange={setSelectedFilterTags}
        />

        {/* recipe list */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 lg:px-0 py-2 pb-24 w-full">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`w-full transition-all ${selectedRecipe?.id === recipe.id ? "lg:pr-0 lg:pl-4" : "lg:px-6"}`}
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
