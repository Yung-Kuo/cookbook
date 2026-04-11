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

  const recipeTags = useMemo(() => {
    const raw = selectedRecipe?.tags;
    if (raw == null) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [selectedRecipe?.tags]);

  if (!selectedRecipe) return null;

  return (
    <div
      className={`${className} absolute overflow-scroll top-0 right-0 z-10 bg-neutral-900 pb-20 lg:pb-4 lg:pt-14`}
    >
      {/* close and edit buttons */}
      <div className="fixed top-4 lg:top-14 pt-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2">
        {onEdit && isOwnRecipe && (
          <RoundedButton
            type="button"
            onClick={onEdit}
            className="cursor-pointer border border-neutral-600 bg-neutral-800/60 backdrop-blur-xs text-neutral-200 hover:border-neutral-400 hover:bg-neutral-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-95 !text-lg !font-bold"
          >
            Edit
          </RoundedButton>
        )}
        {onClose && <CloseButton onClose={onClose} />}
      </div>

      {/* recipe content */}
      <div className="flex flex-col gap-24 text-xl lg:text-2xl px-4">
        {/* recipe title and cover */}
        <div className="flex flex-col gap-12">
          {/* cover and other images */}
          <div className="flex flex-col gap-4 lg:pt-4 -mx-4 lg:mx-0">
            {selectedRecipe.cover_image_url && (
              <div className="overflow-hidden ">
                <img
                  src={selectedRecipe.cover_image_url}
                  alt={selectedRecipe.title}
                  className="h-64 w-full object-cover lg:h-96"
                />
              </div>
            )}
            {(selectedRecipe.images || []).length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
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
          </div>
          {/* title and buttons */}
          <div className="flex flex-col gap-4">
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
          {/* tags */}
          {recipeTags.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {recipeTags.map((tag, idx) => (
                <Tag key={tag.id ?? `${tag.name}-${idx}`}>{tag.name}</Tag>
              ))}
            </div>
          )}
          {/* description */}
          <div className="flex flex-col gap-4">
            {selectedRecipe.description && (
              <p className="whitespace-pre-wrap">
                {selectedRecipe.description}
              </p>
            )}
          </div>
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

        {/* instructions */}
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

        {/* prep time and cook time */}
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

        {/* created date and updated date */}
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
