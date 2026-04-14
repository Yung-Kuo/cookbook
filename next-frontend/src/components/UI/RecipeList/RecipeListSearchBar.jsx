"use client";

import TagChipTray from "@/components/tags/TagChipTray";
import TagCombobox from "@/components/tags/TagCombobox";
import { useTagPicker } from "@/components/tags/useTagPicker";

const COMBOBOX_CLASS =
  "h-10 w-full min-w-0 rounded-md border-2 border-transparent bg-neutral-900 px-3 text-lg text-neutral-100 !placeholder-neutral-500 focus:border-sky-600 focus:outline-none";

export default function RecipeListSearchBar({
  search,
  onSearchChange,
  tags,
  selectedFilterTags,
  onFilterTagsChange,
}) {
  const { comboKey, handleSelect, removeTag, availableOptions } = useTagPicker(
    tags,
    selectedFilterTags,
    onFilterTagsChange,
  );

  return (
    <div className="relative isolate z-10 flex shrink-0 flex-col gap-2 bg-neutral-800 px-4 py-3 shadow-md shadow-neutral-900/50 lg:px-6">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={onSearchChange}
          className="h-10 w-full min-w-0 rounded-md border-2 border-transparent bg-neutral-900 px-3 text-lg text-neutral-100 placeholder-neutral-500 focus:border-sky-600 focus:outline-none"
        />
        <div className="">
          <TagCombobox
            comboKey={comboKey}
            name="Tags"
            options={availableOptions}
            onChange={handleSelect}
            noCreate
            className={COMBOBOX_CLASS}
          />
        </div>
      </div>
      <TagChipTray tags={selectedFilterTags} onRemoveTag={removeTag} />
    </div>
  );
}
