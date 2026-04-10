"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchCollections,
  createCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
} from "@/api/collections";
import RoundedButton from "./RoundedButton";
import BookmarkIcon from "../../Icons/BookmarkIcon";

/**
 * Dropdown to add/remove recipe from collections.
 */
export default function CollectionButton({ recipeId, onMembershipChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setOpen(false);
    setNewName("");
    setError(null);
    setBusyId(null);
    setCollections([]);
  }, [recipeId]);

  const load = useCallback(async () => {
    if (!recipeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCollections(recipeId);
      setCollections(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load");
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const toggleCollection = async (col) => {
    if (!recipeId) return;
    setBusyId(col.id);
    setError(null);
    try {
      if (col.contains_recipe) {
        await removeRecipeFromCollection(col.id, recipeId);
      } else {
        await addRecipeToCollection(col.id, recipeId);
      }
      await load();
      onMembershipChange?.();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name || !recipeId) return;
    setBusyId(-1);
    setError(null);
    try {
      const created = await createCollection({ name });
      await addRecipeToCollection(created.id, recipeId);
      setNewName("");
      await load();
      onMembershipChange?.();
    } catch (err) {
      setError(err.message || "Could not create");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <RoundedButton
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer border !text-lg !font-bold border-neutral-600 bg-neutral-800 text-neutral-200 hover:border-sky-500 active:outline-none hover:text-sky-200"
      >
        {/* Bookmarks icon */}
        <BookmarkIcon className="h-5 w-5 shrink-0" />
        <span className="mr-1">collections</span>
      </RoundedButton>
      {open && (
        <div className="absolute left-0 mt-2 w-72 rounded-lg border border-neutral-600 bg-neutral-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-neutral-500">
            Add this recipe to your collections
          </p>
          {loading && <p className="text-sm text-neutral-400">Loading…</p>}
          {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {collections.map((col) => (
              <li key={col.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-neutral-800 has-[:disabled]:cursor-not-allowed focus-within:outline-none">
                  <input
                    type="checkbox"
                    checked={Boolean(col.contains_recipe)}
                    disabled={busyId === col.id}
                    onChange={() => toggleCollection(col)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-900 peer-disabled:opacity-50"
                  >
                    <svg
                      className="h-4 w-4 text-red-300 opacity-0 transition-opacity"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 6L5 8.5L9.5 3"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="truncate text-lg text-neutral-200">
                    {col.name}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <form
            onSubmit={handleCreate}
            className="mt-3 flex gap-2 border-t border-neutral-700 pt-3"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection name"
              className="min-w-0 flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-base text-neutral-100 outline-none focus:border-sky-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busyId === -1 || !newName.trim()}
              className="shrink-0 rounded bg-amber-500 hover:enabled:bg-amber-400 transition-colors cursor-pointer px-2 py-1 text-base font-bold text-neutral-900 disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
