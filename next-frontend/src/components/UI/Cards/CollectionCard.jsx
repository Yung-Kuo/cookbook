"use client"

import Image from "next/image"
import BaseCard from "@/components/UI/Cards/BaseCard"
import CardMoreMenu from "@/components/UI/Cards/CardMoreMenu"

/**
 * @param {{
 *   collection: {
 *     id: number,
 *     name: string,
 *     recipe_count?: number,
 *     cover_image_url?: string | null,
 *     recipe_cover_urls?: (string | null)[],
 *     is_public?: boolean,
 *   },
 *   href: string,
 *   showPrivateBadge?: boolean,
 *   onCoverClick?: () => void,
 *   onVisibilitySet?: (wantPublic: boolean) => void,
 *   isOwner?: boolean,
 *   className?: string,
 * }} props
 */
export default function CollectionCard({
  collection,
  href,
  showPrivateBadge = false,
  onCoverClick,
  onVisibilitySet,
  isOwner = false,
  className = "",
}) {
  const urls = collection.recipe_cover_urls?.length
    ? collection.recipe_cover_urls
    : [null, null, null, null]

  const coverVisual = collection.cover_image_url ? (
    <Image
      src={collection.cover_image_url}
      alt=""
      fill
      className="object-cover"
      sizes="(max-width: 640px) 50vw, 33vw"
    />
  ) : (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-px bg-neutral-800 p-px">
      {urls.slice(0, 4).map((u, i) => (
        <div
          key={i}
          className="relative min-h-0 min-w-0 overflow-hidden bg-neutral-700"
        >
          {u ? (
            <Image src={u} alt="" fill className="object-cover" sizes="25vw" />
          ) : (
            <div className="h-full w-full bg-neutral-800/80" />
          )}
        </div>
      ))}
    </div>
  )

  const showOwnerMenu = Boolean(isOwner && onVisibilitySet)

  const coverSlot = (
    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-700">
      {coverVisual}
    </div>
  )

  const infoSlot = (
    <div className="flex flex-col gap-1 p-3">
      <h3 className="line-clamp-2 text-base font-semibold text-neutral-100">
        {collection.name}
      </h3>
      <p className="text-xs text-neutral-500">
        {collection.recipe_count ?? 0}{" "}
        {(collection.recipe_count ?? 0) === 1 ? "recipe" : "recipes"}
      </p>
      {showPrivateBadge && collection.is_public === false && (
        <span className="text-xs font-medium text-amber-400/90">Private</span>
      )}
    </div>
  )

  const overlaySlot = (
    <>
      {isOwner && onCoverClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onCoverClick()
          }}
          className="absolute top-2 left-2 z-10 rounded bg-neutral-900/80 px-2 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
        >
          Cover
        </button>
      )}
      {showOwnerMenu && (
        <CardMoreMenu
          ariaLabel="Collection options"
          menuClassName="min-w-0"
          menuContent={({ close }) => (
            <>
              <p className="px-3 py-1.5 font-medium text-neutral-500">
                Visibility
              </p>
              <button
                type="button"
                role="menuitem"
                aria-current={collection.is_public ? "true" : undefined}
                className={`flex w-full cursor-pointer items-center justify-between gap-8 px-3 py-2 text-left hover:bg-neutral-800 ${
                  collection.is_public
                    ? "font-medium text-red-300"
                    : "text-neutral-300"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!collection.is_public) onVisibilitySet?.(true)
                  close()
                }}
              >
                <span>Public</span>
                {collection.is_public ? (
                  <span className="text-xs text-neutral-500">Current</span>
                ) : null}
              </button>
              <button
                type="button"
                role="menuitem"
                aria-current={!collection.is_public ? "true" : undefined}
                className={`flex w-full cursor-pointer items-center justify-between gap-8 px-3 py-2 hover:bg-neutral-800 ${
                  !collection.is_public
                    ? "font-medium text-red-300"
                    : "text-neutral-300"
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (collection.is_public) onVisibilitySet?.(false)
                  close()
                }}
              >
                <span>Private</span>
                {!collection.is_public ? (
                  <span className="text-xs text-neutral-500">Current</span>
                ) : null}
              </button>
            </>
          )}
        />
      )}
    </>
  )

  return (
    <BaseCard
      withShell
      as="link"
      href={href}
      variant="collection"
      coverSlot={coverSlot}
      infoSlot={infoSlot}
      overlaySlot={overlaySlot}
      className={className}
    />
  )
}
