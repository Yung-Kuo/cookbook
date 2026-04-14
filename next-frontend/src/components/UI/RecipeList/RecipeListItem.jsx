import { useAuth } from "@/context/AuthContext";

export default function RecipeListItem({ recipe, isSelected, onSelect }) {
  const { isAuthenticated } = useAuth();
  const showLikedCorner = isAuthenticated && recipe.is_liked === true;

  return (
    <div
      onClick={onSelect}
      className={`relative flex w-full cursor-pointer items-center justify-center overflow-hidden border-b-4 bg-neutral-700 py-1 pt-2 pr-4 break-words whitespace-pre-wrap transition-all hover:bg-neutral-600 ${
        isSelected ? "border-neutral-100 text-red-300" : "border-transparent"
      }`}
    >
      {showLikedCorner && (
        <span
          className="pointer-events-none absolute top-0 right-0 h-6 w-6 rounded-bl-full bg-red-400"
          aria-label="You liked this recipe"
          title="Liked"
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
