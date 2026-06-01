-- Reparación manual cuando _prisma_migrations dice "applied" pero groupLabel no existe.
-- Ejecutar en producción (misma BD que usa el API):
--   cd /var/www/club-deportivo/backend
--   npx prisma db execute --file prisma/scripts/repair-category-group-label.sql
-- o: psql "$DATABASE_URL" -f prisma/scripts/repair-category-group-label.sql

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "groupLabel" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "categories_name_branchId_key";

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
