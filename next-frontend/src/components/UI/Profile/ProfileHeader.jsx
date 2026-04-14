"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchProfileByUserId } from "@/api/profiles";

/**
 * Profile page header: loads profile data and shows avatar, name, @handle, bio.
 *
 * @param {{ profileUserId: number }} props
 */
export default function ProfileHeader({ profileUserId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProfileByUserId(profileUserId)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  const displayLabel =
    profile?.display_name?.trim() || profile?.username || "User";
  const showHandle =
    Boolean(profile?.username?.trim()) &&
    Boolean(profile?.display_name?.trim());

  return (
    <div className="flex flex-col gap-4 px-4 py-8 text-neutral-100 lg:px-6 lg:pt-4">
      {loading && (
        <p className="text-lg text-neutral-400" role="status">
          Loading profile…
        </p>
      )}
      {error && !loading && (
        <p className="text-lg text-red-300" role="alert">
          {error}
        </p>
      )}
      {profile && !loading && !error && (
        <>
          <div className="flex flex-col items-center gap-8 sm:flex-row">
            {profile.avatar_url ? (
              <span className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600">
                <Image
                  src={profile.avatar_url}
                  alt=""
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                  sizes="112px"
                  priority
                />
              </span>
            ) : (
              <div
                className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-4xl font-semibold text-amber-300 ring-2 ring-neutral-600"
                aria-hidden
              >
                {displayLabel.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-3xl font-semibold break-words text-neutral-100">
                {displayLabel}
              </h2>
              {showHandle && (
                <p className="mt-1 text-lg text-neutral-500">
                  @{profile.username}
                </p>
              )}
            </div>
          </div>
          {profile.bio?.trim() && (
            <p className="text-lg leading-relaxed whitespace-pre-wrap text-neutral-300">
              {profile.bio}
            </p>
          )}
        </>
      )}
    </div>
  );
}
