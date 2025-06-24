import { useMemo } from "react";

function Recipe({ selectedRecipe }) {
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
      className={`h-full w-3/5 overflow-scroll bg-neutral-900 p-5`}
      //   ${selectedRecipe ? "opacity-100" : "opacity-0"}
    >
      <div className="flex flex-col gap-5">
        <h1 className="">{selectedRecipe.title}</h1>
        {/* category */}
        {selectedRecipe.category && (
          <div className="flex justify-end">
            <div className="rounded-full bg-neutral-700 px-4 py-1">
              <h6 className="text-xl">{selectedRecipe.category.name}</h6>
            </div>
          </div>
        )}
        {/* description */}
        {selectedRecipe.description && <h4>{selectedRecipe.description}</h4>}
        {/* servings */}
        {selectedRecipe.servings && (
          <div className="flex justify-end">
            <h4 className="mt-20 text-neutral-500">
              {selectedRecipe.servings} servings
            </h4>
          </div>
        )}
        {/* ingredients */}
        {selectedRecipe.recipe_ingredients && (
          <div className="border-t border-neutral-500 py-10">
            {/* <h2 className="text-6xl">Ingredients</h2> */}
            <div className="flex w-min min-w-2/3 flex-col gap-4">
              {selectedRecipe.recipe_ingredients.map((ingredient) => (
                <div key={ingredient.id} className="flex justify-between">
                  <h4 className="w-1/3">{ingredient.name}</h4>
                  <h4 className="flex w-1/3 gap-2">
                    {ingredient.quantity}
                    <span className="text-neutral-500">{ingredient.unit}</span>
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* instructions */}
        {selectedRecipe.recipe_instructions && (
          <div className="flex flex-col gap-4 border-t border-neutral-500 py-10">
            {selectedRecipe.recipe_instructions.map((instruction) => (
              <div className="flex">
                <h4 className="flex w-1/6 text-neutral-500">
                  {instruction.order}
                </h4>
                <h4 className="w-5/6">{instruction.text}</h4>
              </div>
            ))}
          </div>
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
            <h6 className="flex gap-2 text-xl text-neutral-500">
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
            <h6 className="flex gap-2 text-xl text-neutral-500">
              Last updated:
              <span className="text-xl text-neutral-100">
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
