import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchTags } from "@/api/tags"
import { queryKeys } from "@/lib/queryKeys"
import PublicPageClient from "@/app/PublicPageClient"

export default async function HomePage() {
  const queryClient = new QueryClient()

  try {
    /** Do not prefetch public recipe lists here: the server has no auth token, so is_liked is always false and would hydrate the wrong viewer state for logged-in users. */
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tags.list(),
      queryFn: fetchTags,
    })
  } catch {
    /* client-side Query will fetch */
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PublicPageClient />
    </HydrationBoundary>
  )
}
