import type { RecipeListFilters, RecipeListViewer } from "@/types"

/** Canonical TanStack Query keys. Keep filters JSON-serializable and stable. */

const sortedTagIds = (ids: number[] | undefined): number[] => {
  if (!ids?.length) return []
  return [...ids].sort((a, b) => a - b)
}

type ViewerScope = {
  viewer?: RecipeListViewer
  viewerUserId?: number | null
}

const viewerScope = (scope?: ViewerScope) => {
  const viewer = scope?.viewer ?? "anon"
  return {
    viewer,
    viewerUserId: viewer === "auth" ? (scope?.viewerUserId ?? null) : null,
  }
}

export const queryKeys = {
  auth: {
    all: () => ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },
  recipes: {
    all: () => ["recipes"] as const,
    lists: () => ["recipes", "list"] as const,
    list: (f: RecipeListFilters) =>
      [
        "recipes",
        "list",
        {
          scope: f.scope,
          ownerUserId: f.ownerUserId ?? null,
          search: f.search ?? "",
          tagIds: sortedTagIds(f.tagIds),
          viewer: f.viewer ?? "anon",
          viewerUserId:
            f.viewer === "auth" ? (f.viewerUserId ?? null) : null,
        },
      ] as const,
    detailRoot: (id: string | number | undefined | null) =>
      ["recipes", "detail", id] as const,
    detail: (id: string | number | undefined | null) =>
      ["recipes", "detail", id, viewerScope()] as const,
    detailForViewer: (
      id: string | number | undefined | null,
      scope?: ViewerScope,
    ) => ["recipes", "detail", id, viewerScope(scope)] as const,
  },
  tags: {
    all: () => ["tags"] as const,
    list: () => ["tags", "list"] as const,
  },
  ingredients: {
    all: () => ["ingredients"] as const,
    list: () => ["ingredients", "list"] as const,
  },
  profiles: {
    all: () => ["profiles"] as const,
    byUserId: (userId: string | number) =>
      ["profiles", "byUserId", userId] as const,
  },
  pinned: {
    all: () => ["pinned"] as const,
    byUserId: (userId: string | number, scope?: ViewerScope) =>
      ["pinned", "byUserId", userId, viewerScope(scope)] as const,
  },
  collections: {
    all: () => ["collections"] as const,
    byUserId: (userId: string | number, scope?: ViewerScope) =>
      ["collections", "byUserId", userId, viewerScope(scope)] as const,
    detailRoot: (id: string | number) => ["collections", "detail", id] as const,
    detail: (id: string | number, scope?: ViewerScope) =>
      ["collections", "detail", id, viewerScope(scope)] as const,
    forRecipe: (recipeId: string | number | undefined | null) =>
      ["collections", "forRecipe", recipeId] as const,
  },
}
