"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCollectionById } from "@/api/collections";
import { useAuth } from "@/context/AuthContext";

export default function CollectionDetailPage() {
  const { userId, collectionId } = useParams();
  const uid = Array.isArray(userId) ? userId[0] : userId;
  const cid = Array.isArray(collectionId) ? collectionId[0] : collectionId;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !cid) {
      setLoading(false);
      return;
    }
    if (user?.pk !== Number(uid)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchCollectionById(cid)
      .then((data) => {
        if (!cancelled) {
          setCollection(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, uid, cid]);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <Link href="/login" className="rounded-full bg-red-300 px-5 py-2 text-neutral-900">
          Login
        </Link>
      </div>
    );
  }

  if (user?.pk !== Number(uid)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <Link
          href={`/users/${user.pk}/collections`}
          className="rounded-full bg-sky-600 px-5 py-2 text-neutral-100"
        >
          My collections
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <p>{error || "Collection not found"}</p>
        <Link
          href={`/users/${uid}/collections`}
          className="rounded-full bg-neutral-700 px-5 py-2"
        >
          Back to collections
        </Link>
      </div>
    );
  }

  const entries = collection.entries || [];

  return (
    <div className="h-full overflow-y-auto bg-neutral-800 p-6 text-neutral-100">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/users/${uid}/collections`}
            className="mb-2 inline-block text-sm text-sky-400 hover:text-sky-300"
          >
            ← Collections
          </Link>
          <h1 className="text-4xl font-bold text-red-300">{collection.name}</h1>
          {collection.description && (
            <p className="mt-2 text-neutral-400">{collection.description}</p>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-3">
        {entries.map((entry) => (
          <li
            key={`${entry.recipe_id}-${entry.added_at}`}
            className="rounded-lg border border-neutral-600 bg-neutral-900 p-4"
          >
            {entry.is_available && entry.recipe ? (
              <Link
                href={`/users/${entry.recipe.owner_id ?? uid}/recipes/${entry.recipe.id}`}
                className="flex flex-wrap items-center gap-4 hover:text-red-300"
              >
                {entry.recipe.cover_image_url && (
                  <img
                    src={entry.recipe.cover_image_url}
                    alt=""
                    className="h-16 w-16 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div>
                  <h2 className="text-2xl">{entry.recipe.title}</h2>
                  <p className="text-sm text-neutral-500">
                    Added {new Date(entry.added_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="text-neutral-500">
                <p className="text-lg">This recipe is no longer available.</p>
                <p className="text-sm">
                  Recipe #{entry.recipe_id} · added{" "}
                  {new Date(entry.added_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      {entries.length === 0 && (
        <p className="text-neutral-500">No recipes in this collection yet.</p>
      )}
    </div>
  );
}
