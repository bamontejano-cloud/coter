import { HTMLAttributes } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONTSIZE_PX: Record<AvatarSize, number> = {
  xs: 10,
  sm: 13,
  md: 15,
  lg: 20,
  xl: 28,
};

/**
 * Brand-tinted gradients used as the avatar fill. Index is chosen by a
 * deterministic hash of the name, so the same person always gets the same
 * color across pages (sidebar header vs. patient list, etc.).
 */
const GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ['#0f766e', '#14b8a6'], // teal-700 → teal-500 (brand)
  ['#1d4ed8', '#60a5fa'], // blue
  ['#7c3aed', '#c084fc'], // violet
  ['#be185d', '#f472b6'], // pink
  ['#b45309', '#fbbf24'], // amber
  ['#15803d', '#4ade80'], // green
  ['#0e7490', '#22d3ee'], // cyan
  ['#b91c1c', '#fb7185'], // red
];

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickIndex(name: string): number {
  return hash(name.trim().toLowerCase()) % GRADIENTS.length;
}

/**
 * Build "JD" from "John Doe", "MR" from "María Rosa", "JU" from "Juan"
 * (single name → first two letters). Diacritics are preserved.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Full display name — used both for initials and for hashing the gradient. */
  name: string;
  size?: AvatarSize;
  /** Optional override of the auto-picked gradient (index 0..GRADIENTS.length-1). */
  gradientIndex?: number;
}

/**
 * Pure-CSS avatar: the user's initials rendered over a deterministic gradient.
 * Used everywhere a user/patient identity is shown — no image uploads
 * required, so it works the very first time someone signs in.
 */
export function Avatar({
  name,
  size = 'md',
  gradientIndex,
  className = '',
  style,
  ...rest
}: AvatarProps) {
  const [, hi] = GRADIENTS[gradientIndex ?? pickIndex(name)];
  const [from, to] = GRADIENTS[gradientIndex ?? pickIndex(name)] as readonly [string, string];
  const initialsText = initials(name);
  const sizePx = SIZE_PX[size];
  const fontPx = FONTSIZE_PX[size];
  return (
    <span
      className={`avatar avatar--${size}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={name}
      style={{
        width: sizePx,
        height: sizePx,
        fontSize: fontPx,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        ...style,
      }}
      {...rest}
    >
      <span className="avatar__initials" aria-hidden="true">{initialsText}</span>
    </span>
  );
}
