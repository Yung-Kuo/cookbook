"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Hero + thumbnail strip. Preview selection is local (does not change the recipe cover).
 */
export default function RecipeImageSection({ recipe }) {
  const [previewImageId, setPreviewImageId] = useState(null);

  useEffect(() => {
    setPreviewImageId(null);
  }, [recipe?.id]);

  const sortedRecipeImages = useMemo(() => {
    if (!recipe?.images?.length) return [];
    return [...recipe.images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [recipe?.images]);

  const heroImageUrl = useMemo(() => {
    if (!recipe) return null;
    if (previewImageId != null) {
      const picked = sortedRecipeImages.find((i) => i.id === previewImageId);
      return picked?.image_url ?? recipe.cover_image_url ?? null;
    }
    return recipe.cover_image_url ?? null;
  }, [recipe, previewImageId, sortedRecipeImages]);

  /** Which gallery thumb matches what is shown in the hero (cover or preview). */
  const activeGalleryImageId = useMemo(() => {
    if (previewImageId != null) return previewImageId;
    return sortedRecipeImages.find((i) => i.is_cover)?.id ?? null;
  }, [previewImageId, sortedRecipeImages]);

  if (!recipe) return null;

  return (
    <div className="flex flex-col gap-4 -mx-4 lg:p-4">
      {heroImageUrl && (
        <div className="overflow-hidden">
          <img
            key={`${recipe.id}-${heroImageUrl}`}
            src={heroImageUrl}
            alt={recipe.title}
            className="h-64 w-full object-cover lg:h-96"
            decoding="async"
          />
        </div>
      )}
      {sortedRecipeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedRecipeImages.map((img) => {
            const isActive = activeGalleryImageId === img.id;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setPreviewImageId(img.is_cover ? null : img.id)}
                aria-pressed={isActive}
                aria-label={
                  img.is_cover
                    ? "Show cover photo in preview"
                    : "Preview this photo"
                }
                className={`h-24 w-36 cursor-pointer flex-shrink-0 overflow-hidden rounded-md border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 ${
                  isActive ? "border-amber-500" : "border-transparent"
                }`}
              >
                {img.image_url && (
                  <img
                    key={`${recipe.id}-${img.id}`}
                    src={img.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                    decoding="async"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
