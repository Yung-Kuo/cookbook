"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCollections } from "@/api/collections";
import { useAuth } from "@/context/AuthContext";

export default function CollectionsListPage() {
  const { userId } = useParams();
  const id = Array.isArray(userId) ? userId[0] : userId;
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.pk !== Number(id)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchCollections()
      .then((data) => {
        if (!cancelled) {
          setCollections(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, user, id]);

  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-neutral-800 text-neutral-400">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-xl text-neutral-200">
        <p>Log in to manage your collections.</p>
        <Link
          href="/login"
          className="rounded-full bg-red-300 px-5 py-2 text-neutral-900"
        >
          Login
        </Link>
      </div>
    );
  }

  if (user?.pk !== Number(id)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8 text-center text-neutral-200">
        <p>Collections are private. Open your own collections.</p>
        <Link
          href={`/users/${user.pk}/collections`}
          className="rounded-full bg-sky-600 px-5 py-2 text-neutral-100"
        >
          My collections
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-800 p-6 text-neutral-100">
      <h1 className="mb-8 text-4xl font-bold text-red-300">Collections</h1>
      {loading && <p className="text-neutral-400">Loading…</p>}
      {error && <p className="text-red-400">{error}</p>}
      {!loading && !error && collections.length === 0 && (
        <p className="text-neutral-400">
          No collections yet. Like a recipe and use &quot;+ collection&quot;
          to create one.
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <li key={c.id}>
            <Link
              href={`/users/${id}/collections/${c.id}`}
              className="flex h-full flex-col rounded-lg border border-neutral-600 bg-neutral-900 p-4 transition-all hover:border-sky-500"
            >
              {c.cover_image_url && (
                <img
                  src={c.cover_image_url}
                  alt=""
                  className="mb-3 h-32 w-full rounded object-cover"
                />
              )}
              <h2 className="text-2xl font-semibold">{c.name}</h2>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-400">
                  {c.description}
                </p>
              )}
              <p className="mt-auto pt-3 text-sm text-neutral-500">
                {c.recipe_count ?? 0} recipe
                {(c.recipe_count ?? 0) !== 1 ? "s" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
