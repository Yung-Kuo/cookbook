/**
 * Canonical TanStack Query keys. Keep filters JSON-serializable and stable.
 *
 * @typedef {{ scope: string, ownerUserId: number | null, search: string, tagIds: number[], viewer?: string }} RecipeListFilters
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
     * @param {string} [viewer]
     */
    detail: (id, viewer = "anon") => ["recipes", "detail", id, { viewer }],
    /**
     * @param {string|number|undefined|null} id
     */
    detailRoot: (id) => ["recipes", "detail", id],
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
     * @param {string} [viewer]
     */
    byUserId: (userId, viewer = "public") => [
      "pinned",
      "byUserId",
      userId,
      { viewer },
    ],
  },
  collections: {
    all: () => ["collections"],
    /**
     * @param {string|number} userId
     * @param {string} [viewer]
     */
    byUserId: (userId, viewer = "public") => [
      "collections",
      "byUserId",
      userId,
      { viewer },
    ],
    /**
     * @param {string|number} id
     * @param {string} [viewer]
     */
    detail: (id, viewer = "public") => [
      "collections",
      "detail",
      id,
      { viewer },
    ],
    /**
     * @param {string|number|undefined|null} recipeId
     * @param {string} [viewer]
     */
    forRecipe: (recipeId, viewer = "anon") => [
      "collections",
      "forRecipe",
      recipeId,
      { viewer },
    ],
  },
}
