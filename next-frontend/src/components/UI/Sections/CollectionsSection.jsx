"use client";

import { useEffect, useRef, useState } from "react";
import CollectionCard from "@/components/UI/Cards/CollectionCard";
import AddButton from "@/components/UI/Buttons/AddButton";
import CardGridSection from "@/components/UI/Sections/CardGridSection";
import {
  fetchUserCollections,
  toggleCollectionVisibility,
  uploadCollectionCover,
  createCollection,
} from "@/api/collections";

/**
 * @param {{
 *   profileUserId: number,
 *   isOwner: boolean,
 *   isActive: boolean,
 *   className?: string,
 * }} props
 */
export default function CollectionsSection({
  profileUserId,
  isOwner,
  isActive,
  className = "",
}) {
  const [collections, setCollections] = useState([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const coverInputRefs = useRef({});

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    setCollectionsLoading(true);
    fetchUserCollections(profileUserId)
      .then((data) => {
        if (!cancelled) setCollections(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCollections([]);
      })
      .finally(() => {
        if (!cancelled) setCollectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, profileUserId]);

  const onVisibilityToggle = async (e, collectionId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const updated = await toggleCollectionVisibility(collectionId);
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, ...updated } : c)),
      );
    } catch {
      /* ignore */
    }
  };

  const onCoverFile = async (collectionId, file) => {
    if (!file) return;
    try {
      const updated = await uploadCollectionCover(collectionId, file);
      setCollections((prev) =>
        prev.map((c) => (c.id === collectionId ? { ...c, ...updated } : c)),
      );
    } catch {
      /* ignore */
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    const name = newCollectionName.trim();
    if (!name) return;
    try {
      await createCollection({ name, is_public: false });
      setNewCollectionName("");
      setNewCollectionOpen(false);
      const data = await fetchUserCollections(profileUserId);
      setCollections(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  };

  const actionBar =
    newCollectionOpen && isOwner ? (
      <form
        onSubmit={handleCreateCollection}
        className="mb-4 flex flex-wrap items-center gap-4 rounded-lg border border-neutral-600 bg-neutral-900 p-4 text-lg"
      >
        <label className="flex min-w-[12rem] flex-grow flex-col gap-1 lg:flex-row">
          <input
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="h-10 w-full rounded-md border border-neutral-600 bg-neutral-800 px-3 text-lg text-neutral-100 focus:border-sky-600 focus:ring-1 focus:ring-sky-600 focus:outline-none"
            placeholder="Name"
            required
          />
        </label>
        <div className="flex justify-end gap-4 text-base">
          <button
            type="submit"
            className="h-8 cursor-pointer rounded-md bg-red-300 px-3 font-bold text-neutral-900 transition-colors hover:bg-red-400"
            disabled={!newCollectionName.trim()}
            // onClick={handleCreateCollection}
          >
            Create
          </button>
          <button
            type="button"
            className="h-8 cursor-pointer rounded-md border border-neutral-600 bg-neutral-800 px-3 text-neutral-300 transition-colors hover:bg-neutral-700 hover:text-neutral-200"
            onClick={() => setNewCollectionOpen(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    ) : null;

  return (
    <div className={`relative ${className}`}>
      {isOwner && !newCollectionOpen && (
        <div className="pointer-events-none absolute top-4 right-4 z-10">
          <div className="pointer-events-auto">
            <AddButton
              onClick={() => setNewCollectionOpen(true)}
              parentClassName="h-10 w-10 lg:h-12 lg:w-12"
              className="h-10 w-10 bg-sky-500/80 text-white hover:bg-sky-400/80 lg:h-12 lg:w-12"
              title="New collection"
            />
          </div>
        </div>
      )}
      <CardGridSection
        loading={collectionsLoading}
        itemCount={collections.length}
        emptyMessage="No collections yet."
        actionBar={actionBar}
      >
        {collections.map((c) => (
          <li key={c.id} className="relative">
            <input
              ref={(el) => {
                coverInputRefs.current[c.id] = el;
              }}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) onCoverFile(c.id, f);
              }}
            />
            <CollectionCard
              collection={c}
              href={`/users/${profileUserId}/collections/${c.id}`}
              showPrivateBadge={isOwner}
              isOwner={isOwner}
              onCoverClick={() => coverInputRefs.current[c.id]?.click()}
            />
            {isOwner && (
              <button
                type="button"
                title={c.is_public ? "Public collection" : "Private"}
                onClick={(e) => onVisibilityToggle(e, c.id)}
                className="absolute top-10 right-2 z-10 rounded bg-neutral-900/90 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
              >
                {c.is_public ? "Public" : "Private"}
              </button>
            )}
          </li>
        ))}
      </CardGridSection>
    </div>
  );
}
