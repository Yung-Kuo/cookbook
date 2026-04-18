import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchRecipeById } from "@/api/recipes"
import { fetchProfileByUserId } from "@/api/profiles"
import { queryKeys } from "@/lib/queryKeys"
import RecipeDetailPageClient from "@/app/users/[userId]/recipes/[id]/RecipeDetailPageClient"

export default async function RecipeDetailPage({ params }) {
  const { userId, id } = await params
  const recipeId = Array.isArray(id) ? id[0] : id
  const uidRaw = Array.isArray(userId) ? userId[0] : userId
  const queryClient = new QueryClient()

  if (recipeId) {
    const tasks = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.recipes.detail(recipeId),
        queryFn: () => fetchRecipeById(recipeId),
      }),
    ]
    const uidNum = Number(uidRaw)
    if (Number.isFinite(uidNum)) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.profiles.byUserId(uidNum),
          queryFn: () => fetchProfileByUserId(uidRaw),
        }),
      )
    }
    try {
      await Promise.all(tasks)
    } catch {
      /* client will retry / show error */
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeDetailPageClient />
    </HydrationBoundary>
  )
}
