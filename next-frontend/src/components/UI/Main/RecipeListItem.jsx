export default function RecipeListItem({ recipe, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`flex w-full box-content hover:bg-neutral-600 bg-neutral-700 break-words whitespace-pre-wrap cursor-pointer py-2 items-center justify-center border-b-4 pr-4 transition-all ${
        isSelected ? " border-neutral-100 text-red-300" : "border-neutral-800"
      }`}
    >
      {recipe.cover_image_url && (
        <img
          src={recipe.cover_image_url}
          alt=""
          className="h-16 w-16 flex-shrink-0 object-cover lg:h-20 lg:w-20"
        />
      )}
      <div
        className={`flex h-full items-center justify-center transition-all ${isSelected ? "px-4" : "px-2"}`}
      >
        <span
          className={`rounded-full bg-red-300 transition-all ${isSelected ? "h-4 w-4 opacity-100" : "h-0 w-0 opacity-0"}`}
        />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 text-3xl break-words whitespace-pre-wrap">
          {recipe.title}
        </h2>
        <span
          className="flex shrink-0 items-center gap-1 text-lg text-neutral-400 tabular-nums"
          title="Hearts"
        >
          <span aria-hidden className="text-red-400">
            ♥
          </span>
          {recipe.heart_count ?? 0}
        </span>
      </div>
    </div>
  );
}
