"use client"

import ComboboxCreate from "@/components/inputs/ComboboxCreatable"
import type { ComboboxOptionItem } from "@/components/inputs/ComboboxCreatable"

type TagComboboxProps = {
  comboKey: number
  name: string
  options: ComboboxOptionItem[]
  onChange: (value: ComboboxOptionItem | null) => void
  noCreate?: boolean
  className?: string
}

export default function TagCombobox({
  comboKey,
  name,
  options,
  onChange,
  noCreate = false,
  className,
}: TagComboboxProps) {
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
  )
}
