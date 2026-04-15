/**
 * Shared shell for profile tabs that use a top action area, loading/empty copy, and a card grid.
 *
 * @param {{
 *   loading: boolean,
 *   emptyMessage: string,
 *   itemCount: number,
 *   actionBar?: import("react").ReactNode,
 *   className?: string,
 *   children: import("react").ReactNode,
 * }} props
 */
export default function CardGridSection({
  loading,
  emptyMessage,
  itemCount,
  actionBar = null,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      {actionBar}
      {loading && (
        <p className="text-lg text-neutral-400 lg:text-2xl">Loading…</p>
      )}
      {!loading && itemCount === 0 && (
        <p className="text-lg text-neutral-500 lg:text-2xl">{emptyMessage}</p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {children}
      </ul>
    </div>
  );
}
