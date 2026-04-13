"use client";

import { useState, useEffect, useRef } from "react";
import {
  createRecipe,
  updateRecipe,
  fetchRecipeById,
  deleteRecipe,
} from "../../api/recipes";
import { fetchTags, createTag } from "../../api/tags";
import {
  uploadRecipeImage,
  deleteRecipeImage,
  setCoverImage,
} from "../../api/recipeImages";
import { fetchIngredients, createIngredient } from "../../api/ingredients";
import AddButton from "../UI/Buttons/AddButton";
import DeleteButton from "../UI/Buttons/DeleteButton";
import ComboboxCreate from "@/components/inputs/ComboboxCreatable";
import TagChipTray from "@/components/tags/TagChipTray";
import TagCombobox from "@/components/tags/TagCombobox";
import FormSection from "./FormSection";
import { useTagPicker } from "@/components/tags/useTagPicker";
import AutoGrowTextarea from "./AutoGrowTextarea";
import RecipeFormPhotoItem from "./RecipeFormPhotoItem";

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

/** Split total minutes from API into hours + minutes for the form */
function minutesToHourMinuteFields(totalMins) {
  if (totalMins == null || totalMins === "") {
    return { hours: "", mins: "" };
  }
  const n = Math.max(0, Math.floor(Number(totalMins)));
  if (Number.isNaN(n)) return { hours: "", mins: "" };
  return {
    hours: String(Math.floor(n / 60)),
    mins: String(n % 60),
  };
}

