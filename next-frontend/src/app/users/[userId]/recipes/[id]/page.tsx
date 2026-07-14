import RecipeDetailPageClient from "@/app/users/[userId]/recipes/[id]/RecipeDetailPageClient"

export default function RecipeDetailPage() {
  // Recipe detail includes viewer-specific visibility and like/pin state.
  // The server has no browser auth token, so fetch after client auth resolves.
  return <RecipeDetailPageClient />
}
