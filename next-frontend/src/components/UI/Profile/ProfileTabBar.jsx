"use client";

/**
 * @param {{
 *   tabs: string[],
 *   activeTab: string,
 *   onTabChange: (tab: string) => void,
 *   labels: Record<string, string>,
 * }} props
 */
export default function ProfileTabBar({
  tabs,
  activeTab,
  onTabChange,
  labels,
}) {
  return (
    <div className="mb-4 flex overflow-x-auto border-b border-neutral-600">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onTabChange(tab)}
          className={`flex flex-1 flex-grow cursor-pointer items-center justify-center border-b-2 py-2 text-lg font-bold transition-colors lg:py-3 lg:text-2xl ${
            activeTab === tab
              ? "border-red-300 bg-neutral-900/50 text-red-300"
              : "border-transparent text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {labels[tab]}
        </button>
      ))}
    </div>
  );
}
