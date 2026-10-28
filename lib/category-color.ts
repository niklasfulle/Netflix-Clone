// Alternating hues and lightness levels stay readable against the dark player.
export const CATEGORY_COLOR_PALETTE = [
  '#38BDF8', '#FB7185', '#A3E635', '#C084FC', '#FBBF24', '#2DD4BF',
  '#F472B6', '#818CF8', '#FB923C', '#4ADE80', '#E879F9', '#22D3EE',
  '#F87171', '#60A5FA', '#FACC15', '#34D399', '#A78BFA', '#F9A8D4',
  '#BEF264', '#FDA4AF', '#67E8F9', '#D8B4FE', '#FDBA74', '#86EFAC',
  '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#D97706', '#0891B2',
  '#DB2777', '#65A30D',
] as const;

export const CATEGORY_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
export type CategoryColor = { id: string; color?: string | null };

export function categoryColor({ id, color }: CategoryColor): string {
  if (color && CATEGORY_COLOR_PATTERN.test(color)) return color.toUpperCase();
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ (character.codePointAt(0) ?? 0), 16777619) >>> 0;
  return CATEGORY_COLOR_PALETTE[hash % CATEGORY_COLOR_PALETTE.length];
}

function channels(color: string) {
  return [1, 3, 5].map(offset => Number.parseInt(color.slice(offset, offset + 2), 16));
}

export function suggestedCategoryColor(colors: readonly (string | null | undefined)[]): string {
  const used = colors.filter((color): color is string => Boolean(color && CATEGORY_COLOR_PATTERN.test(color))).map(color => color.toUpperCase());
  const usage = CATEGORY_COLOR_PALETTE.map(color => used.filter(value => value === color).length);
  const minimumUsage = Math.min(...usage);
  let best: string = CATEGORY_COLOR_PALETTE[0];
  let bestDistance = -1;
  CATEGORY_COLOR_PALETTE.forEach((color, index) => {
    if (usage[index] !== minimumUsage) return;
    const rgb = channels(color);
    const distance = used.length ? Math.min(...used.map(value => {
      const other = channels(value);
      return rgb.reduce((sum, channel, offset) => sum + (channel - other[offset]) ** 2, 0);
    })) : 0;
    if (distance > bestDistance) { best = color; bestDistance = distance; }
  });
  return best;
}
