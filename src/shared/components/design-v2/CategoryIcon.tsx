import type { ReactNode } from 'react';

/**
 * Category glyphs for design v2, traced from the design package's `IC` map.
 *
 * The app's `Category.icon` is an emoji, and v1 renders it directly — colourful
 * and platform-drawn, which is at odds with v2's line-drawn, single-colour
 * surfaces. These are the v2 substitutes, keyed by the same category ids so
 * nothing in the stored data has to change; v1 keeps its emoji.
 *
 * Custom categories have no design glyph, so they fall back to their emoji.
 */
const CATEGORY_PATHS: Record<string, ReactNode> = {
  'water-beverages': (
    <path d="M12 3s6 6.5 6 10.5A6 6 0 016 13.5C6 9.5 12 3 12 3z" />
  ),
  food: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M6 9h12M9 4V2.5h6V4" />
    </>
  ),
  'cooking-heat': (
    <path d="M12 3c1 2.5-1.5 3.5-1.5 6A2.5 2.5 0 0012 11.5 2.5 2.5 0 0014 8c1.8 1.4 3 3.4 3 5.6A5 5 0 017 14c0-3.8 3-6.5 5-11z" />
  ),
  'light-power': <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  'communication-info': (
    <>
      <path d="M4 11a8 8 0 018-8M7 11a5 5 0 015-5" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14 21a10 10 0 00-10-10" />
    </>
  ),
  'medical-health': (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M12 10v6M9 13h6M9 6V4h6v2" />
    </>
  ),
  'hygiene-sanitation': (
    <>
      <path d="M7 8h10l-1 11a2 2 0 01-2 2H10a2 2 0 01-2-2z" />
      <path d="M9 8V5a3 3 0 016 0v3" />
    </>
  ),
  'tools-supplies': (
    <path d="M14 6a3.5 3.5 0 01-4.6 4.6L4 16v4h4l5.4-5.4A3.5 3.5 0 0018 10l-2.2 2.2-1.8-.4-.4-1.8z" />
  ),
  'cash-documents': (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  pets: (
    <>
      <circle cx="8" cy="9" r="1.6" />
      <circle cx="16" cy="9" r="1.6" />
      <circle cx="5.5" cy="13" r="1.4" />
      <circle cx="18.5" cy="13" r="1.4" />
      <path d="M12 13c-2.5 0-4.5 2.2-4.5 4.2 0 1.5 1.3 2.3 2.6 1.9 1.2-.4 2.6-.4 3.8 0 1.3.4 2.6-.4 2.6-1.9 0-2-2-4.2-4.5-4.2z" />
    </>
  ),
};

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  /** Emoji to fall back to — custom categories have no design glyph. */
  fallback?: string;
  /** Stroke colour; defaults to the accent, as in the design. */
  color?: string;
}

export function CategoryIcon({
  categoryId,
  size = 18,
  fallback,
  color = 'var(--color-accent)',
}: Readonly<CategoryIconProps>) {
  const paths = CATEGORY_PATHS[categoryId];

  if (!paths) {
    return (
      <span aria-hidden="true" style={{ fontSize: size * 0.85, lineHeight: 1 }}>
        {fallback}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      {paths}
    </svg>
  );
}
