function Recipe({ selectedRecipe }) {
  return (
    <div
      className={`h-full w-3/5 overflow-scroll bg-neutral-900 p-5`}
      //   ${selectedRecipe ? "opacity-100" : "opacity-0"}
    >
      <div>
        <h1 className="">{selectedRecipe.title}</h1>
        {/* category */}
        {selectedRecipe.category && (
          <div className="flex justify-end pb-10">
            <div className="rounded-full bg-neutral-700 px-4 py-1">
              <h6 className="text-xl">{selectedRecipe.category.name}</h6>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-10">
          {/* Description */}
          {selectedRecipe.description && (
            <div>
              {/* <h2 className="text-6xl">Description</h2> */}
              <h4>{selectedRecipe.description}</h4>
            </div>
          )}
          {/* ingredients */}
          {selectedRecipe.recipe_ingredients && (
            <div className="border-t border-neutral-500 py-10">
              {/* <h2 className="text-6xl">Ingredients</h2> */}
              <div className="flex w-min min-w-2/3 flex-col gap-4">
                {selectedRecipe.recipe_ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="flex justify-between">
                    <h4>{ingredient.name}</h4>
                    <div className="flex gap-2">
                      <h4>{ingredient.quantity}</h4>
                      <h4>{ingredient.unit}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* instructions */}
          {selectedRecipe.instructions && (
            <div className="border-t border-neutral-500 py-10">
              {/* <h2 className="text-6xl">Instructions</h2> */}
              <h4>{selectedRecipe.instructions}</h4>
            </div>
          )}
          <h4>{selectedRecipe.cook_time}</h4>
          <h4>{selectedRecipe.servings}</h4>
          <h4>{selectedRecipe.created_at}</h4>
          <h4>{selectedRecipe.updated_at}</h4>
        </div>
      </div>
    </div>
  );
}

export default Recipe;
