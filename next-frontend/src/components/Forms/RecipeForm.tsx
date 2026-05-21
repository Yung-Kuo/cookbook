"use client";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRecipe,
  updateRecipe,
  fetchRecipeById,
  deleteRecipe,
} from "../../api/recipes";
import { pinRecipe, unpinRecipe } from "@/api/pinned";
import { fetchTags, createTag } from "../../api/tags";
import {
  uploadRecipeImage,
  deleteRecipeImage,
  setCoverImage,
} from "../../api/recipeImages";
import { fetchIngredients, createIngredient } from "../../api/ingredients";
import AddButton from "../UI/Buttons/AddButton";
import DeleteButton from "../UI/Buttons/DeleteButton";
import FormActionButton from "../UI/Buttons/FormActionButton";
import ComboboxCreate from "@/components/inputs/ComboboxCreatable";
import CheckboxLabel from "@/components/inputs/CheckboxLabel";
import TagChipTray from "@/components/tags/TagChipTray";
import TagCombobox from "@/components/tags/TagCombobox";
import FormSection from "@/components/inputs/FormSection";
import { useTagPicker } from "@/components/tags/useTagPicker";
import AutoGrowTextarea from "@/components/inputs/AutoGrowTextarea";
import RecipeFormPhotoItem from "./RecipeFormPhotoItem";
import FormRadioOption from "@/components/inputs/FormRadioOption";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type { ComboboxOptionItem } from "@/components/inputs/ComboboxCreatable";
import type { Ingredient, Recipe, RecipeWritePayload, Tag } from "@/types";

const isIngredientOption = (
  v: string | IngredientOption,
): v is IngredientOption => typeof v === "object" && v !== null && "name" in v;

const rowIngredientToCombo = (
  v: string | IngredientOption,
): ComboboxOptionItem | null => {
  if (typeof v === "string") {
    return v.trim() === "" ? null : { id: null, name: v };
  }
  return { id: v.id ?? null, name: v.name };
};

const comboToRowIngredient = (
  v: ComboboxOptionItem | null,
): string | IngredientOption => {
  if (!v) return "";
  if (v.id != null) return { id: v.id, name: v.name };
  return { id: null, name: v.name };
};

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

type FormInstructionRow = { id: string; text: string; order: number };

type IngredientOption = { id?: number | null; name: string };

type FormIngredientRow = {
  id: string;
  ingredient: string | IngredientOption;
  quantity: string;
  unit: string | IngredientOption;
};

type FormState = {
  title: string;
  description: string;
  recipe_instructions: FormInstructionRow[];
  prep_time_hours: string;
  prep_time_mins: string;
  cook_time_hours: string;
  cook_time_mins: string;
  servings: string;
  tags: Tag[];
  recipe_ingredients: FormIngredientRow[];
  is_public: boolean;
  pin_to_profile: boolean;
};

type PhotoItem =
  | {
      localId: string;
      serverId: number;
      image_url: string | null;
      isCover: boolean;
    }
  | {
      localId: string;
      file: File;
      preview: string;
      isCover: boolean;
    };

type RecipeFormProps = {
  onClose: () => void;
  onRecipeCreated?: (r: Recipe) => void;
  existingRecipe?: Recipe | null;
  onRecipeUpdated?: (r: Recipe) => void;
  onRecipeDeleted?: (id: number) => void;
};

