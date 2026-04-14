"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Recipe from "@/components/UI/Main/Recipe";
import RecipeListItem from "@/components/UI/Main/RecipeListItem";
import RecipeListSearchBar from "@/components/UI/Main/RecipeListSearchBar";
import UserProfileSidePanel from "@/components/UI/Main/UserProfileSidePanel";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import RecipeFormModal from "@/components/UI/Popups/RecipeFormModal";
import { fetchRecipeById } from "@/api/recipes";
import { fetchTags } from "@/api/tags";
import { useAppNav } from "@/hooks/useAppNav";

function RecipeListViewContent({ fetchFn, profileUserId = null }) {
  const router = useRouter();
  const { isAuthenticated, loginHref } = useAppNav();
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

  const isProfile = profileUserId != null;

  const recipeListItems = recipes.map((recipe) => (
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
  ));

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800 text-4xl lg:flex">
      <RecipeFormModal
        show={showNewRecipe || !!recipeToEdit}
        onClose={handleCloseRecipePopup}
        onRecipeCreated={(newRecipe) =>
          setRecipes((prev) => [...prev, newRecipe])
        }
        existingRecipe={recipeToEdit}
        onRecipeUpdated={handleRecipeUpdated}
        onRecipeDeleted={(recipeId) => {
          setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
          setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev));
          setRecipeToEdit((prev) => (prev?.id === recipeId ? null : prev));
          setShowNewRecipe(false);
        }}
      />
      <AddRecipeButton
        onClick={() => {
          if (isAuthenticated) setShowNewRecipe(true);
          else router.push(loginHref);
        }}
      />
      {/* left: profile = mobile column + lg column; else single search + list */}
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:w-2/5 lg:pt-14">
        {isProfile ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain lg:hidden">
              <UserProfileSidePanel
                userId={profileUserId}
                className="!pt-4 !pb-4"
              />
              <div className="sticky top-0 z-30 bg-neutral-800">
                <RecipeListSearchBar
                  search={search}
                  onSearchChange={handleSearchChange}
                  tags={tags}
                  selectedFilterTags={selectedFilterTags}
                  onFilterTagsChange={setSelectedFilterTags}
                />
              </div>
              <div className="flex flex-col gap-2 p-4 pb-24 lg:p-6">
                {recipeListItems}
              </div>
            </div>
            <div className="hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex">
              <RecipeListSearchBar
                search={search}
                onSearchChange={handleSearchChange}
                tags={tags}
                selectedFilterTags={selectedFilterTags}
                onFilterTagsChange={setSelectedFilterTags}
              />
              <div className="flex min-h-0 w-full min-w-0 flex-1 flex-grow flex-col gap-2 overflow-y-auto overscroll-y-contain p-4 pb-24 lg:p-6 lg:px-0">
                {recipeListItems}
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <RecipeListSearchBar
              search={search}
              onSearchChange={handleSearchChange}
              tags={tags}
              selectedFilterTags={selectedFilterTags}
              onFilterTagsChange={setSelectedFilterTags}
            />
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-grow flex-col gap-2 overflow-y-auto overscroll-y-contain p-4 pb-24 lg:p-6 lg:px-0">
              {recipeListItems}
            </div>
          </div>
        )}
      </div>
      {/* right panel: desktop profile when user page; Recipe overlays when selected (same mount for all routes) */}
      {(isProfile || selectedRecipe) && (
        <div
          className={
            isProfile
              ? selectedRecipe
                ? "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden lg:relative lg:h-full lg:w-3/5"
                : "relative hidden h-full w-full overflow-hidden lg:flex lg:w-3/5 lg:flex-col"
              : "relative h-full min-h-0 w-full lg:w-3/5"
          }
        >
          {isProfile && (
            <div className="absolute top-14 hidden min-h-0 flex-1 overflow-y-auto lg:block">
              <UserProfileSidePanel userId={profileUserId} />
            </div>
          )}
          {selectedRecipe && (
            <Recipe
              selectedRecipe={selectedRecipe}
              onClose={() => setSelectedRecipe(null)}
              onEdit={() => setRecipeToEdit(selectedRecipe)}
              onRecipeChange={handleRecipeChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function RecipeListView(props) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-1 overflow-hidden bg-neutral-800" />
      }
    >
      <RecipeListViewContent {...props} />
    </Suspense>
  );
}
