/** TanStack Query recipe list filters — JSON-serializable and stable */
export type RecipeListViewer = "auth" | "anon"

export type RecipeListFilters = {
  scope: string
  ownerUserId: number | string | null
  search: string
  tagIds: number[]
  viewer?: RecipeListViewer
}

export type Tag = {
  id?: number | null
  name: string
}

export type Ingredient = {
  id: number
  name: string
}

export type RecipeIngredient = {
  id: number
  name: string
  quantity: string
  unit: string
  ingredient: number
}

export type RecipeInstruction = {
  id: number
  text: string
  order: number
}

export type RecipeImage = {
  id: number
  image_url: string | null
  is_cover: boolean
  order: number
}

/** Recipe as returned by RecipeSerializer (read) */
export type Recipe = {
  id: number
  title: string
  description: string
  recipe_instructions: RecipeInstruction[]
  prep_time: number | string | null
  cook_time: number | string | null
  servings: number | string | null
  tags: Tag[]
  recipe_ingredients: RecipeIngredient[]
  owner_username: string | null
  owner_id: number | null
  owner_display_name: string | null
  owner_avatar_url: string | null
  is_public: boolean
  images: RecipeImage[]
  cover_image_url: string | null
  like_count: number
  is_liked: boolean
  is_pinned: boolean
  created_at: string
  updated_at: string
}

/** Nested recipe summary in pinned list */
export type PinnedRecipeSummary = {
  id: number
  title: string
  cover_image_url: string | null
  is_public: boolean
  owner_id: number | null
}

export type PinnedRecipeRow = {
  order: number
  recipe: PinnedRecipeSummary
}

export type UserProfile = {
  id: number
  user_id: number
  username: string
  display_name: string
  bio: string
  avatar?: string
  avatar_url: string | null
  created_at: string
}

/** dj-rest-auth style user from /auth/user/ */
export type AuthUser = {
  pk: number
  username?: string
  email?: string
  first_name?: string
  last_name?: string
}

export type CollectionListItem = {
  id: number
  name: string
  description: string
  is_public: boolean
  created_at: string
  recipe_count: number
  cover_image_url: string | null
  recipe_cover_urls: (string | null)[]
  contains_recipe: boolean
}

export type CollectionEntry = {
  added_at: string
  is_available: boolean
  recipe_id?: number
  recipe: Recipe | null
}

export type CollectionDetail = {
  id: number
  name: string
  description: string
  is_public: boolean
  created_at: string
  entries: CollectionEntry[]
}

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** DRF list responses are sometimes a raw array (non-paginated) */
export type ListOrPaginated<T> = T[] | PaginatedResponse<T>

export type LikeToggleResponse = {
  liked: boolean
  like_count: number
}

export type SocialLoginResponse = {
  key: string
}

export type ApiErrorBody = {
  detail?: string | Record<string, unknown> | unknown[]
  non_field_errors?: string[]
  [key: string]: unknown
}

/** Payload for creating/updating recipes (subset used by forms) */
export type RecipeWritePayload = {
  title?: string
  description?: string
  recipe_instructions?: Array<
    Omit<RecipeInstruction, "id"> & { id?: number | string }
  >
  prep_time?: number | string | null
  cook_time?: number | string | null
  servings?: number | string | null
  tags?: Array<number | null | undefined>
  recipe_ingredients?: Array<{
    ingredient: number
    quantity: number | string
    unit: string
  }>
  is_public?: boolean
}

export type RecipeMutationResult =
  | { data: Recipe; error?: never }
  | { error: string; data?: never }

export type DeleteRecipeResult =
  | { data: true; error?: never }
  | { error: string; data?: never }

export type TagCreatePayload = {
  name: string
}

export type IngredientCreatePayload = {
  name: string
}
