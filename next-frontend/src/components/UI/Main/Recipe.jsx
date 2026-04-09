"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CloseButton } from "../Buttons/CloseButton";
import LikeButton from "../Buttons/LikeButton";
import CollectionButton from "../Buttons/CollectionButton";
import RoundedButton from "../Buttons/RoundedButton";
import Tag from "../Tag";
import { useAuth } from "@/context/AuthContext";

function Recipe({
  selectedRecipe,
  onClose,
  onEdit,
  onRecipeChange,
  className,
}) {
  const { user, isAuthenticated } = useAuth();

  const isOwnRecipe =
    isAuthenticated && user?.pk != null && selectedRecipe?.owner_id === user.pk;

  const { createdDate, updatedDate, isUpdated } = useMemo(() => {
    if (!selectedRecipe) {
      return { createdDate: null, updatedDate: null, isUpdated: false };
    }

    const createdDate = new Date(selectedRecipe.created_at);
    const updatedDate = selectedRecipe.updated_at
      ? new Date(selectedRecipe.updated_at)
      : null;

    const isUpdated =
      updatedDate && updatedDate.getTime() !== createdDate.getTime();

    return { createdDate, updatedDate, isUpdated };
  }, [selectedRecipe]);

  if (!selectedRecipe) return null;

  return (
    <div
      className={`${className} absolute top-0 right-0 z-10 overflow-scroll bg-neutral-900 p-5 pt-16 pb-40 lg:pb-5 lg:pt-16`}
    >
      <div className="fixed top-18 right-5 z-20 flex flex-wrap items-center justify-end gap-3">
        {onEdit && (
          <RoundedButton
            type="button"
            onClick={onEdit}
            className="cursor-pointer bg-red-300 text-neutral-800 hover:bg-red-400 focus:outline-none active:scale-95 !text-lg !font-bold"
          >
            Edit
          </RoundedButton>
        )}
        {onClose && <CloseButton onClose={onClose} />}
      </div>

      <div className="flex flex-col gap-24 text-xl lg:text-2xl">
        <div className="flex flex-col gap-5">
          {selectedRecipe.cover_image_url && (
            <div className="-mx-5 -mt-5 overflow-hidden lg:-mt-16">
              <img
                src={selectedRecipe.cover_image_url}
                alt={selectedRecipe.title}
                className="h-64 w-full object-cover lg:h-96"
              />
            </div>
          )}
          {(selectedRecipe.images || []).length > 1 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto pb-2">
              {[...(selectedRecipe.images || [])]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((img) => (
                  <div
                    key={img.id}
                    className={`h-24 w-36 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                      img.is_cover ? "border-amber-500" : "border-transparent"
                    }`}
                  >
                    {img.image_url && (
                      <img
                        src={img.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href={`/users/${selectedRecipe.owner_id ?? "_"}/recipes/${selectedRecipe.id}`}
            >
              <h1 className="text-6xl break-words whitespace-pre-wrap transition-colors hover:text-red-300 lg:text-8xl">
                {selectedRecipe.title}
              </h1>
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <LikeButton
                recipe={selectedRecipe}
                isAuthenticated={isAuthenticated}
                isOwnRecipe={isOwnRecipe}
                onRecipeChange={onRecipeChange}
              />
              {isAuthenticated && selectedRecipe.id && (
                <CollectionButton recipeId={selectedRecipe.id} />
              )}
              {selectedRecipe.is_public === false && (
                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-neutral-700 px-4 text-base text-neutral-300">
                  Private
                </span>
              )}
            </div>
          </div>
          {selectedRecipe.tags?.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {selectedRecipe.tags.map((tag) => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
            </div>
          )}
          {selectedRecipe.description && <h4>{selectedRecipe.description}</h4>}
        </div>

        {/* ingredients */}
        {selectedRecipe.recipe_ingredients && (
          <div>
            <div className="mb-2 flex justify-between">
              <h2 className="text-3xl lg:text-4xl">Ingredients</h2>
              {selectedRecipe.servings && (
                <h4 className="flex items-end text-neutral-500">
                  {selectedRecipe.servings} servings
                </h4>
              )}
            </div>
            <div className="border-t border-neutral-500 py-10">
              <div className="flex w-full flex-col gap-4 md:w-max md:min-w-2/3">
                {selectedRecipe.recipe_ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex h-max justify-between gap-2"
                  >
                    <h4 className="w-max">{ingredient.name}</h4>
                    <div className="flex grow items-center border-b border-dotted border-neutral-500" />
                    <h4 className="flex w-1/3 items-center gap-2">
                      {ingredient.quantity}
                      <span className="text-neutral-500">
                        {ingredient.unit}
                      </span>
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div>
          <h2 className="mb-2 text-3xl lg:text-4xl">Instructions</h2>
          {selectedRecipe.recipe_instructions && (
            <div className="flex flex-col gap-4 border-t border-neutral-500 py-10">
              {selectedRecipe.recipe_instructions.map((instruction) => (
                <div key={instruction.id} className="flex">
                  <h4 className="flex w-1/6 text-neutral-500">
                    {instruction.order}
                  </h4>
                  <h4 className="w-5/6">{instruction.text}</h4>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {selectedRecipe.prep_time && (
            <h4 className="flex gap-2 text-neutral-500">
              Prep Time:
              <span className="text-neutral-100">
                {selectedRecipe.prep_time}
              </span>
              minutes
            </h4>
          )}
          {selectedRecipe.cook_time && (
            <h4 className="flex gap-2 text-neutral-500">
              Cook Time:
              <span className="text-neutral-100">
                {selectedRecipe.cook_time}
              </span>
              minutes
            </h4>
          )}
        </div>

        <div className="flex flex-col items-end">
          {createdDate && (
            <h6 className="flex gap-2 text-neutral-500">
              Created at:
              <span className="text-neutral-100">
                {createdDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </h6>
          )}
          {updatedDate && isUpdated && (
            <h6 className="flex gap-2 text-neutral-500">
              Last updated:
              <span className="text-neutral-100">
                {updatedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </h6>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recipe;
