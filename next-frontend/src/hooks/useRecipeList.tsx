"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
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
import {
  getRecipesFromListData,
  mapRecipeListData,
} from "@/lib/recipeListShape"
import { OWNERLESS_RECIPE_USER_SEGMENT } from "@/lib/recipeRoutes"
import type { ListOrPaginated, Recipe, RecipeListFilters, Tag } from "@/types"

export type RecipeListScope = "public" | "personal" | "user" | "liked"

const listParamsToApiParams = (
  filters: RecipeListFilters,
): Record<string, string | number | boolean | number[]> => {
  const params: Record<string, string | number | boolean | number[]> = {}
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

const fetchRecipeListByScope = async (
  filters: RecipeListFilters,
): Promise<ListOrPaginated<Recipe>> => {
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

export type UseRecipeListOptions = {
  listScope: RecipeListScope
  ownerUserId?: number | string | null
  publicCatalogOnly?: boolean
  onAfterRecipeCreated?: (r: Recipe) => void
  onAfterRecipeUpdated?: (r: Recipe) => void
  onAfterRecipeDeleted?: (id: number) => void
}

/**
 * Shared recipe list state: TanStack Query for lists/tags, selection + overlay detail.
 */
export const useRecipeList = ({
  listScope,
  ownerUserId,
  publicCatalogOnly = false,
  onAfterRecipeCreated,
  onAfterRecipeUpdated,
  onAfterRecipeDeleted,
}: UseRecipeListOptions) => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isFormOpen, setFormOpen] = useState(false)
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null)

  const [selectedFilterTags, setSelectedFilterTags] = useState<Tag[]>([])

  useEffect(() => {
    setDebouncedSearch(search)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush debounced search when filters/auth change (matches prior doFetch behavior)
  }, [selectedFilterTags, isAuthenticated])

  const tagIds = useMemo(
    () =>
      selectedFilterTags.map((tag) => tag.id).filter((id) => id != null),
    [selectedFilterTags],
  )

  const viewerKey: RecipeListFilters["viewer"] =
    !authLoading && isAuthenticated ? "auth" : "anon"

  const listFilters = useMemo(
    (): RecipeListFilters => ({
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

  const { data: rawListData } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => fetchRecipeListByScope(listFilters),
    enabled: listEnabled,
  })

  const recipes = useMemo(
    () => getRecipesFromListData(rawListData),
    [rawListData],
  )

  const { data: tags = [] } = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: fetchTags,
    staleTime: 30 * 60 * 1000,
  })

  const overlayId = selectedRecipe?.id
  const { data: detailRecipe } = useQuery({
    queryKey: queryKeys.recipes.detail(overlayId),
    queryFn: () => fetchRecipeById(overlayId!),
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
    (
      updater: (
        prev: ListOrPaginated<Recipe> | undefined,
      ) => ListOrPaginated<Recipe> | undefined,
    ) => {
      queryClient.setQueryData(listQueryKey, updater)
    },
    [queryClient, listQueryKey],
  )

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val)
    }, 350)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setRecipeToEdit(null)
  }

  const handleRecipeChange = useCallback(
    (patch: Partial<Recipe> & { id: number }) => {
      if (!patch?.id) return
      patchListCache((prev) =>
        mapRecipeListData(prev, (list) =>
          list.map((r) => (r.id === patch.id ? { ...r, ...patch } : r)),
        ),
      )
      queryClient.setQueryData(
        queryKeys.recipes.detail(patch.id),
        (prev: Recipe | undefined) =>
          prev?.id === patch.id ? { ...prev, ...patch } : prev,
      )
      setSelectedRecipe((prev) =>
        prev?.id === patch.id ? { ...prev, ...patch } : prev,
      )
    },
    [patchListCache, queryClient],
  )

  const handleRecipeCreated = useCallback(
    (newRecipe: Recipe) => {
      patchListCache((prev) =>
        mapRecipeListData(prev, (list) => [...list, newRecipe]),
      )
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() })
      onAfterRecipeCreated?.(newRecipe)
    },
    [patchListCache, queryClient, onAfterRecipeCreated],
  )

  const handleRecipeUpdated = useCallback(
    (updated: Recipe) => {
      patchListCache((prev) =>
        mapRecipeListData(prev, (list) =>
          list.map((r) => (r.id === updated.id ? updated : r)),
        ),
      )
      queryClient.setQueryData(queryKeys.recipes.detail(updated.id), updated)
      setSelectedRecipe((prev) => (prev?.id === updated.id ? updated : prev))
      onAfterRecipeUpdated?.(updated)
    },
    [patchListCache, queryClient, onAfterRecipeUpdated],
  )

  const handleRecipeDeleted = useCallback(
    (recipeId: number) => {
      patchListCache((prev) =>
        mapRecipeListData(prev, (list) =>
          list.filter((r) => r.id !== recipeId),
        ),
      )
      queryClient.removeQueries({ queryKey: queryKeys.recipes.detail(recipeId) })
      setSelectedRecipe((prev) => (prev?.id === recipeId ? null : prev))
      setRecipeToEdit((prev) => (prev?.id === recipeId ? null : prev))
      setFormOpen(false)
      void queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all() })
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
    (recipe: { id: number; owner_id?: number | null }) => {
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
      const full = recipesForList.find((r) => r.id === recipe.id) ?? null
      if (!full) {
        router.push(`/users/${userIdForRecipeUrl}/recipes/${recipe.id}`)
        return
      }
      if (selectedRecipe?.id === recipe.id) {
        setSelectedRecipe(null)
        return
      }
      setSelectedRecipe(full)
    },
    [selectedRecipe?.id, router, ownerUserId, recipesForList],
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
    setRecipes: (
      next:
        | ListOrPaginated<Recipe>
        | ((prev: Recipe[]) => Recipe[]),
    ) => {
      if (typeof next === "function") {
        patchListCache((prev) => {
          const list = getRecipesFromListData(prev)
          const updated = next(list)
          return mapRecipeListData(prev, () => updated)
        })
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

export type UseRecipeListReturn = ReturnType<typeof useRecipeList>
