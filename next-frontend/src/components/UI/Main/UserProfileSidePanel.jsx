"use client";

import { useEffect, useState } from "react";
import { fetchProfileByUserId } from "@/api/profiles";
import UserProfileIdentity from "./UserProfileIdentity";

/**
 * @param {{ userId: number, className?: string }} props
 */
export default function UserProfileSidePanel({ userId, className = "" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProfileByUserId(userId)
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
  }, [userId]);

  const displayLabel =
    profile?.display_name?.trim() || profile?.username || "User";

  return (
    <div
      className={`flex flex-col gap-4 px-4 pt-20 pb-8 text-neutral-100 lg:pt-4 ${className}`}
    >
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
          <UserProfileIdentity
            userId={userId}
            avatarUrl={profile.avatar_url}
            displayName={displayLabel}
            handle={
              profile.username && profile.display_name?.trim()
                ? profile.username
                : null
            }
            size="profile"
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
