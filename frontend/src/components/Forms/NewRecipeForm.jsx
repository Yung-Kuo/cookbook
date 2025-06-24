// src/components/RecipeCreateForm.jsx
import React, { useState, useEffect } from "react";
import { createRecipe } from "../../api/recipes";
import { fetchCategories } from "../../api/categories";
import { fetchIngredients } from "../../api/ingredients";
import AddButton from "../UI/Buttons/AddButton";
import DeleteButton from "../UI/Buttons/DeleteButton";
// Assuming you have API functions to fetch categories and ingredients
// import { fetchCategories, fetchIngredients } from "../api";

let nextIngredientId = 0;

function RecipeCreateForm({ onClose }) {
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

  // ----------------------------------------------------
  // 2. State for dropdown data (Categories, Ingredients)
  //    These will be fetched from your API
  // ----------------------------------------------------
  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const units = [
    "g",
    "kg",
    "ml",
    "l",
    "tsp",
    "tbsp",
    "cup",
    "stalk",
    "piece",
    "unit",
    "to taste",
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
  const handleIngredientChange = (e, id) => {
    const { name, value } = e.target;
    console.log("handleIngredientChange: ", name, value);
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
    console.log("remove id: ", id);
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
    console.log("remove id: ", id);
    const delete_instruction = formData.recipe_instructions.filter(
      (instruction) => instruction.id == id,
    );
    console.log("delete order: ", delete_instruction[0].order);
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

    // Convert empty strings to null for numeric fields
    const submissionData = {
      ...formData,
      prep_time: formData.prep_time === "" ? null : Number(formData.prep_time),
      cook_time: formData.cook_time === "" ? null : Number(formData.cook_time),
      servings: formData.servings === "" ? null : Number(formData.servings),
      recipe_instructions: formData.recipe_instructions.map((ins) => ({
        ...ins,
        text: ins.text.trim(),
      })),
      recipe_ingredients: formData.recipe_ingredients
        .filter((ing) => ing.ingredient && ing.quantity && ing.unit)
        .map((ing) => ({
          ...ing,
          quantity: Number(ing.quantity),
        })),
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
    console.log("hasEmptyInstruction: ", hasEmptyInstruction);
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
      if (error) {
        console.error("Error creating recipe:", error);
      } else {
        // onClose();
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
      className="flex h-full flex-col gap-10 overflow-y-auto rounded-lg p-10 text-neutral-100 shadow-xl"
    >
      <h2 className="mb-6 text-5xl font-bold">Create New Recipe</h2>

      {/* Basic Recipe Details */}
      <div className="mb-6 flex gap-4">
        <label
          htmlFor="title"
          className="text-4xl font-medium text-neutral-500"
        >
          Title :
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="grow border-b-2 border-neutral-500 text-4xl text-neutral-100 focus:outline-none"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="text-4xl font-medium text-neutral-500"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
        ></textarea>
      </div>

      {/* Instructions */}
      <div>
        <label
          htmlFor="instructions"
          className="text-4xl font-medium text-neutral-500"
        >
          Instructions
        </label>
        {formData.recipe_instructions.map((recipe_instruction) => (
          <div key={recipe_instruction.id} className="flex items-center gap-4">
            <h4 className="flex gap-2">
              Step <span>{recipe_instruction.order}</span>
            </h4>
            <textarea
              id={`instruction-${recipe_instruction.id}`}
              name="text"
              value={recipe_instruction.text}
              onChange={(e) =>
                handleInstructionChange(e, recipe_instruction.id)
              }
              rows="1"
              className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
              required
            />
            <DeleteButton
              onClick={() => removeInstruction(recipe_instruction.id)}
            />
          </div>
        ))}
        <AddButton
          onClick={addInstruction}
          parentClassName="mt-2 h-10 w-10"
          className="bg-amber-500 text-neutral-800 hover:bg-amber-600"
        />
      </div>

      {/* Ingredient List */}
      <div>
        <h3 className="text-4xl font-medium text-neutral-500">
          Ingredient List
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          {formData.recipe_ingredients.map((recipe_ingredient) => (
            <div key={recipe_ingredient.id} className="flex items-center gap-4">
              <div className="grid grow grid-cols-3 justify-between gap-4">
                <select
                  id={`ingredient-${recipe_ingredient.id}`}
                  name="ingredient"
                  value={recipe_ingredient.ingredient}
                  onChange={(e) =>
                    handleIngredientChange(e, recipe_ingredient.id)
                  }
                  className="grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                >
                  <option value="">Select an Ingredient</option>
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name}
                    </option>
                  ))}
                </select>
                {/* <input
                  placeholder="ingredient"
                  className="grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                /> */}
                <input
                  onChange={(e) =>
                    handleIngredientChange(e, recipe_ingredient.id)
                  }
                  name="quantity"
                  placeholder="quantity"
                  className="grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
                />
                <select
                  id={`unit-${recipe_ingredient.id}`}
                  name="unit"
                  onChange={(e) =>
                    handleIngredientChange(e, recipe_ingredient.id)
                  }
                  className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600"
                >
                  <option value="">Select an unit</option>
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <DeleteButton
                onClick={() => removeIngredient(recipe_ingredient.id)}
              />
            </div>
          ))}
        </div>

        <AddButton
          onClick={addIngredient}
          parentClassName="mt-2 h-10 w-10"
          className="bg-amber-500 text-neutral-800 hover:bg-amber-600"
        />
      </div>

      {/* Category Dropdown */}
      <div>
        <label
          htmlFor="category"
          className="text-4xl font-medium text-neutral-500"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
        >
          <option value="">Select a Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* prep time, cook time, servivngs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label
            htmlFor="prep_time"
            className="text-4xl font-medium text-neutral-500"
          >
            Prep Time (mins)
          </label>
          <input
            type="number"
            id="prep_time"
            name="prep_time"
            value={formData.prep_time}
            onChange={handleChange}
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="cook_time"
            className="text-4xl font-medium text-neutral-500"
          >
            Cook Time (mins)
          </label>
          <input
            type="number"
            id="cook_time"
            name="cook_time"
            value={formData.cook_time}
            onChange={handleChange}
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="servings"
            className="text-4xl font-medium text-neutral-500"
          >
            Servings
          </label>
          <input
            type="number"
            id="servings"
            name="servings"
            value={formData.servings}
            onChange={handleChange}
            className="mt-2 w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Form Submission Buttons */}
      <div className="flex justify-end gap-4 text-lg font-medium">
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
