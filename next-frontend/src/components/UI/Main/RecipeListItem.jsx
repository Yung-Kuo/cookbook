export default function RecipeListItem({ recipe, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`flex w-full box-content hover:bg-neutral-600 bg-neutral-700 break-words whitespace-pre-wrap cursor-pointer py-2 items-center justify-center border-b-4 pr-4 transition-all ${
        isSelected ? " border-neutral-100 text-red-300" : "border-neutral-800"
      }`}
    >
      {recipe.image_url && (
        <img
          src={recipe.image_url}
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
      <h2 className="flex-1 text-3xl break-words whitespace-pre-wrap min-w-0">
        {recipe.title}
      </h2>
    </div>
  );
}
