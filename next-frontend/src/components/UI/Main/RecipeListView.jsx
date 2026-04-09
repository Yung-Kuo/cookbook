"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Recipe from "@/components/UI/Main/Recipe";
import RecipeListItem from "@/components/UI/Main/RecipeListItem";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import NewRecipePopup from "@/components/UI/Popups/NewRecipePopup";
import ComboboxCreate from "@/components/UI/HeadlessUI/ComboboxCreatable";
import Tag from "@/components/UI/Tag";
import { useTagPicker } from "@/hooks/useTagPicker";
import { fetchTags } from "@/api/tags";

export default function RecipeListView({ fetchFn }) {
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [tags, setTags] = useState([]);
  const debounceRef = useRef(null);

  const { comboKey, handleSelect, removeTag, availableOptions } = useTagPicker(
    tags,
    selectedFilterTags,
    setSelectedFilterTags,
  );

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
      <AddRecipeButton onClick={() => setShowNewRecipe(true)} />
      {/* left panel */}
      <div
        className={`flex h-full w-full flex-col lg:w-2/5 ${showNewRecipe || recipeToEdit || selectedRecipe ? "overflow-hidden lg:overflow-scroll" : "overflow-scroll"}`}
      >
        {/* Search & Filter Bar */}
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-neutral-800 px-6 py-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Search recipe titles"
              value={search}
              onChange={handleSearchChange}
              className="h-10 w-full min-w-0 rounded-md border-2 border-transparent bg-neutral-900 px-3 text-lg text-neutral-100 placeholder-neutral-500 focus:border-sky-600 focus:outline-none"
            />
            <div className="">
              <ComboboxCreate
                key={comboKey}
                name="Search tags"
                options={availableOptions}
                value={null}
                onChange={handleSelect}
                noCreate
                className="h-10 w-full min-w-0 rounded-md border-2 border-transparent bg-neutral-900 px-3 text-lg text-neutral-100 placeholder-neutral-500 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex min-h-10 min-w-0 flex-wrap gap-2 rounded-md bg-neutral-900/50 px-2 py-2">
            {selectedFilterTags.map((tag) => (
              <Tag
                key={tag.id ?? `new-${tag.name}`}
                onRemove={() => removeTag(tag)}
              >
                {tag.name}
              </Tag>
            ))}
          </div>
        </div>

        {/* recipe list */}
        <div className="flex flex-col gap-2 py-2 w-full">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className={`w-full transition-all ${selectedRecipe?.id === recipe.id ? "pr-0 pl-4" : "px-6"}`}
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
