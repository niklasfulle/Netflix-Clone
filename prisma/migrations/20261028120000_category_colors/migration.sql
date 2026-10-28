ALTER TABLE "Category" ADD COLUMN "color" VARCHAR(7);

-- Give existing categories distinct, persistent defaults without changing assignments.
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") - 1 AS position
  FROM "Category"
), palette AS (
  SELECT ARRAY[
    '#38BDF8', '#FB7185', '#A3E635', '#C084FC', '#FBBF24', '#2DD4BF',
    '#F472B6', '#818CF8', '#FB923C', '#4ADE80', '#E879F9', '#22D3EE',
    '#F87171', '#60A5FA', '#FACC15', '#34D399', '#A78BFA', '#F9A8D4',
    '#BEF264', '#FDA4AF', '#67E8F9', '#D8B4FE', '#FDBA74', '#86EFAC',
    '#2563EB', '#DC2626', '#16A34A', '#9333EA', '#D97706', '#0891B2',
    '#DB2777', '#65A30D'
  ] AS colors
)
UPDATE "Category" AS category
SET "color" = palette.colors[(numbered.position % ARRAY_LENGTH(palette.colors, 1) + 1)::INTEGER]
FROM numbered, palette
WHERE category."id" = numbered."id";

ALTER TABLE "Category" ADD CONSTRAINT "Category_color_check"
  CHECK ("color" IS NULL OR "color" ~ '^#[0-9A-Fa-f]{6}$');
