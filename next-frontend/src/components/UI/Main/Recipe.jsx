"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { CloseButton } from "../Buttons/CloseButton";
import { useAuth } from "@/context/AuthContext";
import { toggleHeart } from "@/api/hearts";
import {
  fetchCollections,
  createCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
} from "@/api/collections";

function HeartIcon({ filled, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}

function CollectionPicker({ recipeId, onMembershipChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer rounded-full border border-neutral-600 bg-neutral-800 px-3 py-1.5 text-sm font-medium text-neutral-200 transition-all hover:border-sky-500 hover:text-sky-200"
      >
        Save to collection
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-neutral-600 bg-neutral-900 p-3 shadow-xl">
        <p className="mb-2 text-xs font-medium text-neutral-500">
          Add this recipe to your collections
        </p>
        {loading && (
          <p className="text-sm text-neutral-400">Loading…</p>
        )}
        {error && (
          <p className="mb-2 text-sm text-red-400">{error}</p>
        )}
        <ul className="max-h-48 space-y-1 overflow-y-auto">
          {collections.map((col) => (
            <li key={col.id}>
              <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-neutral-800">
                <input
                  type="checkbox"
                  checked={Boolean(col.contains_recipe)}
                  disabled={busyId === col.id}
                  onChange={() => toggleCollection(col)}
                  className="rounded border-neutral-500"
                />
                <span className="truncate text-sm text-neutral-200">
                  {col.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <form onSubmit={handleCreate} className="mt-3 flex gap-2 border-t border-neutral-700 pt-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New collection name"
            className="min-w-0 flex-1 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-neutral-100"
          />
          <button
            type="submit"
            disabled={busyId === -1 || !newName.trim()}
            className="shrink-0 rounded bg-amber-600 px-2 py-1 text-sm text-neutral-900 disabled:opacity-50"
          >
            Add
          </button>
        </form>
      </div>
      )}
    </div>
  );
}

function Recipe({
  selectedRecipe,
  onClose,
  onEdit,
  onRecipeChange,
  className,
}) {
  const { user, isAuthenticated } = useAuth();
  const [heartBusy, setHeartBusy] = useState(false);
  const [heartOptimistic, setHeartOptimistic] = useState(null);

  const isOwnRecipe =
    isAuthenticated &&
    user?.pk != null &&
    selectedRecipe?.owner_id === user.pk;

  const { createdDate, updatedDate, isUpdated } = useMemo(() => {
    if (!selectedRecipe) {
      return { createdDate: null, updatedDate: null, isUpdated: false };
    }

    const createdDate = new Date(selectedRecipe.created_at);
    const updatedDate = selectedRecipe.updated_at
      ? new Date(selectedRecipe.updated_at)
      : null;

    const isUpdated =
      updatedDate && updatedDate.getTime() !== createdDate.getTime();

    return { createdDate, updatedDate, isUpdated };
  }, [selectedRecipe]);

  useEffect(() => {
    setHeartOptimistic(null);
  }, [selectedRecipe?.id]);

  const heartCount =
    heartOptimistic?.heart_count ?? selectedRecipe?.heart_count ?? 0;
  const isHearted =
    heartOptimistic?.is_hearted ?? selectedRecipe?.is_hearted ?? false;

  const handleHeartClick = async () => {
    if (!selectedRecipe?.id || !isAuthenticated || isOwnRecipe || heartBusy)
      return;
    const prevCount = selectedRecipe.heart_count ?? 0;
    const prevHearted = selectedRecipe.is_hearted ?? false;
    const nextHearted = !prevHearted;
    const nextCount = Math.max(0, prevCount + (nextHearted ? 1 : -1));
    setHeartOptimistic({ heart_count: nextCount, is_hearted: nextHearted });
    setHeartBusy(true);
    try {
      const data = await toggleHeart(selectedRecipe.id);
      const patch = {
        id: selectedRecipe.id,
        heart_count: data.heart_count,
        is_hearted: data.hearted,
      };
      setHeartOptimistic(null);
      onRecipeChange?.(patch);
    } catch (e) {
      console.error(e);
      setHeartOptimistic(null);
    } finally {
      setHeartBusy(false);
    }
  };

  if (!selectedRecipe) return null;

  return (
    <div
      className={`${className} absolute top-0 right-0 z-10 overflow-scroll bg-neutral-900 p-5 pb-40 lg:pb-5 lg:pt-16`}
    >
      <div className="fixed top-18 right-5 z-20 flex flex-wrap items-center justify-end gap-3">
        {isAuthenticated && selectedRecipe.id && (
          <CollectionPicker
            recipeId={selectedRecipe.id}
            onMembershipChange={() => {}}
          />
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer rounded-full  bg-red-300 px-4 text-lg font-bold text-neutral-800 transition-all hover:bg-red-400 focus:outline-none active:scale-95 lg:text-xl"
          >
            Edit
          </button>
        )}
        {onClose && <CloseButton onClose={onClose} />}
      </div>

      <div className="flex flex-col gap-24 text-xl lg:text-2xl">
        <div className="flex flex-col gap-5">
          {selectedRecipe.cover_image_url && (
            <div className="-mx-5 -mt-5 overflow-hidden lg:-mt-16">
              <img
                src={selectedRecipe.cover_image_url}
                alt={selectedRecipe.title}
                className="h-64 w-full object-cover lg:h-96"
              />
            </div>
          )}
          {(selectedRecipe.images || []).length > 1 && (
            <div className="-mx-5 flex gap-2 overflow-x-auto pb-2">
              {[...(selectedRecipe.images || [])]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((img) => (
                  <div
                    key={img.id}
                    className={`h-24 w-36 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                      img.is_cover
                        ? "border-amber-500"
                        : "border-transparent"
                    }`}
                  >
                    {img.image_url && (
                      <img
                        src={img.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link
              href={`/users/${selectedRecipe.owner_id ?? "_"}/recipes/${selectedRecipe.id}`}
            >
              <h1 className="text-6xl break-words whitespace-pre-wrap transition-colors hover:text-red-300 lg:text-8xl">
                {selectedRecipe.title}
              </h1>
            </Link>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <button
                  type="button"
                  onClick={handleHeartClick}
                  disabled={
                    !isAuthenticated || isOwnRecipe || heartBusy
                  }
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all ${
                    isHearted
                      ? "border-red-400 bg-red-950/40 text-red-300"
                      : "border-neutral-600 text-neutral-300 hover:border-red-400/50"
                  } ${
                    !isAuthenticated || isOwnRecipe
                      ? "cursor-default opacity-80"
                      : "cursor-pointer"
                  }`}
                  title={
                    !isAuthenticated
                      ? "Log in to heart recipes"
                      : isOwnRecipe
                        ? "Your recipe"
                        : isHearted
                          ? "Remove heart"
                          : "Heart this recipe"
                  }
                >
                  <HeartIcon
                    filled={isHearted}
                    className="h-6 w-6 shrink-0"
                  />
                  <span className="text-lg font-semibold tabular-nums">
                    {heartCount}
                  </span>
                </button>
              </div>
              {selectedRecipe.is_public === false && (
                <span className="rounded-full bg-neutral-700 px-3 py-1 text-sm text-neutral-300">
                  Private
                </span>
              )}
            </div>
          </div>
          {selectedRecipe.tags?.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {selectedRecipe.tags.map((tag) => (
                <div
                  key={tag.id}
                  className="rounded-full bg-neutral-700 px-4 py-1"
                >
                  <h6>{tag.name}</h6>
                </div>
              ))}
            </div>
          )}
          {selectedRecipe.description && <h4>{selectedRecipe.description}</h4>}
        </div>

        {/* ingredients */}
        {selectedRecipe.recipe_ingredients && (
          <div>
            <div className="mb-2 flex justify-between">
              <h2 className="text-3xl lg:text-4xl">Ingredients</h2>
              {/* servings */}
              {selectedRecipe.servings && (
                <h4 className="flex items-end text-neutral-500">
                  {selectedRecipe.servings} servings
                </h4>
              )}
            </div>
            <div className="border-t border-neutral-500 py-10">
              <div className="flex w-full flex-col gap-4 md:w-max md:min-w-2/3">
                {selectedRecipe.recipe_ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex h-max justify-between gap-2"
                  >
                    <h4 className="w-max">{ingredient.name}</h4>
                    <div className="flex grow items-center border-b border-dotted border-neutral-500" />
                    <h4 className="flex w-1/3 items-center gap-2">
                      {ingredient.quantity}
                      <span className="text-neutral-500">
                        {ingredient.unit}
                      </span>
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* instructions */}
        <div>
          <h2 className="mb-2 text-3xl lg:text-4xl">Instructions</h2>
          {selectedRecipe.recipe_instructions && (
            <div className="flex flex-col gap-4 border-t border-neutral-500 py-10">
              {selectedRecipe.recipe_instructions.map((instruction) => (
                <div key={instruction.id} className="flex">
                  <h4 className="flex w-1/6 text-neutral-500">
                    {instruction.order}
                  </h4>
                  <h4 className="w-5/6">{instruction.text}</h4>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* prep time */}
          {selectedRecipe.prep_time && (
            <h4 className="flex gap-2 text-neutral-500">
              Prep Time:
              <span className="text-neutral-100">
                {selectedRecipe.prep_time}
              </span>
              minutes
            </h4>
          )}
          {/* cook time */}
          {selectedRecipe.cook_time && (
            <h4 className="flex gap-2 text-neutral-500">
              Cook Time:
              <span className="text-neutral-100">
                {selectedRecipe.cook_time}
              </span>
              minutes
            </h4>
          )}
        </div>

        {/* createdDate & updatedDate */}
        <div className="flex flex-col items-end">
          {/* created */}
          {createdDate && (
            <h6 className="flex gap-2 text-neutral-500">
              Created at:
              <span className="text-neutral-100">
                {createdDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </h6>
          )}
          {/* updated */}
          {updatedDate && isUpdated && (
            <h6 className="flex gap-2 text-neutral-500">
              Last updated:
              <span className="text-neutral-100">
                {updatedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </h6>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recipe;
