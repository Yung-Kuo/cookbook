"use client";

import { useEffect, useState } from "react";
import { fetchProfileByUserId } from "@/api/profiles";
import AvatarName from "@/components/UI/Profile/AvatarName";

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
  const handleLine =
    profile?.username && profile?.display_name?.trim()
      ? profile.username
      : null;

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
          <AvatarName
            size="lg"
            userId={profileUserId}
            avatarUrl={profile.avatar_url}
            displayName={displayLabel}
            handle={handleLine}
            priority
          />
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
