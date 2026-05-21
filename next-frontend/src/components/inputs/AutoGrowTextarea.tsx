import type { ChangeEventHandler, TextareaHTMLAttributes } from "react"

type AutoGrowTextareaProps = {
  id?: string
  name?: string
  value: string
  onChange: ChangeEventHandler<HTMLTextAreaElement>
  rows?: number
  required?: boolean
  topMargin?: boolean
  fullWidth?: boolean
}

export default function AutoGrowTextarea({
  id,
  name,
  value,
  onChange,
  rows,
  required,
  topMargin = false,
  fullWidth = false,
}: AutoGrowTextareaProps) {
  const edge = topMargin ? "mt-2" : ""
  const gridClass = ["grid grid-cols-1 grid-rows-1", fullWidth ? "w-full" : ""]
    .filter(Boolean)
    .join(" ")
  const fieldClass = `z-10 col-start-1 row-start-1 ${edge} w-full resize-none rounded-md border-2 border-transparent bg-neutral-900 p-2 text-2xl text-neutral-100 focus:border-sky-600 focus:outline-none`
  const mirrorClass = `invisible col-start-1 row-start-1 ${edge} border-2 border-transparent p-2 text-2xl whitespace-pre-wrap`

  const textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement> = {
    id,
    name,
    value,
    onChange,
    rows,
    required,
    className: fieldClass,
  }

  return (
    <div className={gridClass}>
      <textarea {...textareaProps} />
      <span className={mirrorClass}>{value} </span>
    </div>
  )
}
