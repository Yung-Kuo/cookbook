"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import NavMoreIcon from "@/components/Icons/NavMoreIcon";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const urls = collection.recipe_cover_urls?.length
    ? collection.recipe_cover_urls
    : [null, null, null, null];

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
  );

  const showOwnerMenu = Boolean(isOwner && onVisibilitySet);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 transition-colors hover:border-sky-600 hover:ring-1 hover:ring-sky-600 ${className}`}
    >
      <Link
        href={href}
        className="flex h-full w-full min-w-0 flex-col text-left"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-700">
          {coverVisual}
        </div>
        <div className="flex flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-100">
            {collection.name}
          </h3>
          <p className="text-xs text-neutral-500">
            {collection.recipe_count ?? 0}{" "}
            {(collection.recipe_count ?? 0) === 1 ? "recipe" : "recipes"}
          </p>
          {showPrivateBadge && collection.is_public === false && (
            <span className="text-xs font-medium text-amber-400/90">
              Private
            </span>
          )}
        </div>
      </Link>
      {isOwner && onCoverClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCoverClick();
          }}
          className="absolute top-2 left-2 z-10 rounded bg-neutral-900/80 px-2 py-1 text-xs font-medium text-neutral-200 hover:bg-neutral-800"
        >
          Cover
        </button>
      )}
      {showOwnerMenu && (
        <div
          className="absolute top-2 right-2 z-20 text-base"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Collection options"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded-full border border-neutral-600 bg-neutral-900/90 p-1.5 text-neutral-200 shadow-sm hover:bg-neutral-800"
          >
            <NavMoreIcon className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-max rounded-lg border border-neutral-600 bg-neutral-900 py-1 text-base shadow-lg"
            >
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
                  e.preventDefault();
                  e.stopPropagation();
                  if (!collection.is_public) onVisibilitySet(true);
                  setMenuOpen(false);
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
                  e.preventDefault();
                  e.stopPropagation();
                  if (collection.is_public) onVisibilitySet(false);
                  setMenuOpen(false);
                }}
              >
                <span>Private</span>
                {!collection.is_public ? (
                  <span className="text-xs text-neutral-500">Current</span>
                ) : null}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
