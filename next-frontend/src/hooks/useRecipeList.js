"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import RecipeListItem from "@/components/UI/RecipeList/RecipeListItem"
import {
  fetchLikedRecipesData,
  fetchPersonalRecipesData,
  fetchRecipesData,
  fetchRecipeById,
  fetchUserRecipesData,
} from "@/api/recipes"
import { fetchTags } from "@/api/tags"
import { useAuth } from "@/context/AuthContext"
import { queryKeys } from "@/lib/queryKeys"
import { OWNERLESS_RECIPE_USER_SEGMENT } from "@/lib/recipeRoutes"

/**
 * @param {import('@/lib/queryKeys').RecipeListFilters} filters
 */
function listParamsToApiParams(filters) {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.tagIds?.length) params.tags = filters.tagIds
  switch (filters.scope) {
    case "public":
      break
    case "personal":
      params.personal = "true"
      break
    case "user":
      if (filters.ownerUserId != null) {
        params.owner_id = String(filters.ownerUserId)
      }
      break
    case "liked":
      params.liked = "true"
      break
    default:
      break
  }
  return params
}

/**
 * @param {import('@/lib/queryKeys').RecipeListFilters} filters
 */
async function fetchRecipeListByScope(filters) {
  const params = listParamsToApiParams(filters)
  switch (filters.scope) {
    case "public":
      return fetchRecipesData(params)
    case "personal":
      return fetchPersonalRecipesData(params)
    case "user": {
      if (filters.ownerUserId == null) {
        throw new Error("ownerUserId required for user scope")
      }
      return fetchUserRecipesData(filters.ownerUserId, params)
    }
    case "liked":
      return fetchLikedRecipesData(params)
    default:
      return fetchRecipesData(params)
  }
}

/**
 * Shared recipe list state: TanStack Query for lists/tags, selection + overlay detail.
 *
 * @param {{
 *   listScope: 'public' | 'personal' | 'user' | 'liked',
 *   ownerUserId?: number,
 *   publicCatalogOnly?: boolean,
 *   onAfterRecipeCreated?: (r: object) => void,
 *   onAfterRecipeUpdated?: (r: object) => void,
 *   onAfterRecipeDeleted?: (id: number) => void,
 * }} options
 */
