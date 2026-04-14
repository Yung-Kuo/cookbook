"use client";

import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { fetchPersonalRecipesList } from "@/api/recipes";
import { pinRecipe, unpinRecipe } from "@/api/pinned";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   pinnedIds: Set<number> | number[],
 *   onPinsChanged?: () => void,
 * }} props
 */
export default function PinPickerModal({
  open,
  onClose,
  pinnedIds,
  onPinsChanged,
}) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const pinnedSet = useMemo(() => {
    if (pinnedIds instanceof Set) return pinnedIds;
    return new Set(pinnedIds ?? []);
  }, [pinnedIds]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPersonalRecipesList()
      .then((data) => {
        if (!cancelled) setRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your recipes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) =>
      (r.title || "").toLowerCase().includes(q),
    );
  }, [recipes, search]);

  const toggle = async (recipeId, currentlyPinned) => {
    setBusyId(recipeId);
    try {
      if (currentlyPinned) {
        await unpinRecipe(recipeId);
      } else {
        await pinRecipe(recipeId);
      }
      onPinsChanged?.();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[80]">
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
        <DialogPanel className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-xl border border-neutral-600 bg-neutral-800 shadow-xl">
          <DialogTitle className="border-b border-neutral-600 px-4 py-3 text-lg font-bold text-neutral-100">
            Pin recipes to profile
          </DialogTitle>
          <div className="p-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your recipes…"
              className="mb-3 w-full rounded-md border border-neutral-600 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 focus:border-sky-500 focus:outline-none"
            />
            {loading && (
              <p className="text-neutral-400" role="status">
                Loading…
              </p>
            )}
            {error && <p className="text-red-400">{error}</p>}
            {!loading && !error && (
              <ul className="max-h-[50dvh] space-y-2 overflow-y-auto">
                {filtered.map((r) => {
                  const isPinned = pinnedSet.has(r.id);
                  const busy = busyId === r.id;
                  return (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-neutral-100">
                        {r.title}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(r.id, isPinned)}
                        className="shrink-0 rounded-md bg-neutral-700 px-3 py-1 text-sm font-medium text-neutral-100 hover:bg-neutral-600 disabled:opacity-50"
                      >
                        {busy ? "…" : isPinned ? "Unpin" : "Pin"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-neutral-500">No recipes match.</p>
            )}
          </div>
          <div className="border-t border-neutral-600 px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-neutral-700 py-2 font-medium text-neutral-100 hover:bg-neutral-600"
            >
              Done
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
