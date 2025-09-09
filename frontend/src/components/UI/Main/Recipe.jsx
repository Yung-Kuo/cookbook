import { useMemo } from "react";
import { CloseButton } from "../Buttons/CloseButton";

function Recipe({ selectedRecipe, onClose, className }) {
  // Calculate dates once and memoize them to avoid recalculation on every render
  const { createdDate, updatedDate, isUpdated } = useMemo(() => {
    if (!selectedRecipe) {
      return { createdDate: null, updatedDate: null, isUpdated: false };
    }

    const createdDate = new Date(selectedRecipe.created_at);
    const updatedDate = selectedRecipe.updated_at
      ? new Date(selectedRecipe.updated_at)
      : null;

    const isUpdated =
      updatedDate && updatedDate.getTime() !== createdDate.getTime();

    return { createdDate, updatedDate, isUpdated };
  }, [selectedRecipe]);

  return (
    <div
      className={`${className} overflow-scroll bg-neutral-900 p-5 pb-40`}
      //   ${selectedRecipe ? "opacity-100" : "opacity-0"}
    >
      {/* Close Button */}
      <CloseButton onClose={onClose} />
      <div className="flex flex-col gap-5 text-xl lg:text-2xl">
        <h1 className="text-6xl break-words whitespace-pre-wrap lg:text-8xl">
          {selectedRecipe.title}
        </h1>
        {/* category */}
        {selectedRecipe.category && (
          <div className="flex justify-end">
            <div className="rounded-full bg-neutral-700 px-4 py-1">
              <h6>{selectedRecipe.category.name}</h6>
            </div>
          </div>
        )}
        {/* description */}
        {selectedRecipe.description && <h4>{selectedRecipe.description}</h4>}
        {/* ingredients */}
        {selectedRecipe.recipe_ingredients && (
          <div className="mt-20 flex flex-col gap-2">
            <div className="flex justify-between">
              <h2 className="text-3xl lg:text-4xl">Ingredients</h2>
              {/* servings */}
              {selectedRecipe.servings && (
                <h4 className="flex items-end text-neutral-500">
                  {selectedRecipe.servings} servings
                </h4>
              )}
            </div>
            <div className="border-t border-neutral-500 py-10">
              <div className="flex w-full flex-col gap-4 md:w-max md:min-w-2/3">
                {selectedRecipe.recipe_ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex h-max justify-between gap-2"
                  >
                    <h4 className="w-max">{ingredient.name}</h4>
                    <div className="flex grow items-center border-b border-dotted border-neutral-500" />
                    <h4 className="flex w-1/3 items-center gap-2">
                      {ingredient.quantity}
                      <span className="text-neutral-500">
                        {ingredient.unit}
                      </span>
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* instructions */}
        {selectedRecipe.recipe_instructions && (
          <div className="flex flex-col gap-4 border-t border-neutral-500 py-10">
            {selectedRecipe.recipe_instructions.map((instruction) => (
              <div key={instruction.id} className="flex">
                <h4 className="flex w-1/6 text-neutral-500">
                  {instruction.order}
                </h4>
                <h4 className="w-5/6">{instruction.text}</h4>
              </div>
            ))}
          </div>
        )}
        {/* prep time */}
        {selectedRecipe.prep_time && (
          <h4 className="flex gap-2 text-neutral-500">
            Prep Time:
            <span className="text-neutral-100">{selectedRecipe.prep_time}</span>
            minutes
          </h4>
        )}
        {/* cook time */}
        {selectedRecipe.cook_time && (
          <h4 className="flex gap-2 text-neutral-500">
            Cook Time:
            <span className="text-neutral-100">{selectedRecipe.cook_time}</span>
            minutes
          </h4>
        )}
        {/* createdDate & updatedDate */}
        <div className="mt-20 flex flex-col items-end">
          {/* created */}
          {createdDate && (
            <h6 className="flex gap-2 text-neutral-500">
              Created at:
              <span className="text-neutral-100">
                {createdDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  // hour: "2-digit",
                  // minute: "2-digit",
                })}
              </span>
            </h6>
          )}
          {/* updated */}
          {updatedDate && isUpdated && (
            <h6 className="flex gap-2 text-neutral-500">
              Last updated:
              <span className="text-neutral-100">
                {updatedDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  // hour: "2-digit",
                  // minute: "2-digit",
                })}
              </span>
            </h6>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recipe;
