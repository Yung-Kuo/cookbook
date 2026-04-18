import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { fetchCollectionById } from "@/api/collections"
import { queryKeys } from "@/lib/queryKeys"
import CollectionDetailPageClient from "@/app/users/[userId]/collections/[collectionId]/CollectionDetailPageClient"

export default async function CollectionDetailPage({ params }) {
  const { collectionId } = await params
  const cid = Array.isArray(collectionId) ? collectionId[0] : collectionId
  const queryClient = new QueryClient()

  if (cid) {
    try {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.collections.detail(cid),
        queryFn: () => fetchCollectionById(cid),
      })
    } catch {
      /* client handles missing collection */
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CollectionDetailPageClient />
    </HydrationBoundary>
  )
}
