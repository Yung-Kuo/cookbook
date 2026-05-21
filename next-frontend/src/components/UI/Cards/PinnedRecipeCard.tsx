"use client"

import BaseCard from "@/components/UI/Cards/BaseCard"
import CardMoreMenu from "@/components/UI/Cards/CardMoreMenu"
import { getRecipeCardSlots } from "@/components/UI/Cards/recipeCardSlots"
import type { PinnedRecipeSummary, Recipe } from "@/types"

type PinnedRecipeCardProps = {
  recipe: Pick<
    Recipe | PinnedRecipeSummary,
    "id" | "title" | "cover_image_url" | "is_public"
  >
  href?: string
  onClick?: () => void
  showPrivateBadge?: boolean
  isOwner?: boolean
  onUnpin?: (recipe: PinnedRecipeCardProps["recipe"]) => void | Promise<void>
  className?: string
}

/**
 * Recipe grid card with an optional owner menu (unpin), matching CollectionCard structure.
 */
export default function PinnedRecipeCard({
  recipe,
  href,
  onClick,
  showPrivateBadge = false,
  isOwner = false,
  onUnpin,
  className = "",
}: PinnedRecipeCardProps) {
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
