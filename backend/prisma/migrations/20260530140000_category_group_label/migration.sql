-- Grupo/sección opcional: mismo nombre en la misma sucursal (ej. Sub 12 Grupo A y Grupo B)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "groupLabel" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "categories_name_branchId_key";

-- Si hay varias filas con el mismo nombre en la misma sucursal, asignar groupLabel distinto
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, "branchId"
      ORDER BY "createdAt", id
    ) AS rn
  FROM "categories"
)
UPDATE "categories" AS c
SET "groupLabel" = CASE
  WHEN r.rn = 1 THEN ''
  ELSE 'Grupo ' || r.rn::text
END
FROM ranked AS r
WHERE c.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_branchId_groupLabel_key"
  ON "categories"("name", "branchId", "groupLabel");