function scalarToFormString(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Split total minutes from API into hours + minutes for the form */
function minutesToHourMinuteFields(totalMins: unknown) {
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
function hourMinuteFieldsToMinutes(hoursStr: string, minsStr: string) {
  const hEmpty = hoursStr === "";
  const mEmpty = minsStr === "";
  if (hEmpty && mEmpty) return null;
  const h = hEmpty ? 0 : parseInt(hoursStr, 10);
  const m = mEmpty ? 0 : parseInt(minsStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || m < 0) return null;
  return h * 60 + m;
}

/** Map API recipe (read serializer) to local form state */
function recipeToFormData(recipe: Recipe): FormState {
  const instructions = recipe.recipe_instructions?.length
    ? [...recipe.recipe_instructions]
        .sort((a, b) => a.order - b.order)
        .map((ins) => ({
          id: String(ins.id ?? crypto.randomUUID()),
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
        id: String(ri.id ?? crypto.randomUUID()),
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
    pin_to_profile: recipe.is_pinned === true,
  };
}

const EMPTY_FORM: FormState = {
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
  pin_to_profile: false,
};

function RecipeForm({
  onClose,
  onRecipeCreated,
  existingRecipe,
  onRecipeUpdated,
  onRecipeDeleted,
}: RecipeFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: queryKeys.tags.list(),
    queryFn: fetchTags,
    staleTime: 30 * 60 * 1000,
  });
  const ingredientsQuery = useQuery({
    queryKey: queryKeys.ingredients.list(),
    queryFn: fetchIngredients,
    staleTime: 30 * 60 * 1000,
  });
  const allTags = tagsQuery.data ?? [];
  const ingredients = ingredientsQuery.data ?? [];
  const loadingDropdowns = tagsQuery.isPending || ingredientsQuery.isPending;
  const dropdownError =
    tagsQuery.isError || ingredientsQuery.isError
      ? "Failed to load tags or ingredients."
      : null;

  // ----------------------------------------------------
  // 1. Component State to hold form data
  //    Matches the structure expected by RecipeWriteSerializer
  // ----------------------------------------------------
  const [formData, setFormData] = useState<FormState>(() => ({
    ...EMPTY_FORM,
  }));
  /** Local + server-backed photos: localId, optional serverId/image_url, optional file/preview, isCover */
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearForm = () => {
    setPhotoItems((prev) => {
      prev.forEach((p) => {
        if ("preview" in p && p.preview) URL.revokeObjectURL(p.preview);
      });
      return [];
    });
    setFormData({ ...EMPTY_FORM });
  };

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
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUnsignedIntChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === "" || /^\d+$/.test(value)) {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleTagsChange = (tags: Tag[]) => {
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

  const refreshImagesFromServer = async (recipeId: number) => {
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

  const addPhotoFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
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

  const setCoverLocal = (localId: string) => {
    setPhotoItems((prev) =>
      prev.map((p) => ({ ...p, isCover: p.localId === localId })),
    );
  };

  const removePhoto = async (item: PhotoItem) => {
    if ("serverId" in item && item.serverId != null && existingRecipe) {
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
      if ("preview" in item && item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      if (next.length && !next.some((p) => p.isCover)) {
        next[0] = { ...next[0], isCover: true };
      }
      return next;
    });
  };

  const makeCover = async (item: PhotoItem) => {
    if ("serverId" in item && item.serverId != null && existingRecipe) {
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

  const handleIngredientChange = (
    value: string | IngredientOption,
    name: string,
    id: string,
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      recipe_ingredients: prevData.recipe_ingredients.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [name]: value } : ingredient,
      ),
    }));
  };

  const removeIngredient = (id: string) => {
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

  const handleInstructionChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      recipe_instructions: prevData.recipe_instructions.map((instruction) =>
        instruction.id === id ? { ...instruction, [name]: value } : instruction,
      ),
    }));
  };

  const removeInstruction = (id: string) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Handle tag creation (new tags without id)
    let tagIds: number[] = [];
    try {
      const resolved: number[] = [];
      for (const t of formData.tags || []) {
        if (!t) continue;
        if (t.id != null) {
          resolved.push(t.id);
        } else if (t.name?.trim()) {
          const created = await createTag({ name: t.name.trim() });
          if (created.id == null) {
            console.error("Created tag missing id");
            return;
          }
          resolved.push(created.id);
          queryClient.setQueryData(
            queryKeys.tags.list(),
            (prev: Tag[] | undefined) => [...(prev ?? []), created],
          );
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
      (ri) => isIngredientOption(ri.ingredient) && ri.ingredient.id == null,
    );
    if (ingredientsToCreate.length > 0) {
      try {
        const createdIngredients = await Promise.all(
          ingredientsToCreate.map((ri) => {
            const ing = ri.ingredient;
            if (!isIngredientOption(ing)) {
              throw new Error("Invalid ingredient row");
            }
            return createIngredient({ name: ing.name });
          }),
        );
        createdIngredients.forEach((ing) => {
          queryClient.setQueryData(
            queryKeys.ingredients.list(),
            (prev: Ingredient[] | undefined) => {
              const list = prev ?? [];
              if (list.some((x) => x.id === ing.id)) return list;
              return [...list, ing];
            },
          );
        });
        const nameToIngredient: Record<string, Ingredient> = {};
        createdIngredients.forEach((ingredient) => {
          nameToIngredient[ingredient.name] = ingredient;
        });
        recipe_ingredients = recipe_ingredients.map((ri) => {
          if (
            isIngredientOption(ri.ingredient) &&
            ri.ingredient.id == null &&
            nameToIngredient[ri.ingredient.name]
          ) {
            return {
              ...ri,
              ingredient: nameToIngredient[ri.ingredient.name],
            };
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
      recipe_ingredients: recipe_ingredients.flatMap((ing) => {
        if (
          !isIngredientOption(ing.ingredient) ||
          ing.ingredient.id == null ||
          !Boolean(ing.quantity) ||
          !isIngredientOption(ing.unit)
        ) {
          return [];
        }
        return [
          {
            ingredient: ing.ingredient.id,
            quantity: Number(ing.quantity),
            unit: ing.unit.name,
          },
        ];
      }),
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

    const { pin_to_profile: _pinToProfile, ...recipePayload } = submissionData;

    try {
      if (existingRecipe) {
        const updateResult = await updateRecipe(
          existingRecipe.id,
          recipePayload as RecipeWritePayload,
        );
        if ("data" in updateResult && updateResult.data) {
          const data = updateResult.data;
          const ownRecipe =
            existingRecipe.owner_id != null &&
            user?.pk === existingRecipe.owner_id;
          let merged = { ...data };
          if (ownRecipe) {
            const wantPin = formData.pin_to_profile;
            const wasPinned = existingRecipe.is_pinned === true;
            if (wantPin !== wasPinned) {
              try {
                if (wantPin) {
                  await pinRecipe(data.id);
                  merged = { ...merged, is_pinned: true };
                } else {
                  await unpinRecipe(data.id);
                  merged = { ...merged, is_pinned: false };
                }
              } catch (pinErr) {
                console.error("Pin sync failed:", pinErr);
              }
            }
          }
          onRecipeUpdated?.(merged);
          clearForm();
        }
        if ("error" in updateResult && updateResult.error) {
          console.error("Error updating recipe:", updateResult.error);
        } else {
          onClose();
        }
      } else {
        const createResult = await createRecipe(
          recipePayload as RecipeWritePayload,
        );
        if ("data" in createResult && createResult.data) {
          const data = createResult.data;
          try {
            for (const item of photoItems) {
              if ("file" in item && item.file) {
                await uploadRecipeImage(data.id, item.file, item.isCover);
              }
            }
            if (formData.pin_to_profile) {
              try {
                await pinRecipe(data.id);
              } catch (pinErr) {
                console.error("Pin failed:", pinErr);
              }
            }
            const finalRecipe = await fetchRecipeById(data.id);
            onRecipeCreated?.(finalRecipe);
          } catch (uploadErr) {
            console.error("Recipe created but image upload failed:", uploadErr);
            if (formData.pin_to_profile) {
              try {
                await pinRecipe(data.id);
              } catch (pinErr) {
                console.error("Pin failed:", pinErr);
              }
            }
            const finalRecipe = await fetchRecipeById(data.id);
            onRecipeCreated?.(finalRecipe);
          }
          clearForm();
          onClose();
        }
        if ("error" in createResult && createResult.error) {
          console.error("Error creating recipe:", createResult.error);
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
    if ("error" in result && result.error) {
      window.alert(result.error);
      return;
    }
    onRecipeDeleted?.(existingRecipe.id);
    onClose();
  };

  if (loadingDropdowns) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-2xl text-neutral-400">
        Loading form…
      </div>
    );
  }

  if (dropdownError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center text-2xl text-red-300">
        <p>{dropdownError}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col gap-12 overflow-y-auto p-5 pb-20 text-2xl text-neutral-100 shadow-xl lg:gap-20 lg:p-10 lg:pb-20 lg:text-4xl"
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
              src={"preview" in item ? item.preview : item.image_url}
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
                  value={rowIngredientToCombo(recipe_ingredient.ingredient)}
                  onChange={(value) =>
                    handleIngredientChange(
                      comboToRowIngredient(value),
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
                  value={rowIngredientToCombo(recipe_ingredient.unit)}
                  onChange={(value) =>
                    handleIngredientChange(
                      comboToRowIngredient(value),
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
        <span
          id="visibility-heading"
          className="font-medium text-neutral-300 lg:w-40"
        >
          Visibility
        </span>
        <div
          className="flex flex-col gap-2 lg:gap-4"
          role="radiogroup"
          aria-labelledby="visibility-heading"
        >
          <FormRadioOption
            name="visibility"
            value="public"
            checked={formData.is_public}
            onChange={() =>
              setFormData((prev) => ({ ...prev, is_public: true }))
            }
            title="Public"
            description="(visible to everyone)"
          />
          <FormRadioOption
            name="visibility"
            value="private"
            checked={!formData.is_public}
            onChange={() =>
              setFormData((prev) => ({ ...prev, is_public: false }))
            }
            title="Private"
            description="(only you can see this recipe)"
          />
        </div>
      </div>

      {/* Pin to profile (your recipes only) */}
      {(!existingRecipe || user?.pk === existingRecipe.owner_id) && (
        <div className="flex flex-wrap items-center gap-4 lg:gap-8">
          <span className="font-medium text-neutral-300 lg:w-40">Profile</span>
          <CheckboxLabel
            checked={formData.pin_to_profile}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                pin_to_profile: e.target.checked,
              }))
            }
            size="md"
            labelClassName="gap-4"
          >
            <span className="text-2xl text-neutral-300">
              Pin to my profile{" "}
              <span className="text-neutral-500">(show in Pinned tab)</span>
            </span>
          </CheckboxLabel>
        </div>
      )}

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

      <div className="flex flex-col items-end gap-12 text-lg lg:flex-row-reverse lg:justify-between lg:text-2xl">
        <div className="flex flex-wrap gap-4">
          <FormActionButton
            type="button"
            onClick={onClose}
            className="bg-neutral-300 text-neutral-800 hover:bg-neutral-100"
          >
            Cancel
          </FormActionButton>
          <FormActionButton
            type="button"
            onClick={handleSubmit}
            className="bg-sky-600 text-neutral-100 hover:bg-sky-500 hover:text-white"
          >
            {isEditing ? "Edit Recipe" : "Create Recipe"}
          </FormActionButton>
        </div>
        <div>
          {isEditing && (
            <FormActionButton
              type="button"
              onClick={handleDeleteRecipe}
              className="border border-red-500/60 bg-transparent text-red-300 hover:bg-red-950/50 focus-visible:ring-2 focus-visible:ring-red-400/50"
            >
              Delete recipe
            </FormActionButton>
          )}
        </div>
      </div>
    </form>
  );
}

export default RecipeForm;
