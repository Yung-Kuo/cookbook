import CollectionDetailPageClient from "@/app/users/[userId]/collections/[collectionId]/CollectionDetailPageClient"

export default function CollectionDetailPage() {
  // Collection contents depend on the viewer's access to private recipes.
  // The server has no browser auth token, so the client performs this fetch.
  return <CollectionDetailPageClient />
}
