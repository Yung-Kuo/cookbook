export default function Loading() {
  return (
    <div className="flex h-full flex-col gap-6 bg-neutral-900 p-6 lg:p-10">
      <div className="h-64 w-full animate-pulse rounded-lg bg-neutral-800" />
      <div className="h-12 w-3/4 max-w-lg animate-pulse rounded bg-neutral-800" />
      <div className="h-4 w-full max-w-2xl animate-pulse rounded bg-neutral-800/80" />
    </div>
  )
}
