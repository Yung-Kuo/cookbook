const SIZES = {
  /** Box 20×20px, checkmark 16×16px */
  sm: { box: "h-5 w-5", icon: "h-4 w-4" },
  /** Box 24×24px, checkmark 20×20px */
  md: { box: "h-6 w-6", icon: "h-5 w-5" },
};

export default function CheckboxLabel({
  checked,
  onChange,
  disabled = false,
  children,
  size = "sm",
}) {
  const { box, icon } = SIZES[size] ?? SIZES.sm;

  return (
    <label className="flex cursor-pointer items-center gap-4 rounded focus-within:outline-none hover:bg-neutral-800 has-[:disabled]:cursor-not-allowed">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex shrink-0 items-center justify-center rounded border-2 border-neutral-500 bg-transparent peer-checked:border-red-300 peer-focus-visible:ring-2 peer-focus-visible:ring-red-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-neutral-900 peer-disabled:opacity-50 peer-checked:[&>svg]:opacity-100 ${box}`.trim()}
      >
        <svg
          className={`text-red-300 opacity-0 transition-opacity ${icon}`.trim()}
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.5 6L5 8.5L9.5 3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </label>
  );
}
