export default function RecipeListItem({ recipe, isSelected, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`flex w-full hover:bg-neutral-600 bg-neutral-700 break-words whitespace-pre-wrap cursor-pointer items-center border-b-4 pt-2 pb-1 pr-4 transition-all ${
        isSelected
          ? "box-border border-white text-red-300"
          : "border-transparent"
      }`}
    >
      <div
        className={`flex h-full items-center justify-center transition-all ${isSelected ? "px-4" : "px-2"}`}
      >
        <span
          className={`rounded-full bg-red-300 transition-all ${isSelected ? "h-4 w-4 opacity-100" : "h-0 w-0 opacity-0"}`}
        />
      </div>
      <h2 className="flex-1 break-words whitespace-pre-wrap min-w-0">
        {recipe.title}
      </h2>
    </div>
  );
}
