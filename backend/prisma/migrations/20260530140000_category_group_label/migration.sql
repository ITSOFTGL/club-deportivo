-- Grupo/sección opcional: mismo nombre en la misma sucursal (ej. Sub 12 Grupo A y Grupo B)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "groupLabel" TEXT NOT NULL DEFAULT '';

DROP INDEX IF EXISTS "categories_name_branchId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_branchId_groupLabel_key"
  ON "categories"("name", "branchId", "groupLabel");
