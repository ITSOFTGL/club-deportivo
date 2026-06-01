-- Permite el mismo nombre de categoría en distintas sucursales (ej. Sub 10 en Norte y Sub 10 en Sur)
DROP INDEX IF EXISTS "categories_name_key";

CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_branchId_key" ON "categories"("name", "branchId");
