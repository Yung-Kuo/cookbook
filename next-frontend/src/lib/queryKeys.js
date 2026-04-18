/**
 * Canonical TanStack Query keys. Keep filters JSON-serializable and stable.
 *
 * @typedef {{ scope: string, ownerUserId: number | null, search: string, tagIds: number[], viewer?: 'auth' | 'anon' }} RecipeListFilters
 */

/** @param {number[] | undefined} ids */
function sortedTagIds(ids) {
  if (!ids?.length) return []
  return [...ids].sort((a, b) => a - b)
}

export const queryKeys = {
  auth: {
    all: () => ["auth"],
    me: () => ["auth", "me"],
  },
  recipes: {
    all: () => ["recipes"],
    lists: () => ["recipes", "list"],
    /**
     * @param {RecipeListFilters} f
     */
    list: (f) => [
      "recipes",
      "list",
      {
        scope: f.scope,
        ownerUserId: f.ownerUserId ?? null,
        search: f.search ?? "",
        tagIds: sortedTagIds(f.tagIds),
        /** API annotates is_liked only when the request carries the viewer's token */
        viewer: f.viewer ?? "anon",
      },
    ],
    /**
     * @param {string|number|undefined|null} id
     */
    detail: (id) => ["recipes", "detail", id],
  },
  tags: {
    all: () => ["tags"],
    list: () => ["tags", "list"],
  },
  ingredients: {
    all: () => ["ingredients"],
    list: () => ["ingredients", "list"],
  },
  profiles: {
    all: () => ["profiles"],
    /**
     * @param {string|number} userId
     */
    byUserId: (userId) => ["profiles", "byUserId", userId],
  },
  pinned: {
    all: () => ["pinned"],
    /**
     * @param {string|number} userId
     */
    byUserId: (userId) => ["pinned", "byUserId", userId],
  },
  collections: {
    all: () => ["collections"],
    /**
     * @param {string|number} userId
     */
    byUserId: (userId) => ["collections", "byUserId", userId],
    /**
     * @param {string|number} id
     */
    detail: (id) => ["collections", "detail", id],
    /**
     * @param {string|number|undefined|null} recipeId
     */
    forRecipe: (recipeId) => ["collections", "forRecipe", recipeId],
  },
}
