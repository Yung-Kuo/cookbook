"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useRecipeList } from "@/hooks/useRecipeList"
import { useAuth } from "@/context/AuthContext"
import { useAppNav } from "@/hooks/useAppNav"
import { queryKeys } from "@/lib/queryKeys"

const TABS = ["pinned", "recipes", "collections"]
const DESKTOP_TABS = ["pinned", "collections"]

export function normalizeTab(tabValue) {
  if (!tabValue || !TABS.includes(tabValue)) return "recipes"
  return tabValue
}

export function effectiveRightPanelTab(activeTab) {
  if (activeTab === "recipes") return "pinned"
  return activeTab
}

/**
 * Profile route state: tabs, recipe list, CRUD wrappers that invalidate pinned query.
 */
export function useProfilePage(profileUserId) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()
  const { loginHref } = useAppNav()

  const isOwnProfile = isAuthenticated && user?.pk === Number(profileUserId)
  const ownerScopedViewer = isOwnProfile ? "owner" : "public"

  const tabParam = searchParams.get("tab")
  const activeTab = useMemo(() => normalizeTab(tabParam), [tabParam])

  const rightTab = useMemo(
    () => effectiveRightPanelTab(activeTab),
    [activeTab],
  )

  const setTab = useCallback(
    (tab) => {
      const next = normalizeTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const bumpPinned = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.pinned.byUserId(profileUserId, ownerScopedViewer),
    })
  }, [queryClient, profileUserId, ownerScopedViewer])

  const recipeList = useRecipeList({
    listScope: isOwnProfile ? "personal" : "user",
    ownerUserId: profileUserId,
    publicCatalogOnly: false,
  })

  const {
    handleRecipeCreated: baseRecipeCreated,
    handleRecipeUpdated: baseRecipeUpdated,
    handleRecipeDeleted: baseRecipeDeleted,
  } = recipeList

  const handleRecipeCreated = useCallback(
    (newRecipe) => {
      baseRecipeCreated(newRecipe)
      bumpPinned()
    },
    [baseRecipeCreated, bumpPinned],
  )

  const handleRecipeUpdated = useCallback(
    (updated) => {
      baseRecipeUpdated(updated)
      bumpPinned()
    },
    [baseRecipeUpdated, bumpPinned],
  )

  const handleRecipeDeleted = useCallback(
    (recipeId) => {
      baseRecipeDeleted(recipeId)
      bumpPinned()
    },
    [baseRecipeDeleted, bumpPinned],
  )

  const tabLabels = {
    pinned: "Pinned",
    recipes: "Recipes",
    collections: "Collections",
  }

  const visibleMobileTabs = TABS
  const visibleDesktopTabs = DESKTOP_TABS

  const shouldLoadPinned =
    activeTab === "pinned" || activeTab === "recipes"

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
    shouldLoadPinned,
    recipeList,
    handleRecipeChange: recipeList.handleRecipeChange,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
  }
}
