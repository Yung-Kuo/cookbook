export default function FormRadioOption({
  name,
  value,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-md focus-within:outline-none">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-950 peer-checked:[&>.radio-dot]:opacity-100"
      >
        <span className="radio-dot h-4 w-4 rounded-full bg-red-300 opacity-0 transition-opacity" />
      </span>

      <div className="text-2xl">
        <span className="text-neutral-300">{title} </span>
        <span className="text-neutral-500">{description}</span>
      </div>
    </label>
  );
}