/** Combine hours + minutes strings into total minutes, or null if both empty */
function hourMinuteFieldsToMinutes(hoursStr, minsStr) {
  const hEmpty = hoursStr === "";
  const mEmpty = minsStr === "";
  if (hEmpty && mEmpty) return null;
  const h = hEmpty ? 0 : parseInt(hoursStr, 10);
  const m = mEmpty ? 0 : parseInt(minsStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || m < 0) return null;
  return h * 60 + m;
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

  const prepHm = minutesToHourMinuteFields(recipe.prep_time);
  const cookHm = minutesToHourMinuteFields(recipe.cook_time);

  return {
    title: recipe.title ?? "",
    description: recipe.description ?? "",
    recipe_instructions: instructions,
    prep_time_hours: prepHm.hours,
    prep_time_mins: prepHm.mins,
    cook_time_hours: cookHm.hours,
    cook_time_mins: cookHm.mins,
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
  prep_time_hours: "",
  prep_time_mins: "",
  cook_time_hours: "",
  cook_time_mins: "",
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

function RecipeForm({
  onClose,
  onRecipeCreated,
  existingRecipe,
  onRecipeUpdated,
  onRecipeDeleted,
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

  const handleUnsignedIntChange = (e) => {
    const { name, value } = e.target;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleTagsChange = (tags) => {
    setFormData((prevData) => ({
      ...prevData,
      tags,
    }));
  };

  const { comboKey, handleSelect, removeTag, availableOptions } = useTagPicker(
    allTags,
    formData.tags,
    handleTagsChange,
  );

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

    const {
      prep_time_hours: _ph,
      prep_time_mins: _pm,
      cook_time_hours: _ch,
      cook_time_mins: _cm,
      ...formFieldsForApi
    } = formData;

    const submissionData = {
      ...formFieldsForApi,
      prep_time: hourMinuteFieldsToMinutes(
        formData.prep_time_hours,
        formData.prep_time_mins,
      ),
      cook_time: hourMinuteFieldsToMinutes(
        formData.cook_time_hours,
        formData.cook_time_mins,
      ),
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

  const handleDeleteRecipe = async () => {
    if (!existingRecipe?.id) return;
    if (
      !window.confirm("Delete this recipe permanently? This cannot be undone.")
    ) {
      return;
    }
    const result = await deleteRecipe(existingRecipe.id);
    if (result.error) {
      window.alert(result.error);
      return;
    }
    onRecipeDeleted?.(existingRecipe.id);
    onClose();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col gap-12 overflow-y-auto p-5 pb-32 text-2xl text-neutral-100 shadow-xl lg:gap-20 lg:p-10 lg:pb-20 lg:text-4xl"
    >
      <h2 className="text-3xl font-bold lg:text-5xl">
        {isEditing ? "Edit Recipe" : "Create New Recipe"}
      </h2>

      {/* Recipe title */}
      <FormSection
        label="Title :"
        htmlFor="title"
        className="flex w-full flex-row gap-4"
        labelClassName="font-medium whitespace-nowrap text-neutral-300"
        contentClassName="grow"
      >
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border-b-2 border-neutral-500 text-neutral-100 focus:outline-none"
          required
        />
      </FormSection>

      {/* Photos (gallery + cover) */}
      <FormSection
        label="Photos"
        className="flex flex-col"
        contentClassName="mt-2"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={addPhotoFiles}
          className="hidden"
        />
        <div className="flex flex-wrap gap-4">
          {photoItems.map((item) => (
            <RecipeFormPhotoItem
              key={item.localId}
              src={item.preview || item.image_url}
              isCover={item.isCover}
              onMakeCover={() => makeCover(item)}
              onRemove={() => removePhoto(item)}
            />
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-32 w-32 flex-shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-neutral-500 text-lg text-neutral-400 transition-all hover:border-sky-600 hover:text-neutral-200"
          >
            + Add
          </button>
        </div>
      </FormSection>

      {/* Description */}
      <FormSection label="Description" htmlFor="description">
        <AutoGrowTextarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          topMargin
        />
      </FormSection>

      {/* Instructions */}
      <FormSection
        label="Instructions"
        htmlFor="instructions"
        contentClassName="flex flex-col gap-4"
      >
        {formData.recipe_instructions.map((recipe_instruction) => (
          <div key={recipe_instruction.id} className="flex items-center gap-4">
            <h4 className="flex gap-2 text-neutral-500">
              <span className="hidden lg:flex">Step</span>{" "}
              <span>{recipe_instruction.order}</span>
            </h4>
            <AutoGrowTextarea
              id={`instruction-${recipe_instruction.id}`}
              name="text"
              value={recipe_instruction.text}
              onChange={(e) =>
                handleInstructionChange(e, recipe_instruction.id)
              }
              rows={1}
              required
              fullWidth
            />

            <DeleteButton
              onClick={() => removeInstruction(recipe_instruction.id)}
            />
          </div>
        ))}

        <AddButton
          onClick={addInstruction}
          parentClassName="h-8 w-8 lg:h-10 lg:w-10"
        />
      </FormSection>

      {/* Ingredient List */}
      <FormSection
        label="Ingredient List"
        contentClassName="flex flex-col gap-4"
      >
        {formData.recipe_ingredients.map((recipe_ingredient) => (
          <div
            key={recipe_ingredient.id}
            className="flex items-center gap-4 border-dotted border-neutral-600 not-first:border-t-2 lg:border-none"
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
                  className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 placeholder-neutral-500 focus:border-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <ComboboxCreate
                  name="unit"
                  options={UNITS}
                  noCreate
                  value={recipe_ingredient.unit}
                  onChange={(value) =>
                    handleIngredientChange(value, "unit", recipe_ingredient.id)
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

        <div className="flex items-center justify-between">
          <AddButton
            onClick={addIngredient}
            parentClassName="h-8 w-8 lg:h-10 lg:w-10"
          />

          {/* servings */}
          <div className="flex items-center gap-4">
            <label htmlFor="servings" className="font-medium text-neutral-300">
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
      </FormSection>

      {/* Tags */}
      <FormSection label="Tags" htmlFor="tags">
        <div className="flex w-full flex-col items-start gap-2 lg:flex-row lg:gap-8">
          <div className="w-full flex-1 shrink-0">
            <TagCombobox
              comboKey={comboKey}
              name="Add tag"
              options={availableOptions}
              onChange={handleSelect}
              className="w-full grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
            />
          </div>
          <div className="w-full lg:w-2/3">
            <TagChipTray
              tags={formData.tags}
              onRemoveTag={removeTag}
              variant="field"
              placeholder="Selected Tags"
            />
          </div>
        </div>
      </FormSection>

      {/* Visibility */}
      <div className="flex flex-wrap items-center justify-between gap-4 lg:items-start lg:justify-start lg:gap-8">
        <span id="visibility-heading" className="font-medium text-neutral-300">
          Visibility
        </span>
        <div
          className="flex flex-col gap-2 lg:gap-4"
          role="radiogroup"
          aria-labelledby="visibility-heading"
        >
          <label className="flex cursor-pointer items-center gap-4 rounded-md focus-within:outline-none">
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
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950 peer-checked:[&>.radio-dot]:opacity-100"
            >
              <span className="radio-dot h-4 w-4 rounded-full bg-red-300 opacity-0 transition-opacity" />
            </span>

            <div className="text-2xl">
              <span className="text-neutral-300">Public </span>
              <span className="text-neutral-500">(visible to everyone)</span>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-4 rounded-md focus-within:outline-none">
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
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950 peer-checked:[&>.radio-dot]:opacity-100"
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

      {/* prep time, cook time (stored as total minutes on the API) */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
        <FormSection label="Prep Time" htmlFor="prep_time_hours">
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-lg text-neutral-500">Hours</span>
              <input
                type="text"
                id="prep_time_hours"
                name="prep_time_hours"
                value={formData.prep_time_hours}
                onChange={handleUnsignedIntChange}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-lg text-neutral-500">Minutes</span>
              <input
                type="text"
                id="prep_time_mins"
                name="prep_time_mins"
                value={formData.prep_time_mins}
                onChange={handleUnsignedIntChange}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
        </FormSection>
        <FormSection label="Cook Time" htmlFor="cook_time_hours">
          <div className="flex gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-lg text-neutral-500">Hours</span>
              <input
                type="text"
                id="cook_time_hours"
                name="cook_time_hours"
                value={formData.cook_time_hours}
                onChange={handleUnsignedIntChange}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-lg text-neutral-500">Minutes</span>
              <input
                type="text"
                id="cook_time_mins"
                name="cook_time_mins"
                value={formData.cook_time_mins}
                onChange={handleUnsignedIntChange}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
              />
            </div>
          </div>
        </FormSection>
      </div>

      {/* Form Submission Buttons */}
      <div className="flex flex-col items-end gap-12">
        <div className="flex flex-wrap gap-4">
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
            className="cursor-pointer rounded-md bg-sky-600 px-4 py-2 text-neutral-100 transition-all hover:bg-sky-500 hover:text-white focus:outline-none active:scale-95"
          >
            {isEditing ? "Edit Recipe" : "Create Recipe"}
          </button>
        </div>
        <div>
          {isEditing && (
            <button
              type="button"
              onClick={handleDeleteRecipe}
              className="cursor-pointer rounded-md border border-red-500/60 bg-transparent px-4 py-2 text-red-300 transition-all hover:bg-red-950/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-95"
            >
              Delete recipe
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
