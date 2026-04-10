"use client";

import Tag from "../Tag";
import ComboboxCreate from "./ComboboxCreatable";
import { useTagPicker } from "@/hooks/useTagPicker";

/**
 * @param {{ id: number, name: string }[]} options - all tags from API
 * @param {{ id?: number|null, name: string }[]} value - selected tags (id null for not-yet-created)
 * @param {(tags: { id?: number|null, name: string }[]) => void} onChange
 * @param {boolean} [noCreate] - hide "create new tag" row (e.g. filter-only)
 * @param {"grid"|"stacked"} [layout] - grid: form row; stacked: typeahead then chips below
 * @param {string} [containerClassName] - overrides outer wrapper classes when set
 * @param {string} [comboboxName] - placeholder on the typeahead input
 */
export default function TagMultiSelect({
  options,
  value,
  onChange,
  className,
  noCreate = false,
  layout = "grid",
  containerClassName,
  comboboxName = "Add tag",
}) {
  const { comboKey, handleSelect, removeTag, availableOptions } = useTagPicker(
    options,
    value,
    onChange,
  );

  const outerClass =
    containerClassName ??
    (layout === "stacked"
      ? "flex flex-col gap-2"
      : "grid grid-cols-3 grid-rows-1 gap-3");

  const comboWrapClass =
    layout === "stacked" ? "min-w-0 w-full" : "col-start-1 row-start-1 min-w-0";

  const chipsInner = (
    <div className="flex min-h-10 flex-wrap gap-2">
      {value.map((tag) => (
        <Tag key={tag.id ?? `new-${tag.name}`} onRemove={() => removeTag(tag)}>
          {tag.name}
        </Tag>
      ))}
    </div>
  );

  return (
    <div className={outerClass}>
      <div className={comboWrapClass}>
        <ComboboxCreate
          key={comboKey}
          name={comboboxName}
          options={availableOptions}
          value={null}
          onChange={handleSelect}
          noCreate={noCreate}
          className={
            className ??
            "grow rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none"
          }
        />
      </div>
      {layout === "stacked" ? (
        chipsInner
      ) : (
        <div className="row-start-1 col-start-2 col-span-2 flex items-center ">
          {chipsInner}
        </div>
      )}
    </div>
  );
}
