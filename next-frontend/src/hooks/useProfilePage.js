"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRecipeList } from "@/hooks/useRecipeList";
import { fetchPersonalRecipes, fetchUserRecipes } from "@/api/recipes";
import { useAuth } from "@/context/AuthContext";
import { useAppNav } from "@/hooks/useAppNav";

const TABS = ["pinned", "recipes", "collections"];
const DESKTOP_TABS = ["pinned", "collections"];

export function normalizeTab(tabValue) {
  if (!tabValue || !TABS.includes(tabValue)) return "recipes";
  return tabValue;
}

export function effectiveRightPanelTab(activeTab) {
  if (activeTab === "recipes") return "pinned";
  return activeTab;
}

/**
 * Profile route state: tabs, recipe list, CRUD wrappers that bump pinned refresh.
 */
export function useProfilePage(profileUserId) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { loginHref } = useAppNav();

  const isOwnProfile = isAuthenticated && user?.pk === Number(profileUserId);

  const tabParam = searchParams.get("tab");
  const activeTab = useMemo(() => normalizeTab(tabParam), [tabParam]);

  const rightTab = useMemo(
    () => effectiveRightPanelTab(activeTab),
    [activeTab],
  );

  const setTab = useCallback(
    (tab) => {
      const next = normalizeTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const [pinnedRefreshKey, setPinnedRefreshKey] = useState(0);
  const bumpPinned = useCallback(() => {
    setPinnedRefreshKey((key) => key + 1);
  }, []);

  const mainFetchFn = useMemo(
    () =>
      isOwnProfile
        ? fetchPersonalRecipes
        : (setRecipes, params) =>
            fetchUserRecipes(profileUserId, setRecipes, params),
    [isOwnProfile, profileUserId],
  );

  const recipeList = useRecipeList({
    fetchFn: mainFetchFn,
    publicCatalogOnly: false,
  });

  const {
    handleRecipeCreated: baseRecipeCreated,
    handleRecipeUpdated: baseRecipeUpdated,
    handleRecipeDeleted: baseRecipeDeleted,
  } = recipeList;

  const handleRecipeCreated = useCallback(
    (newRecipe) => {
      baseRecipeCreated(newRecipe);
      bumpPinned();
    },
    [baseRecipeCreated, bumpPinned],
  );

  const handleRecipeUpdated = useCallback(
    (updated) => {
      baseRecipeUpdated(updated);
      bumpPinned();
    },
    [baseRecipeUpdated, bumpPinned],
  );

  const handleRecipeDeleted = useCallback(
    (recipeId) => {
      baseRecipeDeleted(recipeId);
      bumpPinned();
    },
    [baseRecipeDeleted, bumpPinned],
  );

  const tabLabels = {
    pinned: "Pinned",
    recipes: "Recipes",
    collections: "Collections",
  };

  const visibleMobileTabs = TABS;
  const visibleDesktopTabs = DESKTOP_TABS;

  const shouldLoadPinned =
    activeTab === "pinned" || activeTab === "recipes";

  return {
    profileUserId,
    isOwnProfile,
    isAuthenticated,
    loginHref,
    activeTab,
    rightTab,
    setTab,
    tabLabels,
    visibleMobileTabs,
    visibleDesktopTabs,
    pinnedRefreshKey,
    shouldLoadPinned,
    recipeList,
    handleRecipeChange: recipeList.handleRecipeChange,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
  };
}
