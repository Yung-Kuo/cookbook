"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RecipeCard from "@/components/UI/Cards/RecipeCard";
import PinPickerModal from "@/components/UI/Popups/PinPickerModal";
import AddButton from "@/components/UI/Buttons/AddButton";
import CardGridSection from "@/components/UI/Sections/CardGridSection";
import { fetchPinnedRecipes } from "@/api/pinned";

/**
 * @param {{
 *   profileUserId: number,
 *   isOwner: boolean,
 *   isActive: boolean,
 *   refreshKey?: number,
 *   onRecipeOpen?: (recipe: object) => void,
 *   className?: string,
 * }} props
 */
export default function PinnedSection({
  profileUserId,
  isOwner,
  isActive,
  refreshKey = 0,
  onRecipeOpen,
  className = "",
}) {
  const [pinnedRows, setPinnedRows] = useState([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    setPinnedLoading(true);
    fetchPinnedRecipes(profileUserId)
      .then((data) => {
        if (!cancelled) setPinnedRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setPinnedRows([]);
      })
      .finally(() => {
        if (!cancelled) setPinnedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, profileUserId, refreshKey]);

  const pinnedIds = useMemo(() => {
    return new Set(pinnedRows.map((row) => row.recipe?.id).filter(Boolean));
  }, [pinnedRows]);

  const refreshPinned = useCallback(() => {
    fetchPinnedRecipes(profileUserId)
      .then((data) => setPinnedRows(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [profileUserId]);

  return (
    <div className={`relative ${className}`}>
      <PinPickerModal
        open={pinPickerOpen}
        onClose={() => setPinPickerOpen(false)}
        pinnedIds={pinnedIds}
        onPinsChanged={refreshPinned}
      />
      {isOwner && (
        <div className="pointer-events-none absolute top-4 right-4 z-10">
          <div className="pointer-events-auto">
            <AddButton
              onClick={() => setPinPickerOpen(true)}
              parentClassName="h-10 w-10 lg:h-12 lg:w-12"
              className="h-10 w-10 bg-indigo-500 text-white hover:bg-indigo-400 lg:h-12 lg:w-12"
              title="Add pins"
            />
          </div>
        </div>
      )}
      <CardGridSection
        loading={pinnedLoading}
        itemCount={pinnedRows.length}
        emptyMessage={
          isOwner ? "No pinned recipes yet." : "No public pins yet."
        }
      >
        {pinnedRows.map((row) => {
          const r = row.recipe;
          if (!r) return null;
          const ownerId = r.owner_id ?? profileUserId;
          return (
            <li key={r.id}>
              <RecipeCard
                recipe={r}
                showPrivateBadge={isOwner}
                {...(onRecipeOpen
                  ? { onClick: () => onRecipeOpen(r) }
                  : { href: `/users/${ownerId}/recipes/${r.id}` })}
              />
            </li>
          );
        })}
      </CardGridSection>
    </div>
  );
}
