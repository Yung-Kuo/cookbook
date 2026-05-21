export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-800 p-8">
      <div className="h-10 w-48 animate-pulse rounded bg-neutral-700/80" />
      <div className="h-6 w-32 animate-pulse rounded bg-neutral-700/60" />
    </div>
  )
}
