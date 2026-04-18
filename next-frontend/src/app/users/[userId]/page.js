import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchProfileByUserId } from "@/api/profiles"
import { queryKeys } from "@/lib/queryKeys"
import UserProfilePageClient from "@/app/users/[userId]/UserProfilePageClient"

export default async function UserProfilePage({ params }) {
  const { userId } = await params
  const numericId = Number(userId)

  const queryClient = new QueryClient()

  if (Number.isFinite(numericId)) {
    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.profiles.byUserId(numericId),
        queryFn: () => fetchProfileByUserId(numericId),
      })
    } catch {
      /* client refetch */
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserProfilePageClient />
    </HydrationBoundary>
  )
}
