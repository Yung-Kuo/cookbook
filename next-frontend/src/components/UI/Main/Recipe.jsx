"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CloseButton } from "../Buttons/CloseButton";
import LikeButton from "../Buttons/LikeButton";
import CollectionButton from "../Buttons/CollectionButton";
import RoundedButton from "../Buttons/RoundedButton";
import Tag from "@/components/tags/Tag";
import RecipeImageSection from "./RecipeImageSection";
import UserProfileIdentity from "./UserProfileIdentity";
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

  const ownerLabel =
    selectedRecipe.owner_display_name?.trim() ||
    selectedRecipe.owner_username ||
    "Author";

  return (
    <div
      className={`${className} fixed inset-0 z-20 flex min-h-0 flex-col overflow-hidden bg-neutral-900 lg:absolute lg:inset-0 lg:z-20 lg:pb-4`}
    >
      {/* Mobile: strip with owner + edit/close — hidden on lg */}
      <div className="fixed top-0 left-0 z-30 flex w-full shrink-0 items-center justify-between bg-neutral-800/40 p-4 backdrop-blur-xs lg:hidden">
        <div className="min-w-0 flex-1 basis-0">
          {selectedRecipe.owner_id != null && (
            <UserProfileIdentity
              userId={selectedRecipe.owner_id}
              avatarUrl={selectedRecipe.owner_avatar_url}
              displayName={ownerLabel}
              size="recipeOwner"
            />
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {onEdit && isOwnRecipe && (
            <RoundedButton
              type="button"
              onClick={onEdit}
              className="cursor-pointer border border-neutral-600 bg-neutral-800/60 !text-lg !font-bold text-neutral-200 backdrop-blur-xs hover:border-neutral-400 hover:bg-neutral-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-95"
            >
              Edit
            </RoundedButton>
          )}
          {onClose && <CloseButton onClose={onClose} />}
        </div>
      </div>

      {/* Desktop: floating edit/close only — hidden below lg */}
      <div className="absolute top-4 right-4 z-30 hidden flex-wrap items-center justify-end gap-2 lg:top-18 lg:flex">
        {onEdit && isOwnRecipe && (
          <RoundedButton
            type="button"
            onClick={onEdit}
            className="cursor-pointer border border-neutral-600 bg-neutral-800/60 !text-lg !font-bold text-neutral-200 backdrop-blur-xs hover:border-neutral-400 hover:bg-neutral-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-95"
          >
            Edit
          </RoundedButton>
        )}
        {onClose && <CloseButton onClose={onClose} />}
      </div>

      {/* recipe content */}
      <div className="flex min-h-0 flex-col gap-12 overflow-y-auto px-4 pt-14 pb-24 text-xl lg:text-2xl">
        {/* recipe title and cover */}
        <div className="flex flex-col gap-12">
          {/* cover and other images */}
          {/* hide when there's no image */}
          {selectedRecipe.images?.length > 0 && (
            <RecipeImageSection recipe={selectedRecipe} />
          )}
          {/* title, tags, description */}
          <div
            className={`flex flex-col gap-4 ${selectedRecipe.images?.length === 0 ? "pt-6 lg:pt-4" : ""}`}
          >
            {/* title */}
            <Link
              href={`/users/${selectedRecipe.owner_id ?? "_"}/recipes/${selectedRecipe.id}`}
            >
              <h1 className="text-6xl break-words whitespace-pre-wrap transition-colors hover:text-red-300 lg:text-8xl">
                {selectedRecipe.title}
              </h1>
            </Link>
            {/* tags */}
            {recipeTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipeTags.map((tag, idx) => (
                  <Tag key={tag.id ?? `${tag.name}-${idx}`}>{tag.name}</Tag>
                ))}
              </div>
            )}
            {/* Desktop: owner in flow (mobile uses top strip) */}
            {selectedRecipe.owner_id != null && (
              <div className="hidden lg:block">
                <UserProfileIdentity
                  userId={selectedRecipe.owner_id}
                  avatarUrl={selectedRecipe.owner_avatar_url}
                  displayName={ownerLabel}
                  size="recipeOwner"
                  truncateDisplayName={false}
                />
              </div>
            )}
            {/* description */}
            {selectedRecipe.description && (
              <p className="py-8 whitespace-pre-wrap">
                {selectedRecipe.description}
              </p>
            )}
          </div>
        </div>
        {/* like and collection buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
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
        <div className="flex flex-col gap-4">
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
