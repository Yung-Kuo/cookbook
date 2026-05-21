/**
 * Path segment for `/users/[userId]/recipes/[id]` when a recipe has no owner
 * (e.g. template recipes). Not a real user id; detail loads by recipe id only.
 */
export const OWNERLESS_RECIPE_USER_SEGMENT = "_"
