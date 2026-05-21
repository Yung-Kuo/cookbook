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
import RecipePrintButton from "@/components/UI/Recipe/RecipePrintButton";
import { useAppNav } from "@/hooks/useAppNav";
import type { Recipe as RecipeEntity } from "@/types";

const RECIPE_EDIT_BUTTON_CLASSES =
  "cursor-pointer border border-neutral-600 bg-neutral-800/60 !text-lg !font-bold text-neutral-200 backdrop-blur-xs hover:border-neutral-400 hover:bg-neutral-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 active:scale-95";

type RecipeEditButtonProps = {
  onEdit: () => void;
};

const RecipeEditButton = ({ onEdit }: RecipeEditButtonProps) => (
  <RoundedButton
    type="button"
    onClick={onEdit}
    className={RECIPE_EDIT_BUTTON_CLASSES}
  >
    Edit
  </RoundedButton>
);

type RecipeOverlayDesktopChromeProps = {
  onEdit?: (() => void) | null;
  onClose?: (() => void) | null;
  showEdit: boolean;
};

/** Floating edit + close on lg+ split-pane overlay only */
const RecipeOverlayDesktopChrome = ({
  onEdit,
  onClose,
  showEdit,
}: RecipeOverlayDesktopChromeProps) => (
  <div className="absolute top-4 right-4 z-30 hidden flex-wrap items-center justify-end gap-2 lg:top-18 lg:flex">
    {showEdit && onEdit != null ? <RecipeEditButton onEdit={onEdit} /> : null}
    {onClose != null ? <CloseButton onClose={onClose} /> : null}
  </div>
);

type RecipeProps = {
  selectedRecipe: RecipeEntity | null;
  onClose?: (() => void) | null;
  onEdit?: (() => void) | null;
  onRecipeChange?: (patch: Partial<RecipeEntity> & { id: number }) => void;
  className?: string;
  /**
   * Detail route: in-flow column with back + mobile edit; at lg+ side rails live on the page shell.
   * When false: desktop split-pane overlay (full-screen fixed below lg is redirected away by list hook).
   */
  isPage?: boolean;
  shareTitle?: string;
  shareText?: string;
};

