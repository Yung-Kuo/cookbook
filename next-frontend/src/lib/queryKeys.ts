import type { RecipeListFilters } from "@/types"

/** Canonical TanStack Query keys. Keep filters JSON-serializable and stable. */

const sortedTagIds = (ids: number[] | undefined): number[] => {
  if (!ids?.length) return []
  return [...ids].sort((a, b) => a - b)
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
        },
      ] as const,
    detail: (id: string | number | undefined | null) =>
      ["recipes", "detail", id] as const,
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
    byUserId: (userId: string | number) =>
      ["pinned", "byUserId", userId] as const,
  },
  collections: {
    all: () => ["collections"] as const,
    byUserId: (userId: string | number) =>
      ["collections", "byUserId", userId] as const,
    detail: (id: string | number) => ["collections", "detail", id] as const,
    forRecipe: (recipeId: string | number | undefined | null) =>
      ["collections", "forRecipe", recipeId] as const,
  },
}
