"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CloseButton } from "@/components/UI/Buttons/CloseButton";
import LikeButton from "@/components/UI/Buttons/LikeButton";
import CollectionButton from "@/components/UI/Buttons/CollectionButton";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";
import Tag from "@/components/tags/Tag";
import RecipeImageSection from "@/components/UI/Recipe/RecipeImageSection";
import AvatarName from "@/components/UI/Profile/AvatarName";
import RecipeNavBackButton from "@/components/UI/Recipe/RecipeNavBackButton";
import RecipeShareButton from "@/components/UI/Recipe/RecipeShareButton";
import { useAppNav } from "@/hooks/useAppNav";

function PrintIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1.25em"
      height="1.25em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
    </svg>
  );
}

function Recipe({
  selectedRecipe,
  onClose,
  onEdit,
  onRecipeChange,
  className,
  /** When true, render as in-flow page content (no overlay chrome). */
  isPage = false,
  shareTitle = "",
  shareText = "",
}) {
  const { user, isAuthenticated, loginHref } = useAppNav();

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

  const rootClass = isPage
    ? `${className ?? ""} relative flex min-h-0 w-full flex-col bg-neutral-900`.trim()
    : `${className ?? ""} fixed inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-neutral-900 lg:absolute lg:inset-0`.trim();

  return (
    <div className={rootClass} data-recipe-content="">
      {isPage && (
        <RecipeNavBackButton className="group fixed top-4 left-4 z-30 grid h-10 w-10 grid-cols-1 grid-rows-1 rounded-full transition-all lg:top-18 lg:hidden" />
      )}

      {isPage && onEdit && isOwnRecipe && (
        <div
          data-recipe-nav-edit=""
          className="fixed top-4 right-4 z-30 lg:hidden"
        >
          <RoundedButton
            type="button"
            onClick={onEdit}
            className="cursor-pointer border border-neutral-600 bg-neutral-800/60 !text-lg !font-bold text-neutral-200 backdrop-blur-xs hover:border-neutral-400 hover:bg-neutral-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-95"
          >
            Edit
          </RoundedButton>
        </div>
      )}

      {/* Mobile: strip with owner + edit/close — hidden on lg or when isPage (page has its own bar) */}
      <div
        className={`fixed top-0 left-0 z-30 flex w-full shrink-0 items-center justify-between bg-neutral-800/40 px-4 py-2 backdrop-blur-xs lg:hidden ${isPage ? "hidden" : ""}`}
      >
        <div className="w-min min-w-0">
          {selectedRecipe.owner_id != null && (
            <AvatarName
              userId={selectedRecipe.owner_id}
              avatarUrl={selectedRecipe.owner_avatar_url}
              displayName={ownerLabel}
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

      {/* Desktop: floating edit/close only — hidden below lg or when isPage */}
      <div
        className={`absolute top-4 right-4 z-30 hidden flex-wrap items-center justify-end gap-2 lg:top-18 lg:flex ${isPage ? "!hidden" : ""}`}
      >
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
      <div
        className={`flex min-h-0 flex-col gap-12 px-4 pt-14 text-xl lg:text-2xl ${
          isPage ? "overflow-visible pb-8" : "overflow-y-auto pb-24 lg:pb-4"
        }`}
      >
        {/* recipe title and cover */}
        <div className="flex flex-col gap-12">
          {/* cover and other images */}
          {/* hide when there's no image */}
          {selectedRecipe.images?.length > 0 && (
            <RecipeImageSection recipe={selectedRecipe} heroPriority={isPage} />
          )}
          {/* title, tags, description */}
          <div className="flex flex-col gap-4">
            {/* title */}
            {isPage ? (
              <h1 className="py-4 text-6xl break-words whitespace-pre-wrap lg:text-8xl">
                {selectedRecipe.title}
              </h1>
            ) : (
              <Link
                href={`/users/${selectedRecipe.owner_id ?? "_"}/recipes/${selectedRecipe.id}`}
              >
                <h1 className="text-6xl break-words whitespace-pre-wrap transition-colors hover:text-red-300 lg:text-8xl">
                  {selectedRecipe.title}
                </h1>
              </Link>
            )}
            {/* tags */}
            {recipeTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {recipeTags.map((tag, idx) => (
                  <Tag key={tag.id ?? `${tag.name}-${idx}`}>{tag.name}</Tag>
                ))}
              </div>
            )}
            {/* Desktop: owner in flow (mobile uses top strip); show on mobile when isPage */}
            {selectedRecipe.owner_id != null && (
              <div
                className={`${isPage ? "block lg:hidden" : "hidden lg:block"}`}
              >
                <AvatarName
                  userId={selectedRecipe.owner_id}
                  avatarUrl={selectedRecipe.owner_avatar_url}
                  displayName={ownerLabel}
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
        {/* action buttons (like, collection, share, print). Page view hides this row at lg+ (RecipeActionPanel). Overlay has no side rail — show at all breakpoints. */}
        <div
          className={`flex flex-wrap items-center justify-end gap-4 lg:justify-between ${isPage ? "lg:hidden" : ""}`}
          data-recipe-social-actions=""
        >
          {/* like and collection buttons */}
          <div className="flex items-center gap-2">
            <LikeButton
              recipe={selectedRecipe}
              isAuthenticated={isAuthenticated}
              isOwnRecipe={isOwnRecipe}
              onRecipeChange={onRecipeChange}
            />
            {selectedRecipe.id && (
              <CollectionButton
                recipeId={selectedRecipe.id}
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
              />
            )}
          </div>
          {/* share and print buttons */}
          <div className="flex items-center gap-2">
            <RecipeShareButton title={shareTitle} text={shareText} />
            {isPage && (
              <RoundedButton
                type="button"
                onClick={() => window.print()}
                className="border border-neutral-600 bg-neutral-800/80 text-neutral-100 hover:border-neutral-400 hover:bg-neutral-700/90"
                aria-label="Print or save as PDF"
                title="Print recipe"
              >
                <PrintIcon className="shrink-0" />
                <span className="">Print</span>
              </RoundedButton>
            )}
          </div>
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
