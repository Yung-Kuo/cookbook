"use client";

import { useState, useEffect, useRef } from "react";
import { createRecipe, updateRecipe, fetchRecipeById } from "../../api/recipes";
import { fetchTags, createTag } from "../../api/tags";
import {
  uploadRecipeImage,
  deleteRecipeImage,
  setCoverImage,
} from "../../api/recipeImages";
import { fetchIngredients, createIngredient } from "../../api/ingredients";
import AddButton from "../UI/Buttons/AddButton";
import DeleteButton from "../UI/Buttons/DeleteButton";
import ComboboxCreate from "../UI/HeadlessUI/ComboboxCreatable";
import TagMultiSelect from "../UI/HeadlessUI/TagMultiSelect";

const UNITS = [
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

function scalarToFormString(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Map API recipe (read serializer) to local form state */
function recipeToFormData(recipe) {
  const instructions = recipe.recipe_instructions?.length
    ? [...recipe.recipe_instructions]
        .sort((a, b) => a.order - b.order)
        .map((ins) => ({
          id: ins.id ?? crypto.randomUUID(),
          text: ins.text ?? "",
          order: ins.order,
        }))
    : [
        {
          id: "instruction-1",
          text: "",
          order: 1,
        },
      ];

  const recipeIngredients = recipe.recipe_ingredients?.length
    ? recipe.recipe_ingredients.map((ri) => ({
        id: ri.id ?? crypto.randomUUID(),
        ingredient:
          ri.ingredient != null ? { id: ri.ingredient, name: ri.name } : "",
        quantity:
          ri.quantity !== null && ri.quantity !== undefined
            ? String(ri.quantity)
            : "",
        unit: ri.unit
          ? (UNITS.find((u) => u.name === ri.unit) ?? {
              id: -1,
              name: ri.unit,
            })
          : "",
      }))
    : [
        {
          id: "ingredient-1",
          ingredient: "",
          quantity: "",
          unit: "",
        },
      ];

  return {
    title: recipe.title ?? "",
    description: recipe.description ?? "",
    recipe_instructions: instructions,
    prep_time: scalarToFormString(recipe.prep_time),
    cook_time: scalarToFormString(recipe.cook_time),
    servings: scalarToFormString(recipe.servings),
    tags: recipe.tags?.length ? [...recipe.tags] : [],
    recipe_ingredients: recipeIngredients,
    is_public: recipe.is_public !== false,
  };
}

const EMPTY_FORM = {
  title: "",
  description: "",
  recipe_instructions: [
    {
      id: "instruction-1",
      text: "",
      order: 1,
    },
  ],
  prep_time: "",
  cook_time: "",
  servings: "",
  tags: [],
  recipe_ingredients: [
    {
      id: "ingredient-1",
      ingredient: "",
      quantity: "",
      unit: "",
    },
  ],
  is_public: true,
};

function RecipeCreateForm({
  onClose,
  onRecipeCreated,
  existingRecipe,
  onRecipeUpdated,
}) {
  // ----------------------------------------------------
  // 1. Component State to hold form data
  //    Matches the structure expected by RecipeWriteSerializer
  // ----------------------------------------------------
  const [formData, setFormData] = useState(() => ({ ...EMPTY_FORM }));
  /** Local + server-backed photos: localId, optional serverId/image_url, optional file/preview, isCover */
  const [photoItems, setPhotoItems] = useState([]);
  const fileInputRef = useRef(null);

  const clearForm = () => {
    setPhotoItems((prev) => {
      prev.forEach((p) => {
        if (p.preview) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
    setFormData({ ...EMPTY_FORM });
  };

  // ----------------------------------------------------
  // 2. State for dropdown data (Categories, Ingredients)
  // ----------------------------------------------------
  const [allTags, setAllTags] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownError, setDropdownError] = useState(null);

  // ----------------------------------------------------
  // 3. useEffect to fetch dropdown data on component mount
  // ----------------------------------------------------
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const fetchedTags = await fetchTags();
        setAllTags(fetchedTags);

        const fetchedIngredients = await fetchIngredients();
        setIngredients(fetchedIngredients);
      } catch (err) {
        setDropdownError("Failed to load tags or ingredients.");
        console.error("Error loading dropdown data:", err);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdownData();
  }, []);

  useEffect(() => {
    if (existingRecipe) {
      setFormData(recipeToFormData(existingRecipe));
      setPhotoItems(
        (existingRecipe.images || []).map((img) => ({
          localId: `srv-${img.id}`,
          serverId: img.id,
          image_url: img.image_url,
          isCover: img.is_cover,
        })),
      );
    } else {
      clearForm();
    }
  }, [existingRecipe]);

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

  const handleTagsChange = (tags) => {
    setFormData((prevData) => ({
      ...prevData,
      tags,
    }));
  };

  const refreshImagesFromServer = async (recipeId) => {
    const fresh = await fetchRecipeById(recipeId);
    setPhotoItems(
      (fresh.images || []).map((img) => ({
        localId: `srv-${img.id}`,
        serverId: img.id,
        image_url: img.image_url,
        isCover: img.is_cover,
      })),
    );
  };

  const addPhotoFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (existingRecipe) {
      try {
        const hadPhotos = photoItems.length > 0;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isCover = !hadPhotos && i === 0;
          await uploadRecipeImage(existingRecipe.id, file, isCover);
        }
        await refreshImagesFromServer(existingRecipe.id);
      } catch (err) {
        console.error("Failed to upload image:", err);
      }
    } else {
      setPhotoItems((prev) => {
        const added = files.map((file) => ({
          localId: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          isCover: false,
        }));
        if (prev.length === 0 && added.length > 0) {
          added[0].isCover = true;
        }
        return [...prev, ...added];
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setCoverLocal = (localId) => {
    setPhotoItems((prev) =>
      prev.map((p) => ({ ...p, isCover: p.localId === localId })),
    );
  };

  const removePhoto = async (item) => {
    if (item.serverId != null && existingRecipe) {
      try {
        await deleteRecipeImage(existingRecipe.id, item.serverId);
        await refreshImagesFromServer(existingRecipe.id);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
      return;
    }
    setPhotoItems((prev) => {
      const next = prev.filter((p) => p.localId !== item.localId);
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      if (next.length && !next.some((p) => p.isCover)) {
        next[0] = { ...next[0], isCover: true };
      }
      return next;
    });
  };

  const makeCover = async (item) => {
    if (item.serverId != null && existingRecipe) {
      try {
        await setCoverImage(existingRecipe.id, item.serverId);
        await refreshImagesFromServer(existingRecipe.id);
      } catch (err) {
        console.error("Failed to set cover:", err);
      }
      return;
    }
    setCoverLocal(item.localId);
  };

  const addIngredient = () => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: [
        ...prevData.recipe_ingredients,
        {
          id: crypto.randomUUID(),
          ingredient: "",
          quantity: "",
          unit: "",
        },
      ],
    }));
  };

  const handleIngredientChange = (value, name, id) => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: prevData.recipe_ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [name]: value } : ingredient,
      ),
    }));
  };

  const removeIngredient = (id) => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: prevData.recipe_ingredients.filter(
        (ingredient) => ingredient.id !== id,
      ),
    }));
  };

  const addInstruction = () => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: [
        ...prevData.recipe_instructions,
        {
          id: crypto.randomUUID(),
          text: "",
          order: prevData.recipe_instructions.length + 1,
        },
      ],
    }));
  };

  const handleInstructionChange = (e, id) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: prevData.recipe_instructions.map((instruction) =>
        instruction.id === id ? { ...instruction, [name]: value } : instruction,
      ),
    }));
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Handle tag creation (new tags without id)
    let tagIds = [];
    try {
      const resolved = [];
      for (const t of formData.tags || []) {
        if (!t) continue;
        if (t.id) {
          resolved.push(t.id);
        } else if (t.name?.trim()) {
          const created = await createTag({ name: t.name.trim() });
          resolved.push(created.id);
          setAllTags((prev) => [...prev, created]);
        }
      }
      tagIds = [...new Set(resolved)];
    } catch (error) {
      console.error("Failed to create tags:", error);
      return;
    }

    // 2. Handle ingredient creation
    let recipe_ingredients = [...formData.recipe_ingredients];
    const ingredientsToCreate = recipe_ingredients.filter(
      (ri) => ri.ingredient && !ri.ingredient.id,
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
          if (
            ri.ingredient &&
            !ri.ingredient.id &&
            nameToIngredient[ri.ingredient.name]
          ) {
            return { ...ri, ingredient: nameToIngredient[ri.ingredient.name] };
          }
          return ri;
        });
      } catch (error) {
        console.error("Failed to create one or more ingredients:", error);
        return;
      }
    }

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
      tags: tagIds,
      is_public: formData.is_public,
    };

    const hasEmptyInstruction = submissionData.recipe_instructions.some(
      (ins) => !ins.text || ins.text.trim() === "",
    );
    if (hasEmptyInstruction) {
      console.error("All instruction steps must have non-empty text.");
      return;
    }

    if (!submissionData.title) {
      console.error("Missing title");
      return;
    }

    if (submissionData.recipe_ingredients.length === 0) {
      console.error(
        "At least one ingredient is required with all fields filled",
      );
      return;
    }

    try {
      if (existingRecipe) {
        const { data, error } = await updateRecipe(
          existingRecipe.id,
          submissionData,
        );
        if (data) {
          onRecipeUpdated?.(data);
          clearForm();
        }
        if (error) {
          console.error("Error updating recipe:", error);
        } else {
          onClose();
        }
      } else {
        const { data, error } = await createRecipe(submissionData);
        if (data) {
          try {
            for (const item of photoItems) {
              if (item.file) {
                await uploadRecipeImage(data.id, item.file, item.isCover);
              }
            }
            const finalRecipe = await fetchRecipeById(data.id);
            onRecipeCreated(finalRecipe);
          } catch (uploadErr) {
            console.error("Recipe created but image upload failed:", uploadErr);
            onRecipeCreated(data);
          }
          clearForm();
          onClose();
        }
        if (error) {
          console.error("Error creating recipe:", error);
        }
      }
    } catch (err) {
      console.error("Error submitting recipe:", err);
    }
  };

  const isEditing = Boolean(existingRecipe);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col gap-12 overflow-y-auto p-5 py-20 text-2xl text-neutral-100 shadow-xl lg:gap-20 lg:p-10 lg:py-10 lg:text-4xl"
    >
      <h2 className="text-3xl font-bold lg:text-5xl">
        {isEditing ? "Edit Recipe" : "Create New Recipe"}
      </h2>

      {/* Recipe title */}
      <div className="flex w-full gap-4">
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

      {/* Photos (gallery + cover) */}
      <div>
        <label className="font-medium text-neutral-500">Photos</label>
        <p className="mt-1 text-lg text-neutral-500">
          Click a thumbnail to set cover. First photo is cover when you add
          multiple.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={addPhotoFiles}
          className="hidden"
        />
        <div className="mt-2 flex flex-wrap gap-4">
          {photoItems.map((item) => {
            const src = item.preview || item.image_url;
            return (
              <div
                key={item.localId}
                className="relative flex h-32 w-32 flex-shrink-0 flex-col overflow-hidden rounded-md border-2 border-neutral-600"
              >
                {src && (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                {item.isCover && (
                  <span className="absolute top-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-neutral-900">
                    Cover
                  </span>
                )}
                <div className="absolute right-0 bottom-0 left-0 flex gap-1 bg-black/60 p-1">
                  <button
                    type="button"
                    onClick={() => makeCover(item)}
                    className="flex-1 cursor-pointer rounded px-1 text-xs text-neutral-100 hover:bg-neutral-700"
                  >
                    Cover
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(item)}
                    className="cursor-pointer rounded px-1 text-xs text-red-300 hover:bg-red-900/80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-32 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-500 text-lg text-neutral-400 transition-all hover:border-sky-600 hover:text-neutral-200"
          >
            + Add
          </button>
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
              <h4 className="flex gap-2 text-neutral-500">
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
          parentClassName="h-8 w-8 lg:h-10 lg:w-10"
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
                    value={recipe_ingredient.quantity}
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
                    name="unit"
                    options={UNITS}
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

        <div className="flex items-center justify-between">
          <AddButton
            onClick={addIngredient}
            parentClassName="h-8 w-8 lg:h-10 lg:w-10"
            className="bg-amber-500 text-neutral-800 hover:bg-amber-600"
          />

          {/* servings */}
          <div className="flex items-center gap-4">
            <label htmlFor="servings" className="font-medium text-neutral-500">
              Servings
            </label>
            <input
              type="text"
              id="servings"
              name="servings"
              value={formData.servings}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  handleChange(e);
                }
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              min="1"
              className="w-20 rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="font-medium text-neutral-500">
          Tags
        </label>
        <TagMultiSelect
          options={allTags}
          value={formData.tags}
          onChange={handleTagsChange}
        />
      </div>

      {/* Visibility */}
      <div className="flex flex-wrap items-center gap-4">
        <span id="visibility-heading" className="font-medium text-neutral-500">
          Visibility
        </span>
        <div
          className="flex flex-wrap items-center gap-6"
          role="radiogroup"
          aria-labelledby="visibility-heading"
        >
          <label className="flex cursor-pointer items-center gap-3 rounded-md focus-within:outline-none">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={formData.is_public}
              onChange={() =>
                setFormData((prev) => ({ ...prev, is_public: true }))
              }
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-checked:[&>.radio-dot]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950"
            >
              <span className="radio-dot h-4 w-4 rounded-full bg-red-300 opacity-0 transition-opacity" />
            </span>
            <div className="text-2xl">
              <span className="text-neutral-300">Public </span>
              <span className="text-neutral-500">(visible to everyone)</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md focus-within:outline-none">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={!formData.is_public}
              onChange={() =>
                setFormData((prev) => ({ ...prev, is_public: false }))
              }
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-checked:[&>.radio-dot]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950"
            >
              <span className="radio-dot h-4 w-4 rounded-full bg-red-300 opacity-0 transition-opacity" />
            </span>
            <div className="text-2xl">
              <span className="text-neutral-300">Private </span>
              <span className="text-neutral-500">
                (only you can see this recipe)
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* prep time, cook time */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
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
              const value = e.target.value;
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
              const value = e.target.value;
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
          type="button"
          onClick={handleSubmit}
          className="cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-neutral-100 transition-all hover:bg-sky-500 focus:outline-none hover:text-white active:scale-95"
        >
          {isEditing ? "Edit Recipe" : "Create Recipe"}
        </button>
      </div>
    </form>
  );
}

export default RecipeCreateForm;
