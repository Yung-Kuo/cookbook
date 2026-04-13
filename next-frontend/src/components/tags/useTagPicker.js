import { useState, useMemo } from "react";

/** State for TagCombobox + TagChipTray (e.g. recipe list filter, new recipe form). */
export function useTagPicker(options, value, onChange) {
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
        t.id != null && tag.id != null ? t.id !== tag.id : t.name !== tag.name,
      ),
    );
  };

  const availableOptions = useMemo(
    () =>
      options.filter(
        (o) => !value.some((v) => v.id != null && v.id === o.id),
      ),
    [options, value],
  );

  return { comboKey, handleSelect, removeTag, availableOptions };
}
