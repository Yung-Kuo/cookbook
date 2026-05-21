"use client"

import BaseCard from "@/components/UI/Cards/BaseCard"
import { getRecipeCardSlots } from "@/components/UI/Cards/recipeCardSlots"
import type { Recipe } from "@/types"

type RecipeCardProps = {
  recipe: Pick<
    Recipe,
    "id" | "title" | "cover_image_url" | "is_public"
  >
  href?: string
  onClick?: () => void
  showPrivateBadge?: boolean
  className?: string
}

export default function RecipeCard({
  recipe,
  href,
  onClick,
  showPrivateBadge = false,
  className = "",
}: RecipeCardProps) {
  const { coverSlot, infoSlot } = getRecipeCardSlots({
    recipe,
    showPrivateBadge,
  })

  return (
    <BaseCard
      withShell={false}
      as={href ? "link" : "button"}
      href={href}
      onClick={onClick}
      variant="recipe"
      coverSlot={coverSlot}
      infoSlot={infoSlot}
      className={className}
    />
  )
}
