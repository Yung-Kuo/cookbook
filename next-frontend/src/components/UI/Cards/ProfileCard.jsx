"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import Image from "next/image"
import { fetchProfileByUserId } from "@/api/profiles"
import { queryKeys } from "@/lib/queryKeys"

/**
 * Profile summary card (avatar, name, handle, bio). Links to the user profile.
 * Use `recipe` for display fallbacks when the profile request is loading or fails.
 *
 * @param {{
 *   ownerId: number,
 *   recipe?: { owner_display_name?: string, owner_username?: string, owner_avatar_url?: string | null },
 * }} props
 */
export default function ProfileCard({ ownerId, recipe }) {
  const profileQueryEnabled =
    ownerId != null && Number.isFinite(Number(ownerId))

  const {
    data: profile,
    isPending: loading,
  } = useQuery({
    queryKey: queryKeys.profiles.byUserId(ownerId),
    queryFn: () => fetchProfileByUserId(ownerId),
    enabled: profileQueryEnabled,
    staleTime: 2 * 60 * 1000,
  })

  if (!profileQueryEnabled) return null

  const fallbackName =
    recipe?.owner_display_name?.trim() || recipe?.owner_username || "Author"
  const displayName = profile?.display_name?.trim() || fallbackName
  const username = profile?.username?.trim() || recipe?.owner_username
  const showHandle =
    Boolean(username) &&
    displayName &&
    username.toLowerCase() !== displayName.toLowerCase()

  const avatarUrl = profile?.avatar_url ?? recipe?.owner_avatar_url ?? null

  return (
    <aside
      data-profile-card=""
      className="flex flex-col gap-3 rounded-xl border border-neutral-700 bg-neutral-900/90 p-4 text-neutral-100 shadow-lg"
    >
      <Link
        href={`/users/${ownerId}`}
        className="group flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
        aria-label={`${displayName} profile`}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-700">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-neutral-400">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-neutral-100 group-hover:text-red-200">
              {displayName}
            </p>
            {showHandle && (
              <p className="truncate text-sm text-neutral-400">@{username}</p>
            )}
          </div>
        </div>
        {profile?.bio?.trim() && (
          <p className="line-clamp-4 text-sm leading-relaxed text-neutral-400">
            {profile.bio}
          </p>
        )}
        {loading && !profile && (
          <p className="text-xs text-neutral-500" role="status">
            Loading profile…
          </p>
        )}
      </Link>
    </aside>
  )
}
