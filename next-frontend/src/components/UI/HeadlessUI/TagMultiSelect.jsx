"use client";

import { useState } from "react";
import ComboboxCreate from "./ComboboxCreatable";

/**
 * @param {{ id: number, name: string }[]} options - all tags from API
 * @param {{ id?: number|null, name: string }[]} value - selected tags (id null for not-yet-created)
 * @param {(tags: { id?: number|null, name: string }[]) => void} onChange
 */
export default function TagMultiSelect({ options, value, onChange, className }) {
  const [comboKey, setComboKey] = useState(0);

  const handleSelect = (selected) => {
    if (!selected || !selected.name?.trim()) return;
    const exists = value.some((t) =>
      t.id != null && selected.id != null
        ? t.id === selected.id
        : t.name.toLowerCase() === selected.name.trim().toLowerCase(),
    );
    if (exists) return;
    onChange([...value, selected]);
    setComboKey((k) => k + 1);
  };

  const removeTag = (tag) => {
    onChange(
      value.filter((t) =>
        t.id != null && tag.id != null
          ? t.id !== tag.id
          : t.name !== tag.name,
      ),
    );
  };

  const availableOptions = options.filter(
    (o) => !value.some((v) => v.id != null && v.id === o.id),
  );

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag.id ?? `new-${tag.name}`}
            className="inline-flex items-center gap-1 rounded-full bg-neutral-700 px-3 py-1 text-xl text-neutral-100"
          >
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 cursor-pointer rounded-full px-1 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-100"
              aria-label={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <ComboboxCreate
        key={comboKey}
        name="Add tag"
        options={availableOptions}
        value={null}
        onChange={handleSelect}
        className={
          className ??
          "w-full rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
        }
      />
    </div>
  );
}
