// src/components/RecipeCreateForm.jsx
import React, { useState, useEffect } from "react";
import { createRecipe } from "../../api/recipes";
import { fetchCategories, createCategory } from "../../api/categories";
import { fetchIngredients, createIngredient } from "../../api/ingredients";
import AddButton from "../UI/Buttons/AddButton";
import DeleteButton from "../UI/Buttons/DeleteButton";
import ComboboxCreate from "../UI/HeadlessUI/ComboboxCreatable";

// Assuming you have API functions to fetch categories and ingredients
// import { fetchCategories, fetchIngredients } from "../api";

let nextIngredientId = 0;

function RecipeCreateForm({ onClose, onRecipeCreated }) {
  // ----------------------------------------------------
  // 1. Component State to hold form data
  //    Matches the structure expected by RecipeWriteSerializer
  // ----------------------------------------------------
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // instructions: "",
    recipe_instructions: [
      {
        id: crypto.randomUUID(),
        text: "",
        order: 1,
      },
    ],
    prep_time: "", // Changed from null to empty string
    cook_time: "", // Changed from null to empty string
    servings: "", // Changed from null to empty string
    category: "", // Will hold the ID of the selected category
    recipe_ingredients: [
      {
        id: crypto.randomUUID(),
        ingredient: "", // This should be an ingredient ID
        quantity: "", // Changed from measurement to quantity
        unit: "",
      },
    ], // Array to hold nested ingredient data
  });

  const clearForm = () => {
    setFormData({
      title: "",
      description: "",
      // instructions: "",
      recipe_instructions: [
        {
          id: crypto.randomUUID(),
          text: "",
          order: 1,
        },
      ],
      prep_time: "", // Changed from null to empty string
      cook_time: "", // Changed from null to empty string
      servings: "", // Changed from null to empty string
      category: "", // Will hold the ID of the selected category
      recipe_ingredients: [
        {
          id: crypto.randomUUID(),
          ingredient: "", // This should be an ingredient ID
          quantity: "", // Changed from measurement to quantity
          unit: "",
        },
      ], // Array to hold nested ingredient data
    });
  };

  // ----------------------------------------------------
  // 2. State for dropdown data (Categories, Ingredients)
  //    These will be fetched from your API
  // ----------------------------------------------------
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const units = [
    { id: 0, name: "g" },
    { id: 1, name: "kg" },
    { id: 2, name: "ml" },
    { id: 3, name: "l" },
    { id: 4, name: "tsp" },
    { id: 5, name: "tbsp" },
    { id: 6, name: "cup" },
    { id: 7, name: "clove" },
    { id: 8, name: "stalk" },
    { id: 9, name: "piece" },
    { id: 10, name: "unit" },
    { id: 11, name: "to taste" },
  ];
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownError, setDropdownError] = useState(null);

  // ----------------------------------------------------
  // 3. useEffect to fetch dropdown data on component mount
  // ----------------------------------------------------
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const fetchedCategories = await fetchCategories();
        setCategories(fetchedCategories);

        const fetchedIngredients = await fetchIngredients();
        setIngredients(fetchedIngredients);
      } catch (err) {
        setDropdownError("Failed to load categories or ingredients.");
        console.error("Error loading dropdown data:", err);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []); // Run once on mount

  // ----------------------------------------------------
  // 4. Handle input changes (for text/number fields)
  // ----------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // ----------------------------------------------------
  // Handle category changes
  // ----------------------------------------------------
  const handleCategoryChange = (value) => {
    console.log("handleCategoryChange: ", value);
    setFormData((prevData) => ({
      ...prevData,
      category: value,
    }));
  };

  // ----------------------------------------------------
  // 5. Handle adding a new row for RecipeIngredient
  // ----------------------------------------------------
  const addIngredient = () => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: [
        ...prevData.recipe_ingredients,
        {
          // id: ++nextIngredientId,
          id: crypto.randomUUID(),
          ingredient: "",
          quantity: "",
          unit: "",
        },
      ],
    }));
  };

  // ----------------------------------------------------
  // 6. Handle changes to existing RecipeIngredient rows
  // ----------------------------------------------------
  const handleIngredientChange = (value, name, id) => {
    console.log("handleIngredientChange: ", value);
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: prevData.recipe_ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [name]: value } : ingredient,
      ),
    }));
  };

  // ----------------------------------------------------
  // 7. Handle removing a RecipeIngredient row
  // ----------------------------------------------------
  const removeIngredient = (id) => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: prevData.recipe_ingredients.filter(
        (ingredient) => ingredient.id !== id,
      ),
    }));
  };

  // ----------------------------------------------------
  // 8. Handle adding a new row for RecipeInstruction
  // ----------------------------------------------------
  const addInstruction = () => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: [
        ...prevData.recipe_instructions,
        {
          // id: ++nextIngredientId,
          id: crypto.randomUUID(),
          text: "",
          order: prevData.recipe_instructions.length + 1,
        },
      ],
    }));
  };
  // ----------------------------------------------------
  // 9. Handle changes to existing RecipeInstruction rows
  // ----------------------------------------------------
  const handleInstructionChange = (e, id) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: prevData.recipe_instructions.map((instruction) =>
        instruction.id === id ? { ...instruction, [name]: value } : instruction,
      ),
    }));
  };
  // ----------------------------------------------------
  // 10. Handle removing a RecipeInstruction row
  // ----------------------------------------------------
  const removeInstruction = (id) => {
    const delete_instruction = formData.recipe_instructions.filter(
      (instruction) => instruction.id == id,
    );
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: prevData.recipe_instructions.filter(
        (instruction) => instruction.id !== id,
      ),
    }));

    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: prevData.recipe_instructions.map((instruction) =>
        instruction.order > delete_instruction[0].order
          ? { ...instruction, order: instruction.order - 1 }
          : instruction,
      ),
    }));
  };

  // ----------------------------------------------------
  // 10. Handle form submission
  // ----------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Handle category creation
    let category = formData.category;
    if (!category.id) {
      try {
        category = await createCategory({ name: category.name });
        if (category) {
          setCategories([...categories, category]);
        }
      } catch (error) {
        console.error("Failed to create category:", error);
        return;
      }
    }

    // 2. Handle ingredient creation
    let recipe_ingredients = [...formData.recipe_ingredients];
    const ingredientsToCreate = recipe_ingredients.filter(
      (ri) => !ri.ingredient.id,
    );
    if (ingredientsToCreate.length > 0) {
      try {
        const createdIngredients = await Promise.all(
          ingredientsToCreate.map((ri) =>
            createIngredient({ name: ri.ingredient.name }),
          ),
        );
        const nameToIngredient = {};
        createdIngredients.forEach((ingredient) => {
          nameToIngredient[ingredient.name] = ingredient;
        });
        recipe_ingredients = recipe_ingredients.map((ri) => {
          if (!ri.ingredient.id && nameToIngredient[ri.ingredient.name]) {
            return { ...ri, ingredient: nameToIngredient[ri.ingredient.name] };
          }
          return ri;
        });
      } catch (error) {
        console.error("Failed to create one or more ingredients:", error);
        return;
      }
    }

    // 3. Build submissionData using local variables
    const submissionData = {
      ...formData,
      prep_time: formData.prep_time === "" ? null : Number(formData.prep_time),
      cook_time: formData.cook_time === "" ? null : Number(formData.cook_time),
      servings: formData.servings === "" ? null : Number(formData.servings),
      recipe_instructions: formData.recipe_instructions.map((ins) => ({
        ...ins,
        text: ins.text.trim(),
      })),
      recipe_ingredients: recipe_ingredients
        .filter((ing) => ing.ingredient && ing.quantity && ing.unit)
        .map((ing) => ({
          ingredient: ing.ingredient.id,
          quantity: Number(ing.quantity),
          unit: ing.unit.name,
        })),
      category: category.id,
    };

    // Log the exact data being sent
    console.log(
      "Form data before submission:",
      JSON.stringify(submissionData, null, 2),
    );
    // Check if any recipe instruction text is empty
    const hasEmptyInstruction = submissionData.recipe_instructions.some(
      (ins) => !ins.text || ins.text.trim() === "",
    );
    if (hasEmptyInstruction) {
      console.error("All instruction steps must have non-empty text.");
      return;
    }

    // Validate required fields
    if (!submissionData.title) {
      console.error("Missing title");
      return;
    }

    // Validate recipe ingredients
    if (submissionData.recipe_ingredients.length === 0) {
      console.error(
        "At least one ingredient is required with all fields filled",
      );
      return;
    }

    try {
      const { data, error } = await createRecipe(submissionData);
      if (data) {
        onRecipeCreated(data);
        clearForm();
      }
      if (error) {
        console.error("Error creating recipe:", error);
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Error creating recipe:", err);
    }
  };

  // ----------------------------------------------------
  // 9. Rendering the form
  // ----------------------------------------------------
  //   if (loadingDropdowns) {
  //     return <div className="text-white">Loading form data...</div>;
  //   }

  //   if (dropdownError) {
  //     return <div className="text-red-500">{dropdownError}</div>;
  //   }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col gap-8 overflow-y-auto p-5 py-20 text-2xl text-neutral-100 shadow-xl lg:gap-10 lg:p-10 lg:py-10 lg:text-4xl"
    >
      <h2 className="mb-6 text-3xl font-bold lg:text-5xl">Create New Recipe</h2>

      {/* Recipe title */}
      <div className="mb-6 flex w-full gap-4">
        <label
          htmlFor="title"
          className="font-medium whitespace-nowrap text-neutral-500"
        >
          Title :
        </label>
        <div className="grow">
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border-b-2 border-neutral-500 text-neutral-100 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="font-medium text-neutral-500">
          Description
        </label>
        <div className="grid grid-cols-1 grid-rows-1">
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="z-10 col-start-1 row-start-1 mt-2 w-full resize-none rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          ></textarea>
          <span className="invisible col-start-1 row-start-1 mt-2 border-2 border-transparent p-2 text-2xl whitespace-pre-wrap">
            {formData.description}{" "}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-4">
        <label htmlFor="instructions" className="font-medium text-neutral-500">
          Instructions
        </label>
        <div className="flex flex-col gap-4">
          {formData.recipe_instructions.map((recipe_instruction) => (
            <div
              key={recipe_instruction.id}
              className="flex items-center gap-4"
            >
              <h4 className="flex gap-2">
                <span className="hidden lg:flex">Step</span>{" "}
                <span>{recipe_instruction.order}</span>
              </h4>
              <div className="grid w-full grid-cols-1 grid-rows-1">
                <textarea
                  id={`instruction-${recipe_instruction.id}`}
                  name="text"
                  value={recipe_instruction.text}
                  onChange={(e) =>
                    handleInstructionChange(e, recipe_instruction.id)
                  }
                  rows="1"
                  className="z-10 col-start-1 row-start-1 w-full resize-none rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                  required
                />
                <span className="invisible col-start-1 row-start-1 border-2 border-transparent p-2 text-2xl whitespace-pre-wrap">
                  {recipe_instruction.text}{" "}
                </span>
              </div>

              <DeleteButton
                onClick={() => removeInstruction(recipe_instruction.id)}
              />
            </div>
          ))}
        </div>

        <AddButton
          onClick={addInstruction}
          parentClassName="h-10 w-10"
          className="bg-amber-500 text-neutral-800 hover:bg-amber-600"
        />
      </div>

      {/* Ingredient List */}
      <div className="flex flex-col gap-4">
        <h3 className="font-medium text-neutral-500">Ingredient List</h3>
        <div className="flex flex-col">
          {formData.recipe_ingredients.map((recipe_ingredient) => (
            <div
              key={recipe_ingredient.id}
              className="flex items-center gap-4 border-dotted border-neutral-600 not-first:border-t-2 not-first:pt-2 not-last:pb-2 lg:border-none lg:pt-0 lg:pb-0"
            >
              <div className="grid grow grid-cols-2 grid-rows-2 justify-between gap-2 lg:grid-cols-3 lg:grid-rows-1 lg:gap-2">
                <div className="col-span-2 col-start-1 row-start-1 lg:col-span-1">
                  <ComboboxCreate
                    id={`ingredient-${recipe_ingredient.id}`}
                    name="ingredient"
                    options={ingredients}
                    value={recipe_ingredient.ingredient}
                    onChange={(value) =>
                      handleIngredientChange(
                        value,
                        "ingredient",
                        recipe_ingredient.id,
                      )
                    }
                    className="grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    onChange={(e) =>
                      handleIngredientChange(
                        e.target.value,
                        "quantity",
                        recipe_ingredient.id,
                      )
                    }
                    name="quantity"
                    placeholder="quantity"
                    className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 placeholder-neutral-600 focus:border-sky-600 focus:outline-none"
                  />
                </div>

                <div>
                  <ComboboxCreate
                    id={`unit-${recipe_ingredient.id}`}
                    name="unit"
                    options={units}
                    noCreate
                    value={recipe_ingredient.unit}
                    onChange={(value) =>
                      handleIngredientChange(
                        value,
                        "unit",
                        recipe_ingredient.id,
                      )
                    }
                    className="grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                  />
                </div>
              </div>

              <DeleteButton
                onClick={() => removeIngredient(recipe_ingredient.id)}
              />
            </div>
          ))}
        </div>

        <AddButton
          onClick={addIngredient}
          parentClassName="h-10 w-10"
          className="bg-amber-500 text-neutral-800 hover:bg-amber-600"
        />
      </div>

      {/* Category Dropdown */}
      <div>
        <label htmlFor="category" className="font-medium text-neutral-500">
          Category
        </label>
        {/*  */}
        <div className="mt-2">
          <ComboboxCreate
            id="category"
            options={categories}
            value={formData.category}
            onChange={handleCategoryChange}
            className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
      </div>

      {/* prep time, cook time, servivngs */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <div>
          <label htmlFor="prep_time" className="font-medium text-neutral-500">
            Prep Time (mins)
          </label>
          <input
            type="text"
            id="prep_time"
            name="prep_time"
            value={formData.prep_time}
            onChange={(e) => {
              // Only allow numbers and prevent non-numeric input
              const value = e.target.value;
              // Allow empty string for controlled input, otherwise only digits
              if (value === "" || /^\d+$/.test(value)) {
                handleChange(e);
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="cook_time" className="font-medium text-neutral-500">
            Cook Time (mins)
          </label>
          <input
            type="text"
            id="cook_time"
            name="cook_time"
            value={formData.cook_time}
            onChange={(e) => {
              // Only allow numbers and prevent non-numeric input
              const value = e.target.value;
              // Allow empty string for controlled input, otherwise only digits
              if (value === "" || /^\d+$/.test(value)) {
                handleChange(e);
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="servings" className="font-medium text-neutral-500">
            Servings
          </label>
          <input
            type="text"
            id="servings"
            name="servings"
            value={formData.servings}
            onChange={(e) => {
              // Only allow numbers and prevent non-numeric input
              const value = e.target.value;
              // Allow empty string for controlled input, otherwise only digits
              if (value === "" || /^\d+$/.test(value)) {
                handleChange(e);
              }
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Form Submission Buttons */}
      <div className="flex justify-end gap-4 py-4 text-lg font-medium">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-md bg-neutral-300 px-4 py-2 text-neutral-800 transition-all hover:bg-neutral-100 focus:outline-none active:scale-95"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-neutral-100 transition-all hover:bg-sky-700 focus:outline-none active:scale-95"
        >
          Create Recipe
        </button>
      </div>
    </form>
  );
}

export default RecipeCreateForm;