export function useRecipeList({
  listScope,
  ownerUserId,
  publicCatalogOnly = false,
  onAfterRecipeCreated,
  onAfterRecipeUpdated,
  onAfterRecipeDeleted,
}) {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef(null)

  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [isFormOpen, setFormOpen] = useState(false)
  const [recipeToEdit, setRecipeToEdit] = useState(null)

  const [selectedFilterTags, setSelectedFilterTags] = useState([])

  useEffect(() => {
    setDebouncedSearch(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush debounced search when filters/auth change (matches prior doFetch behavior)
  }, [selectedFilterTags, isAuthenticated])

  const tagIds = useMemo(
    () =>
      selectedFilterTags.map((tag) => tag.id).filter((id) => id != null),
    [selectedFilterTags],
  )

  const viewerKey =
    !authLoading && isAuthenticated ? "auth" : "anon"

  const listFilters = useMemo(
    () => ({
      scope: listScope,
      ownerUserId: ownerUserId ?? null,
      search: debouncedSearch,
      tagIds,
      viewer: viewerKey,
    }),
    [listScope, ownerUserId, debouncedSearch, tagIds, viewerKey],
  )

  const listQueryKey = useMemo(
    () => queryKeys.recipes.list(listFilters),
    [listFilters],
  )

  const needsAuthList = listScope === "liked" || listScope === "personal"
  const listEnabled =
    !authLoading &&
    (!needsAuthList || isAuthenticated) &&
    (listScope !== "user" || ownerUserId != null)

  const { data: recipes = [] } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => fetchRecipeListByScope(listFilters),
    enabled: listEnabled,
  })

  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: fetchTags,
    staleTime: 30 * 60 * 1000,
  })

  const overlayId = selectedRecipe?.id
  const { data: detailRecipe } = useQuery({
    queryKey: queryKeys.recipes.detail(overlayId),
    queryFn: () => fetchRecipeById(overlayId),
    enabled: Boolean(overlayId),
    placeholderData: selectedRecipe ?? undefined,
  })

  const selectedRecipeForUi = useMemo(() => {
    if (!selectedRecipe?.id) return null
    if (detailRecipe?.id === selectedRecipe.id) return detailRecipe
    return selectedRecipe
  }, [selectedRecipe, detailRecipe])

  useEffect(() => {
    if (!isAuthenticated && selectedRecipe?.is_public === false) {
      setSelectedRecipe(null)
    }
  }, [isAuthenticated, selectedRecipe?.is_public, selectedRecipe?.id])

  const patchListCache = useCallback(
    (updater) => {
      queryClient.setQueryData(listQueryKey, updater)
    },
    [queryClient, listQueryKey],
  )

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
    }, 350)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setRecipeToEdit(null)
  }

  const handleRecipeChange = useCallback(
    (patch) => {
      if (!patch?.id) return
      patchListCache((prev) =>
        (prev ?? []).map((r) => (r.id === patch.id ? { ...r, ...patch } : r)),
      )
      queryClient.setQueryData(queryKeys.recipes.detail(patch.id), (prev) =>
        prev?.id === patch.id ? { ...prev, ...patch } : prev,
      )
      setSelectedRecipe((prev) =>
        prev?.id === patch.id ? { ...prev, ...patch } : prev,
      )
    },
    [patchListCache, queryClient],
  )

  const handleRecipeCreated = useCallback(
    (newRecipe) => {
      patchListCache((prev) => [...(prev ?? []), newRecipe])
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() })
      onAfterRecipeCreated?.(newRecipe)
    },
    [patchListCache, queryClient, onAfterRecipeCreated],
  )

  const handleRecipeUpdated = useCallback(
    (updated) => {
      patchListCache((prev) =>
        (prev ?? []).map((r) => (r.id === updated.id ? updated : r)),
      )
      queryClient.setQueryData(queryKeys.recipes.detail(updated.id), updated)
      setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev))
      onAfterRecipeUpdated?.(updated)
    },
    [patchListCache, queryClient, onAfterRecipeUpdated],
  )

  const handleRecipeDeleted = useCallback(
    (recipeId) => {
      patchListCache((prev) => (prev ?? []).filter((r) => r.id !== recipeId))
      queryClient.removeQueries({ queryKey: queryKeys.recipes.detail(recipeId) })
      setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev))
      setRecipeToEdit((prev) => (prev?.id === recipeId ? null : prev))
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() })
      onAfterRecipeDeleted?.(recipeId)
    },
    [patchListCache, queryClient, onAfterRecipeDeleted],
  )

  const recipesForList = useMemo(() => {
    if (publicCatalogOnly) {
      return recipes.filter((r) => r.is_public !== false)
    }
    if (!isAuthenticated) {
      return recipes.filter((r) => r.is_public !== false)
    }
    return recipes
  }, [publicCatalogOnly, isAuthenticated, recipes])

  const selectRecipeForOverlay = useCallback(
    (recipe) => {
      if (!recipe?.id) return
      const isDesktop =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px)").matches
      const ownerFromRecipeOrListContext =
        recipe.owner_id != null ? recipe.owner_id : ownerUserId ?? null
      const userIdForRecipeUrl =
        ownerFromRecipeOrListContext != null
          ? ownerFromRecipeOrListContext
          : OWNERLESS_RECIPE_USER_SEGMENT
      if (!isDesktop) {
        router.push(`/users/${userIdForRecipeUrl}/recipes/${recipe.id}`)
        return
      }
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe(null)
        return
      }
      setSelectedRecipe(recipe)
    },
    [selectedRecipe?.id, router, ownerUserId],
  )

  const recipeListItems = useMemo(
    () =>
      recipesForList.map((recipe) => (
        <div
          key={recipe.id}
          className={`w-full transition-all ${selectedRecipeForUi?.id === recipe.id ? "lg:pr-0 lg:pl-4" : "lg:px-6"}`}
        >
          <RecipeListItem
            recipe={recipe}
            isSelected={selectedRecipeForUi?.id === recipe.id}
            onSelect={() => selectRecipeForOverlay(recipe)}
          />
        </div>
      )),
    [recipesForList, selectedRecipeForUi?.id, selectRecipeForOverlay],
  )

  return {
    recipes,
    setRecipes: (next) => {
      if (typeof next === "function") {
        patchListCache((prev) => next(prev ?? []))
      } else {
        patchListCache(() => next)
      }
    },
    search,
    handleSearchChange,
    tags,
    selectedFilterTags,
    setSelectedFilterTags,
    selectedRecipe: selectedRecipeForUi,
    setSelectedRecipe,
    isFormOpen,
    setFormOpen,
    recipeToEdit,
    setRecipeToEdit,
    handleCloseForm,
    handleRecipeCreated,
    handleRecipeUpdated,
    handleRecipeDeleted,
    handleRecipeChange,
    recipesForList,
    recipeListItems,
    selectRecipeForOverlay,
  }
}
