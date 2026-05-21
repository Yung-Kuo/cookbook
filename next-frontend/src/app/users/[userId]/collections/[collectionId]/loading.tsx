export default function Loading() {
  return (
    <div className="flex h-full flex-col gap-6 bg-neutral-800 p-6 lg:pt-14">
      <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-700" />
      <div className="h-10 w-2/3 max-w-md animate-pulse rounded bg-neutral-700/80" />
    </div>
  )
}
