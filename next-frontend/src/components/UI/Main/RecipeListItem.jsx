export default function RecipeListItem({ recipe, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`relative flex w-full box-content hover:bg-neutral-600 bg-neutral-700 break-words whitespace-pre-wrap cursor-pointer py-2 items-center justify-center border-b-4 pr-4 transition-all ${
        isSelected ? " border-neutral-100 text-red-300" : "border-neutral-800"
      }`}
    >
      {recipe.is_liked && (
        <span
          className="pointer-events-none absolute top-2 right-2 z-10 h-2.5 w-2.5 rounded-full bg-red-400 ring-2 ring-neutral-700"
          aria-label="You liked this recipe"
          title="Liked"
        />
      )}
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
      <h2 className="min-w-0 flex-1 text-3xl break-words whitespace-pre-wrap">
        {recipe.title}
      </h2>
    </div>
  );
}
