"use client";

import Tag from "../Tag";

const VARIANT_CLASS = {
  compact:
    "flex min-h-10 min-w-0 flex-wrap gap-2 rounded-md bg-neutral-900/50 px-2 py-2",
  field:
    "flex min-h-32 min-w-0 flex-wrap content-start gap-2 rounded-md border-2 border-neutral-700 bg-neutral-900/60 px-3 py-3",
};

export default function TagChipTray({
  tags,
  onRemoveTag,
  variant = "compact",
  placeholder,
  className,
}) {
  const baseClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.compact;
  const rootClass = className ?? baseClass;
  const showPlaceholder = Boolean(placeholder) && tags.length === 0;

  return (
    <div className={rootClass}>
      {showPlaceholder ? (
        <span className="text-lg text-neutral-500">{placeholder}</span>
      ) : (
        tags.map((tag) => (
          <Tag
            key={tag.id ?? `new-${tag.name}`}
            onRemove={() => onRemoveTag(tag)}
          >
            {tag.name}
          </Tag>
        ))
      )}
    </div>
  );
}
