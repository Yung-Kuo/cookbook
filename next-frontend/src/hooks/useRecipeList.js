"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import RecipeListItem from "@/components/UI/RecipeList/RecipeListItem";
import { fetchRecipeById } from "@/api/recipes";
import { fetchTags } from "@/api/tags";
import { useAppNav } from "@/hooks/useAppNav";

/**
 * Shared recipe list state: fetch, search, tags, selection, CRUD patches.
 *
 * @param {{ fetchFn: (setRecipes: function, params: object) => void, publicCatalogOnly?: boolean, onAfterRecipeCreated?: (r: object) => void, onAfterRecipeUpdated?: (r: object) => void, onAfterRecipeDeleted?: (id: number) => void }} options
 */
export function useRecipeList({
  fetchFn,
  publicCatalogOnly = false,
  onAfterRecipeCreated,
  onAfterRecipeUpdated,
  onAfterRecipeDeleted,
}) {
  const { isAuthenticated } = useAppNav();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isFormOpen, setFormOpen] = useState(false);
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
      selectedFilterTags.map((tag) => tag.id).filter((id) => id != null),
    );
    // `search` updates are debounced in handleSearchChange; including it would double-fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterTags, doFetch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && selectedRecipe?.is_public === false) {
      setSelectedRecipe(null);
    }
  }, [isAuthenticated, selectedRecipe?.is_public, selectedRecipe?.id]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doFetch(
        val,
        selectedFilterTags.map((tag) => tag.id).filter((id) => id != null),
      );
    }, 350);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
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

  const handleRecipeCreated = useCallback(
    (newRecipe) => {
      setRecipes((prev) => [...prev, newRecipe]);
      onAfterRecipeCreated?.(newRecipe);
    },
    [onAfterRecipeCreated],
  );

  const handleRecipeUpdated = useCallback(
    (updated) => {
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev));
      onAfterRecipeUpdated?.(updated);
    },
    [onAfterRecipeUpdated],
  );

  const handleRecipeDeleted = useCallback(
    (recipeId) => {
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev));
      setRecipeToEdit((prev) => (prev?.id === recipeId ? null : prev));
      setFormOpen(false);
      onAfterRecipeDeleted?.(recipeId);
    },
    [onAfterRecipeDeleted],
  );

  const recipesForList = useMemo(() => {
    if (publicCatalogOnly) {
      return recipes.filter((r) => r.is_public !== false);
    }
    if (!isAuthenticated) {
      return recipes.filter((r) => r.is_public !== false);
    }
    return recipes;
  }, [publicCatalogOnly, isAuthenticated, recipes]);

  const recipeListItems = useMemo(
    () =>
      recipesForList.map((recipe) => (
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
              fetchRecipeById(recipe.id)
                .then((full) => {
                  setSelectedRecipe((prev) =>
                    prev?.id === recipe.id ? full : prev,
                  );
                })
                .catch(() => {});
            }}
          />
        </div>
      )),
    [recipesForList, selectedRecipe?.id],
  );

  return {
    recipes,
    setRecipes,
    search,
    handleSearchChange,
    tags,
    selectedFilterTags,
    setSelectedFilterTags,
    selectedRecipe,
    setSelectedRecipe,
    isFormOpen,
    setFormOpen,
    recipeToEdit,
    setRecipeToEdit,
    handleCloseForm,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
    handleRecipeChange,
    recipesForList,
    recipeListItems,
  };
}
