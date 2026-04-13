"use client";

import RecipeForm from "../../Forms/RecipeForm";
import { CloseButton } from "../Buttons/CloseButton";

function RecipeFormModal({
  show,
  onClose,
  onRecipeCreated,
  existingRecipe,
  onRecipeUpdated,
  onRecipeDeleted,
}) {
  return (
    <div
      className={`fixed top-0 left-0 z-40 flex h-screen w-screen items-center justify-center overflow-hidden ${show ? "" : "hidden"}`}
      aria-hidden={!show}
    >
      {/* mask */}
      <div
        onClick={onClose}
        className="fixed top-0 left-0 z-30 h-full w-full bg-neutral-600/60 backdrop-blur-xs"
      ></div>
      {/* Recipe Form */}
      <div className="z-40 h-full w-full bg-neutral-800 md:h-5/6 md:max-h-[88rem] md:w-4/5 md:max-w-[72rem] md:rounded-md">
        {/* Close Button */}
        <div className="relative">
          <div className="absolute top-5 right-5 z-50">
            <CloseButton onClose={onClose} />
          </div>
        </div>

        {/* Form */}
        <RecipeForm
          onClose={onClose}
          onRecipeCreated={onRecipeCreated}
          existingRecipe={existingRecipe}
          onRecipeUpdated={onRecipeUpdated}
          onRecipeDeleted={onRecipeDeleted}
        />
      </div>
    </div>
  );
}

export default RecipeFormModal;
