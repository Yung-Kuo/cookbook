import type { ListOrPaginated, Recipe } from "@/types"

export const getRecipesFromListData = (
  data: ListOrPaginated<Recipe> | undefined,
): Recipe[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  return data.results ?? []
}

export const mapRecipeListData = (
  data: ListOrPaginated<Recipe> | undefined,
  fn: (recipes: Recipe[]) => Recipe[],
): ListOrPaginated<Recipe> | undefined => {
  if (!data) return data
  if (Array.isArray(data)) return fn(data)
  return { ...data, results: fn(data.results) }
}
