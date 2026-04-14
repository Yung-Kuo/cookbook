"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
    <div className="flex flex-col -mx-4">
      {heroImageUrl && (
        <div className="relative h-64 w-full overflow-hidden lg:h-96">
          <Image
            key={`${recipe.id}-${heroImageUrl}`}
            src={heroImageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority
          />
        </div>
      )}
      {sortedRecipeImages.length > 1 && (
        <div className="flex gap-2 lg:gap-4 lg:p-4 overflow-x-auto p-2">
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
                className={`relative h-24 w-36 cursor-pointer flex-shrink-0 overflow-hidden rounded-md border-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 ${
                  isActive ? "border-amber-500" : "border-transparent"
                }`}
              >
                {img.image_url && (
                  <Image
                    key={`${recipe.id}-${img.id}`}
                    src={img.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="144px"
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
