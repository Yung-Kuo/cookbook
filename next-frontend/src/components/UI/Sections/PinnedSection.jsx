"use client"

import { useCallback, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import PinnedRecipeCard from "@/components/UI/Cards/PinnedRecipeCard"
import PinPickerModal from "@/components/UI/Popups/PinPickerModal"
import AddButton from "@/components/UI/Buttons/AddButton"
import CardGridSection from "@/components/UI/Sections/CardGridSection"
import { OWNERLESS_RECIPE_USER_SEGMENT } from "@/lib/recipeRoutes"
import { fetchPinnedRecipes, unpinRecipe } from "@/api/pinned"
import { queryKeys } from "@/lib/queryKeys"

/**
 * @param {{
 *   profileUserId: number,
 *   isOwner: boolean,
 *   isActive: boolean,
 *   onRecipeOpen?: (recipe: object) => void,
 *   className?: string,
 * }} props
 */
export default function PinnedSection({
  profileUserId,
  isOwner,
  isActive,
  onRecipeOpen,
  className = "",
}) {
  const queryClient = useQueryClient()
  const [pinPickerOpen, setPinPickerOpen] = useState(false)
  const viewerKey = isOwner ? "owner" : "public"

  const { data: pinnedRows = [], isPending: pinnedLoading } = useQuery({
    queryKey: queryKeys.pinned.byUserId(profileUserId, viewerKey),
    queryFn: () => fetchPinnedRecipes(profileUserId),
    enabled: isActive,
    staleTime: 30 * 1000,
  })

  const refreshPinned = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.pinned.byUserId(profileUserId, viewerKey),
    })
  }, [queryClient, profileUserId, viewerKey])

  const unpinMutation = useMutation({
    mutationFn: (recipeId) => unpinRecipe(recipeId),
    onSuccess: () => refreshPinned(),
  })

  const handleUnpinRecipe = useCallback(
    async (recipe) => {
      if (!recipe?.id) return
      try {
        await unpinMutation.mutateAsync(recipe.id)
      } catch (e) {
        console.error(e)
      }
    },
    [unpinMutation],
  )

  const pinnedIds = new Set(
    pinnedRows.map((row) => row.recipe?.id).filter(Boolean),
  )

  return (
    <div className={`relative ${className}`}>
      <PinPickerModal
        open={pinPickerOpen}
        onClose={() => setPinPickerOpen(false)}
        pinnedIds={pinnedIds}
        onPinsChanged={refreshPinned}
      />
      {isOwner && (
        <div className="pointer-events-none absolute top-4 right-4 z-10">
          <div className="pointer-events-auto">
            <AddButton
              onClick={() => setPinPickerOpen(true)}
              parentClassName="h-10 w-10 lg:h-12 lg:w-12"
              className="h-10 w-10 bg-sky-500/80 text-white hover:bg-sky-400/80 lg:h-12 lg:w-12"
              title="Add pins"
            />
          </div>
        </div>
      )}
      <CardGridSection
        preset="4"
        loading={pinnedLoading}
        itemCount={pinnedRows.length}
        emptyMessage={
          isOwner ? "No pinned recipes yet." : "No public pins yet."
        }
      >
        {pinnedRows.map((row) => {
          const r = row.recipe
          if (!r) return null
          const ownerForHref =
            r.owner_id != null
              ? r.owner_id
              : r.owner_id === null
                ? OWNERLESS_RECIPE_USER_SEGMENT
                : profileUserId
          return (
            <li key={r.id}>
              <PinnedRecipeCard
                recipe={r}
                showPrivateBadge={isOwner}
                isOwner={isOwner}
                onUnpin={isOwner ? handleUnpinRecipe : undefined}
                {...(onRecipeOpen
                  ? { onClick: () => onRecipeOpen(r) }
                  : { href: `/users/${ownerForHref}/recipes/${r.id}` })}
              />
            </li>
          )
        })}
      </CardGridSection>
    </div>
  )
}
