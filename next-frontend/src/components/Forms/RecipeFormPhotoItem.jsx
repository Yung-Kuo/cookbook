export default function RecipeFormPhotoItem({
  src,
  isCover,
  onMakeCover,
  onRemove,
}) {
  return (
    <div className="relative flex h-32 w-32 flex-shrink-0 flex-col overflow-hidden rounded-md border-2 border-neutral-600">
      {src && (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
        />
      )}
      {isCover && (
        <span className="absolute top-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-neutral-900">
          Cover
        </span>
      )}
      <div className="absolute right-0 bottom-0 left-0 flex gap-1 bg-black/60 p-1">
        <button
          type="button"
          onClick={onMakeCover}
          className="flex-1 cursor-pointer rounded px-1 text-xs text-neutral-100 hover:bg-neutral-700"
        >
          Cover
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded px-1 text-xs text-red-300 hover:bg-red-900/80"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
