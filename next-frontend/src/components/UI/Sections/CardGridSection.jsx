/** Max columns at the widest breakpoint → responsive `grid-cols-*` utilities (Tailwind JIT). */
export const GRID_COL_PRESETS = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};

/**
 * Profile-style card grid: loading/empty copy and a responsive column grid.
 * Use `preset` (`"2"` … `"5"`) for common layouts, or `gridColsClassName` to override fully.
 */
export default function CardGridSection({
  loading,
  emptyMessage,
  itemCount,
  actionBar = null,
  className = "",
  preset = "5",
  gridColsClassName,
  children,
}) {
  const resolvedCols =
    gridColsClassName ??
    GRID_COL_PRESETS[preset] ??
    GRID_COL_PRESETS[5];

  return (
    <div className={className}>
      {actionBar}
      {loading && (
        <p className="text-lg text-neutral-400 lg:text-2xl">Loading…</p>
      )}
      {!loading && itemCount === 0 && (
        <p className="text-lg text-neutral-500 lg:text-2xl">{emptyMessage}</p>
      )}
      <ul className={`grid gap-3 ${resolvedCols}`}>
        {children}
      </ul>
    </div>
  );
}
