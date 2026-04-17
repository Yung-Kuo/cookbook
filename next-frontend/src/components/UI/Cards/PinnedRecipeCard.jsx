"use client"

import BaseCard from "@/components/UI/Cards/BaseCard"
import CardMoreMenu from "@/components/UI/Cards/CardMoreMenu"
import { getRecipeCardSlots } from "@/components/UI/Cards/recipeCardSlots"

/**
 * Recipe grid card with an optional owner menu (unpin), matching CollectionCard structure.
 *
 * @param {{
 *   recipe: { id: number, title: string, cover_image_url?: string | null, is_public?: boolean },
 *   href?: string,
 *   onClick?: () => void,
 *   showPrivateBadge?: boolean,
 *   isOwner?: boolean,
 *   onUnpin?: (recipe: object) => void | Promise<void>,
 *   className?: string,
 * }} props
 */
export default function PinnedRecipeCard({
  recipe,
  href,
  onClick,
  showPrivateBadge = false,
  isOwner = false,
  onUnpin,
  className = "",
}) {
  const showMenu = Boolean(isOwner && onUnpin)
  const { coverSlot, infoSlot } = getRecipeCardSlots({
    recipe,
    showPrivateBadge,
  })

  const overlaySlot = showMenu ? (
    <CardMoreMenu
      ariaLabel="Pinned recipe options"
      items={[
        {
          label: "Unpin",
          onClick: async () => {
            await onUnpin?.(recipe)
          },
        },
      ]}
    />
  ) : null

  return (
    <BaseCard
      withShell
      as={href ? "link" : "button"}
      href={href}
      onClick={onClick}
      variant="recipe"
      coverSlot={coverSlot}
      infoSlot={infoSlot}
      overlaySlot={overlaySlot}
      className={className}
    />
  )
}
