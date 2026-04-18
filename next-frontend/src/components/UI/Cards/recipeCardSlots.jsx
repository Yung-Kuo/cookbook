"use client"

import Image from "next/image"

/**
 * Shared recipe grid card cover + info regions (used by RecipeCard and PinnedRecipeCard).
 *
 * @param {{
 *   recipe: { title: string, cover_image_url?: string | null, is_public?: boolean },
 *   showPrivateBadge?: boolean,
 * }} args
 */
export const getRecipeCardSlots = ({ recipe, showPrivateBadge = false }) => {
  const coverSlot = (
    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-700">
      {recipe.cover_image_url ? (
        <Image
          src={recipe.cover_image_url}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 45vw, 240px"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-neutral-500">
          No photo
        </div>
      )}
    </div>
  )

  const infoSlot = (
    <div className="flex flex-col gap-1 p-3 text-left">
      <h3 className="line-clamp-2 text-base font-semibold text-neutral-100">
        {recipe.title}
      </h3>
      {showPrivateBadge && recipe.is_public === false && (
        <span className="text-xs font-medium text-amber-400/90">Private</span>
      )}
    </div>
  )

  return { coverSlot, infoSlot }
}
