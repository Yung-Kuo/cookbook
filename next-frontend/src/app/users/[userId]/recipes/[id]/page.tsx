import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchProfileByUserId } from "@/api/profiles"
import { queryKeys } from "@/lib/queryKeys"
import RecipeDetailPageClient from "@/app/users/[userId]/recipes/[id]/RecipeDetailPageClient"

type RecipeDetailPageProps = {
  params: Promise<{ userId: string; id: string }>
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { userId, id } = await params
  const recipeId = Array.isArray(id) ? id[0] : id
  const uidRaw = Array.isArray(userId) ? userId[0] : userId
  const queryClient = new QueryClient()

  if (recipeId) {
    const tasks: Promise<unknown>[] = []
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
      // Recipe detail includes viewer-specific flags; the server has no auth token.
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
