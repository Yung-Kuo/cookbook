"use client";

import ComboboxCreate from "@/components/inputs/ComboboxCreatable";

// Tag pick list on top of ComboboxCreate; comboKey remounts after each select.
export default function TagCombobox({
  comboKey,
  name,
  options,
  onChange,
  noCreate = false,
  className,
}) {
  return (
    <ComboboxCreate
      key={comboKey}
      name={name}
      options={options}
      value={null}
      onChange={onChange}
      noCreate={noCreate}
      className={className}
    />
  );
}
