import { getAuthHeaders } from "@/api/auth"
import { apiFetch } from "@/api/client"
import type { Ingredient, IngredientCreatePayload } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const fetchIngredients = async (): Promise<Ingredient[]> => {
  const response = await apiFetch(`${API_URL}/ingredients/`)
  if (!response.ok) {
    throw new Error("Failed to fetch ingredients")
  }
  return (await response.json()) as Ingredient[]
}

export const createIngredient = async (
  ingredientData: IngredientCreatePayload,
): Promise<Ingredient> => {
  const response = await apiFetch(`${API_URL}/ingredients/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(ingredientData),
  })
  const responseData = (await response.json()) as Ingredient & { detail?: string }

  if (!response.ok) {
    console.error("API Error Response:", responseData)
    throw new Error(responseData.detail || JSON.stringify(responseData))
  }

  return responseData
}
