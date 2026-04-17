"use client";

import { useCallback, useState } from "react";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";
import ExpandableCircleButton from "@/components/UI/Buttons/ExpandableCircleButton";
import { RecipeActionShareIcon } from "@/components/UI/Recipe/RecipeActionRailIcons";

/**
 * Web Share API when available; otherwise copies URL to clipboard.
 */
export default function RecipeShareButton({
  title = "",
  text = "",
  url: urlProp,
  className = "",
  expandCircle = false,
}) {
  const [copied, setCopied] = useState(false);

  const getUrl = useCallback(() => {
    if (urlProp) return urlProp;
    if (typeof window !== "undefined") return window.location.href;
    return "";
  }, [urlProp]);

  const handleClick = useCallback(async () => {
    const url = getUrl();
    if (!url) return;

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: title || undefined,
          text: text || undefined,
          url,
        });
        return;
      } catch (e) {
        if (e?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [getUrl, title, text]);

  const label = copied ? "Copied!" : "Share";
  const aria = copied ? "Link copied" : "Share or copy link";
  const tip = copied ? "Copied!" : "Share recipe link";

  if (expandCircle) {
    return (
      <ExpandableCircleButton
        type="button"
        onClick={handleClick}
        title={tip}
        aria-label={aria}
        icon={<RecipeActionShareIcon />}
        label={label}
        className={className}
      />
    );
  }

  return (
    <RoundedButton
      type="button"
      onClick={handleClick}
      className={`border border-neutral-600 bg-neutral-800/80 text-neutral-100 hover:border-neutral-400 hover:bg-neutral-700/90 focus-visible:ring-2 focus-visible:ring-red-400/50 ${className}`}
      aria-label={aria}
      title={tip}
    >
      <RecipeActionShareIcon />
      <span>{label}</span>
    </RoundedButton>
  );
}
