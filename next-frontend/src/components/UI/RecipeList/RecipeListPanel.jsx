"use client";

import { useRouter } from "next/navigation";
import RecipeListSearchBar from "@/components/UI/RecipeList/RecipeListSearchBar";
import AddRecipeButton from "@/components/UI/Buttons/AddRecipeButton";
import RecipeFormModal from "@/components/UI/Popups/RecipeFormModal";
import { useAuth } from "@/context/AuthContext";

export default function RecipeListPanel({
  recipeList,
  isAuthenticated,
  loginHref,
  /** When set (profile route), FAB only if logged-in user matches. Omit on public catalog. */
  profileUserId,
  withModal = true,
  children,
}) {
  const router = useRouter();
  const { user } = useAuth();
  const showAddRecipeButton =
    profileUserId == null
      ? true
      : Boolean(user?.pk === Number(profileUserId));
  const {
    search,
    handleSearchChange,
    tags,
    selectedFilterTags,
    setSelectedFilterTags,
    recipeToEdit,
    handleCloseForm,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
    isFormOpen,
    setFormOpen,
  } = recipeList;

  const onAddClick = () => {
    if (isAuthenticated) setFormOpen(true);
    else router.push(loginHref);
  };

  return (
    <>
      {withModal && (
        <RecipeFormModal
          show={isFormOpen || !!recipeToEdit}
          onClose={handleCloseForm}
          onRecipeCreated={handleRecipeCreated}
          existingRecipe={recipeToEdit}
          onRecipeUpdated={handleRecipeUpdated}
          onRecipeDeleted={handleRecipeDeleted}
        />
      )}
      {showAddRecipeButton && <AddRecipeButton onClick={onAddClick} />}
      <RecipeListSearchBar
        search={search}
        onSearchChange={handleSearchChange}
        tags={tags}
        selectedFilterTags={selectedFilterTags}
        onFilterTagsChange={setSelectedFilterTags}
      />
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-grow flex-col gap-2 overflow-y-auto overscroll-y-contain pt-4 px-4 pb-24 lg:pt-6 lg:px-0">
        {children}
      </div>
    </>
  );
}
