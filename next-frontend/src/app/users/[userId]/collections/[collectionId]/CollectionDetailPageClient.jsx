"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { fetchCollectionById } from "@/api/collections"
import RoundedButton from "@/components/UI/Buttons/RoundedButton"
import RecipeCard from "@/components/UI/Cards/RecipeCard"
import CardGridSection from "@/components/UI/Sections/CardGridSection"
import BackArrowIcon from "@/components/Icons/BackArrowIcon"
import { useAuth } from "@/context/AuthContext"
import { queryKeys } from "@/lib/queryKeys"

export default function CollectionDetailPageClient() {
  const { userId, collectionId } = useParams()
  const uid = Array.isArray(userId) ? userId[0] : userId
  const cid = Array.isArray(collectionId) ? collectionId[0] : collectionId
  const { loading: authLoading } = useAuth()

  const {
    data: collection,
    isError,
    isPending,
    error,
  } = useQuery({
    queryKey: queryKeys.collections.detail(cid),
    queryFn: () => fetchCollectionById(cid),
    enabled: !authLoading && Boolean(cid),
  })

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    )
  }

  if (isError || !collection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <p>
          {error instanceof Error ? error.message : "Collection not found"}
        </p>
        <RoundedButton
          href={`/users/${uid}?tab=collections`}
          className="cursor-pointer bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
        >
          Back to profile
        </RoundedButton>
      </div>
    )
  }

  const entries = collection.entries || []

  return (
    <div className="h-full overflow-y-auto bg-neutral-800 p-2 pb-24 text-neutral-100 lg:px-6 lg:pt-14">
      <div className="mb-8">
        <Link
          href={`/users/${uid}?tab=collections`}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-neutral-100 transition-all hover:bg-neutral-600 active:scale-90"
          aria-label="Back to collections"
          title="Back to collections"
        >
          <BackArrowIcon className="h-5 w-5" />
        </Link>
      </div>

      <div className="flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-red-300">{collection.name}</h1>
        {collection.description && (
          <p className="mt-2 text-neutral-400">{collection.description}</p>
        )}
        <CardGridSection
          preset="5"
          loading={false}
          itemCount={entries.length}
          emptyMessage="No recipes in this collection yet."
        >
          {entries.map((entry) => {
            const key = `${entry.recipe_id}-${entry.added_at}`
            if (entry.is_available && entry.recipe) {
              const r = entry.recipe
              const ownerId = r.owner_id ?? uid
              return (
                <li key={key}>
                  <RecipeCard
                    recipe={r}
                    href={`/users/${ownerId}/recipes/${r.id}`}
                  />
                </li>
              )
            }
            return (
              <li key={key}>
                <div className="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 text-left">
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-700">
                    <div className="flex h-full items-center justify-center p-4 text-center text-sm text-neutral-500">
                      Unavailable
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 text-left">
                    <p className="text-base font-semibold text-neutral-400">
                      This recipe is no longer available.
                    </p>
                    <p className="text-xs text-neutral-500">
                      Recipe #{entry.recipe_id} · added{" "}
                      {new Date(entry.added_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </CardGridSection>
      </div>
    </div>
  )
}
