"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchProfileByUserId } from "@/api/profiles";

/**
 * Author profile card for recipe detail (lg+ left column). Whole card links to profile.
 * @param {{ ownerId: number, recipe: { owner_display_name?: string, owner_username?: string, owner_avatar_url?: string | null } }} props
 */
export default function RecipeAuthorCard({ ownerId, recipe }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ownerId == null || !Number.isFinite(Number(ownerId))) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchProfileByUserId(ownerId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const fallbackName =
    recipe?.owner_display_name?.trim() || recipe?.owner_username || "Author";
  const displayName = profile?.display_name?.trim() || fallbackName;
  const username = profile?.username?.trim() || recipe?.owner_username;
  const showHandle =
    Boolean(username) &&
    displayName &&
    username.toLowerCase() !== displayName.toLowerCase();
  const avatarUrl = profile?.avatar_url ?? recipe?.owner_avatar_url ?? null;
  const bio = profile?.bio?.trim() ?? "";

  return (
    <Link
      href={`/users/${ownerId}`}
      data-recipe-author-card=""
      className="group flex flex-col gap-3 rounded-lg border border-neutral-700 bg-neutral-800/40 p-4 transition-colors hover:border-sky-500/60 hover:bg-neutral-800/70"
      aria-label={`${displayName}'s profile`}
    >
      {loading && (
        <div className="h-24 animate-pulse rounded-md bg-neutral-700/80" />
      )}
      {!loading && (
        <>
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600">
                <Image
                  src={avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  sizes="48px"
                />
              </span>
            ) : (
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-lg font-semibold text-amber-300 ring-2 ring-neutral-600"
                aria-hidden
              >
                {(displayName || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 text-base">
              <p className="font-semibold break-words text-neutral-100 group-hover:text-red-300">
                {displayName}
              </p>
              {showHandle && (
                <p className="mt-0.5 text-neutral-500">@{username}</p>
              )}
            </div>
          </div>
          {bio && (
            <p className="line-clamp-4 text-base leading-relaxed whitespace-pre-wrap text-neutral-400">
              {bio}
            </p>
          )}
        </>
      )}
    </Link>
  );
}
