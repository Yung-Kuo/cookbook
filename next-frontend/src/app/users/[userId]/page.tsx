import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchProfileByUserId } from "@/api/profiles"
import { queryKeys } from "@/lib/queryKeys"
import UserProfilePageClient from "@/app/users/[userId]/UserProfilePageClient"

type UserProfilePageProps = {
  params: Promise<{ userId: string }>
}

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
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
