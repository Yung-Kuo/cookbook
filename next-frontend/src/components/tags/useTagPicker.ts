import { useState, useMemo } from "react"
import type { ComboboxOptionItem } from "@/components/inputs/ComboboxCreatable"
import type { Tag } from "@/types"

const comboItemToTag = (selected: ComboboxOptionItem): Tag => ({
  id: selected.id ?? undefined,
  name: selected.name.trim(),
})

/** State for TagCombobox + TagChipTray (e.g. recipe list filter, new recipe form). */
export const useTagPicker = (
  options: Tag[],
  value: Tag[],
  onChange: (tags: Tag[]) => void,
) => {
  const [comboKey, setComboKey] = useState(0)

  const handleSelect = (selected: ComboboxOptionItem | null) => {
    if (!selected || !selected.name?.trim()) return
    const tag = comboItemToTag(selected)
    const exists = value.some((t) =>
      t.id != null && tag.id != null
        ? t.id === tag.id
        : t.name.toLowerCase() === tag.name.toLowerCase(),
    )
    if (exists) return
    onChange([...value, tag])
    setComboKey((k) => k + 1)
  }

  const removeTag = (tag: Tag) => {
    onChange(
      value.filter((t) =>
        t.id != null && tag.id != null ? t.id !== tag.id : t.name !== tag.name,
      ),
    )
  }

  const availableOptions = useMemo((): ComboboxOptionItem[] => {
    return options
      .filter((o) => !value.some((v) => v.id != null && v.id === o.id))
      .map((o) => ({ id: o.id ?? null, name: o.name }))
  }, [options, value])

  return { comboKey, handleSelect, removeTag, availableOptions }
}