function Recipe({
  selectedRecipe,
  onClose,
  onEdit,
  onRecipeChange,
  className = "",
  isPage = false,
  shareTitle = "",
  shareText = "",
}: RecipeProps) {
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
      updatedDate != null && updatedDate.getTime() !== createdDate.getTime();

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
    ? `${className} relative flex min-h-0 w-full flex-col bg-neutral-900`.trim()
    : `${className} fixed inset-0 z-30 flex min-h-0 flex-col overflow-hidden bg-neutral-900 lg:absolute lg:inset-0`.trim();

  const bodyScrollClasses = isPage
    ? "overflow-visible pb-8"
    : "overflow-y-auto pb-8 lg:pb-4";

  const showOverlayChrome = !isPage;

  return (
    <div className={rootClass} data-recipe-content="">
      {/* Detail page: back + mobile-only edit */}
      {isPage ? (
        <>
          <RecipeNavBackButton className="group fixed top-4 left-4 z-30 grid h-10 w-10 grid-cols-1 grid-rows-1 rounded-full transition-all lg:top-18 lg:hidden" />
          {onEdit != null && isOwnRecipe ? (
            <div
              data-recipe-nav-edit=""
              className="fixed top-4 right-4 z-30 lg:hidden"
            >
              <RecipeEditButton onEdit={onEdit} />
            </div>
          ) : null}
        </>
      ) : null}

      {showOverlayChrome ? (
        <RecipeOverlayDesktopChrome
          onEdit={onEdit}
          onClose={onClose}
          showEdit={isOwnRecipe && onEdit != null}
        />
      ) : null}

      <div
        className={`flex min-h-0 flex-col gap-16 px-4 text-xl lg:pt-14 lg:text-2xl ${bodyScrollClasses}`}
      >
        {selectedRecipe.images?.length > 0 ? (
          <RecipeImageSection recipe={selectedRecipe} heroPriority={isPage} />
        ) : null}

        <section
          className={`flex flex-col gap-8 ${selectedRecipe.images?.length > 0 ? "" : "mt-12"}`}
        >
          {isPage ? (
            <h1 className="py-4 text-6xl break-words whitespace-pre-wrap lg:text-8xl">
              {selectedRecipe.title}
            </h1>
          ) : (
            <Link
              href={`/users/${selectedRecipe.owner_id ?? 0}/recipes/${selectedRecipe.id}`}
            >
              <h1 className="text-6xl break-words whitespace-pre-wrap transition-colors hover:text-red-300 lg:text-8xl">
                {selectedRecipe.title}
              </h1>
            </Link>
          )}
          {recipeTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {recipeTags.map((tag, idx) => (
                <Tag key={tag.id ?? `${tag.name}-${idx}`}>{tag.name}</Tag>
              ))}
            </div>
          ) : null}
          {/* Detail route: ProfileCard shows author at lg+; overlay always shows inline author */}
          {selectedRecipe.owner_id != null ? (
            isPage ? (
              <div className="lg:hidden">
                <AvatarName
                  userId={selectedRecipe.owner_id}
                  avatarUrl={selectedRecipe.owner_avatar_url}
                  displayName={ownerLabel}
                  truncateDisplayName={false}
                />
              </div>
            ) : (
              <AvatarName
                userId={selectedRecipe.owner_id}
                avatarUrl={selectedRecipe.owner_avatar_url}
                displayName={ownerLabel}
                truncateDisplayName={false}
              />
            )
          ) : null}
          {selectedRecipe.description ? (
            <p className="py-8 whitespace-pre-wrap">
              {selectedRecipe.description}
            </p>
          ) : null}
        </section>

        {/* Like / collection / share / print — detail route hides at lg+ (RecipeActionPanel). Overlay keeps row at all breakpoints. */}
        <div
          className={`flex flex-wrap items-center justify-end gap-8 lg:justify-between ${isPage ? "lg:hidden" : ""}`}
          data-recipe-social-actions=""
        >
          <div className="flex items-center gap-2">
            <LikeButton
              recipe={selectedRecipe}
              isAuthenticated={isAuthenticated}
              isOwnRecipe={isOwnRecipe}
              onRecipeChange={onRecipeChange}
            />
            {selectedRecipe.id ? (
              <CollectionButton
                recipeId={selectedRecipe.id}
                isAuthenticated={isAuthenticated}
                loginHref={loginHref}
              />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <RecipeShareButton title={shareTitle} text={shareText} />
            {isPage ? <RecipePrintButton /> : null}
          </div>
          {selectedRecipe.is_public === false ? (
            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-neutral-700 px-4 text-base text-neutral-300">
              Private
            </span>
          ) : null}
        </div>

        {selectedRecipe.recipe_ingredients ? (
          <div>
            <div className="mb-2 flex justify-between">
              <h2 className="text-3xl lg:text-4xl">Ingredients</h2>
              {selectedRecipe.servings ? (
                <h4 className="flex items-end text-neutral-500">
                  {selectedRecipe.servings} servings
                </h4>
              ) : null}
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
        ) : null}

        <div>
          <h2 className="mb-2 text-3xl lg:text-4xl">Instructions</h2>
          {selectedRecipe.recipe_instructions ? (
            <div className="flex flex-col border-t border-neutral-500 py-10">
              {selectedRecipe.recipe_instructions.map((instruction) => (
                <div
                  key={instruction.id}
                  className="flex p-4 even:bg-neutral-800"
                >
                  <h4 className="flex w-1/6 text-neutral-500">
                    {instruction.order}
                  </h4>
                  <h4 className="w-5/6 transition-colors hover:text-amber-300">
                    {instruction.text}
                  </h4>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          {selectedRecipe.prep_time ? (
            <h4 className="flex gap-2 text-neutral-500">
              Prep Time:
              <span className="text-neutral-100">
                {selectedRecipe.prep_time}
              </span>
              minutes
            </h4>
          ) : null}
          {selectedRecipe.cook_time ? (
            <h4 className="flex gap-2 text-neutral-500">
              Cook Time:
              <span className="text-neutral-100">
                {selectedRecipe.cook_time}
              </span>
              minutes
            </h4>
          ) : null}
        </div>

        <div className="flex flex-col items-end pt-20 text-base lg:text-lg">
          {createdDate ? (
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
          ) : null}
          {updatedDate != null && isUpdated ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Recipe;
