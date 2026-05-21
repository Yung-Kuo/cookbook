import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type {
  ApiErrorBody,
  DeleteRecipeResult,
  ListOrPaginated,
  Recipe,
  RecipeMutationResult,
  RecipeWritePayload,
} from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export type RecipeListParams = Record<string, unknown> & {
  tags?: number[] | string | null
}

/** Builds query string; repeats `tags` so the API ANDs them (recipes must match every tag). */
export const recipeListQueryString = (
  params: RecipeListParams = {},
): string => {
  const { tags, ...rest } = params
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(rest)) {
    if (value == null || value === "") continue
    sp.set(key, String(value))
  }
  if (Array.isArray(tags)) {
    tags.forEach((id) => {
      if (id != null && `${id}` !== "") sp.append("tags", String(id))
    })
  } else if (tags != null && tags !== "") {
    sp.append("tags", String(tags))
  }
  return sp.toString()
}

export const fetchRecipesData = async (
  params: RecipeListParams = {},
): Promise<ListOrPaginated<Recipe>> => {
  const query = recipeListQueryString(params)
  const url = query ? `${API_URL}/recipes/?${query}` : `${API_URL}/recipes/`
  const response = await apiFetch(url, {
    headers: { ...getAuthHeaders() },
  })
  if (!response.ok) {
    throw new Error("Network response was not ok")
  }
  return (await response.json()) as ListOrPaginated<Recipe>
}

export const fetchRecipes = async (
  setRecipes: (data: ListOrPaginated<Recipe>) => void,
  params: RecipeListParams = {},
): Promise<void> => {
  try {
    const data = await fetchRecipesData(params)
    setRecipes(data)
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

export const fetchPersonalRecipesData = async (
  params: RecipeListParams = {},
): Promise<ListOrPaginated<Recipe>> => {
  return fetchRecipesData({ personal: "true", ...params })
}

export const fetchPersonalRecipes = async (
  setRecipes: (data: ListOrPaginated<Recipe>) => void,
  params: RecipeListParams = {},
): Promise<void> => {
  try {
    const data = await fetchPersonalRecipesData(params)
    setRecipes(data)
  } catch (error) {
    console.error("Error fetching personal recipes:", error)
  }
}

/** Returns current user's recipes (for pin picker, etc.) */
export const fetchPersonalRecipesList = async (
  params: RecipeListParams = {},
): Promise<ListOrPaginated<Recipe>> => {
  return fetchPersonalRecipesData(params)
}

export const fetchUserRecipesData = async (
  userId: string | number,
  params: RecipeListParams = {},
): Promise<ListOrPaginated<Recipe>> => {
  return fetchRecipesData({
    owner_id: String(userId),
    ...params,
  })
}

export const fetchUserRecipes = async (
  userId: string | number,
  setRecipes: (data: ListOrPaginated<Recipe>) => void,
  params: RecipeListParams = {},
): Promise<void> => {
  try {
    const data = await fetchUserRecipesData(userId, params)
    setRecipes(data)
  } catch (error) {
    console.error("Error fetching user recipes:", error)
  }
}

export const fetchLikedRecipesData = async (
  params: RecipeListParams = {},
): Promise<ListOrPaginated<Recipe>> => {
  return fetchRecipesData({ liked: "true", ...params })
}

export const fetchLikedRecipes = async (
  setRecipes: (data: ListOrPaginated<Recipe>) => void,
  params: RecipeListParams = {},
): Promise<void> => {
  try {
    const data = await fetchLikedRecipesData(params)
    setRecipes(data)
  } catch (error) {
    console.error("Error fetching liked recipes:", error)
  }
}

export const fetchRecipeById = async (id: string | number): Promise<Recipe> => {
  const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
    headers: { ...getAuthHeaders() },
  })
  if (!response.ok) {
    const detail =
      response.status === 404
        ? "Recipe not found (or not visible without login)."
        : `Failed to fetch recipe (${response.status})`
    throw new Error(detail)
  }
  return (await response.json()) as Recipe
}

const buildRecipeBody = (recipeData: RecipeWritePayload) => ({
  body: JSON.stringify(recipeData),
  headers: { "Content-Type": "application/json", ...getAuthHeaders() },
})

export const createRecipe = async (
  recipeData: RecipeWritePayload,
): Promise<RecipeMutationResult> => {
  try {
    const { body, headers } = buildRecipeBody(recipeData)
    const response = await apiFetch(`${API_URL}/recipes/`, {
      method: "POST",
      headers,
      body,
    })

    const responseData = (await response.json()) as ApiErrorBody & Partial<Recipe>

    if (!response.ok) {
      console.error("API Error Response:", responseData)
      throw new Error(
        typeof responseData.detail === "string"
          ? responseData.detail
          : JSON.stringify(responseData),
      )
    }

    return { data: responseData as Recipe }
  } catch (error) {
    console.error("Error creating recipe:", error)
    const message = error instanceof Error ? error.message : String(error)
    return { error: message }
  }
}

export const updateRecipe = async (
  id: string | number,
  recipeData: RecipeWritePayload,
): Promise<RecipeMutationResult> => {
  try {
    const { body, headers } = buildRecipeBody(recipeData)
    const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
      method: "PUT",
      headers,
      body,
    })

    const responseData = (await response.json()) as ApiErrorBody & Partial<Recipe>

    if (!response.ok) {
      console.error("API Error Response:", responseData)
      throw new Error(
        typeof responseData.detail === "string"
          ? responseData.detail
          : JSON.stringify(responseData),
      )
    }

    return { data: responseData as Recipe }
  } catch (error) {
    console.error("Error updating recipe:", error)
    const message = error instanceof Error ? error.message : String(error)
    return { error: message }
  }
}

export const deleteRecipe = async (
  id: string | number,
): Promise<DeleteRecipeResult> => {
  try {
    const response = await apiFetch(`${API_URL}/recipes/${id}/`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    })
    if (!response.ok) {
      let message = "Failed to delete recipe"
      try {
        const responseData = (await response.json()) as ApiErrorBody
        message =
          typeof responseData.detail === "string"
            ? responseData.detail
            : JSON.stringify(responseData)
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }
    return { data: true }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    const message = error instanceof Error ? error.message : String(error)
    return { error: message }
  }
}
