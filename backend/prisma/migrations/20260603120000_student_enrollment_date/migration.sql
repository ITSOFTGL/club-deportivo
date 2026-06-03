-- Fecha de ingreso/inscripción del alumno (ancla de mensualidad, distinta del pago)
ALTER TABLE "students" ADD COLUMN "enrollmentDate" TIMESTAMP(3);

UPDATE "students" SET "enrollmentDate" = "createdAt" WHERE "enrollmentDate" IS NULL;

ALTER TABLE "students" ALTER COLUMN "enrollmentDate" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "enrollmentDate" SET DEFAULT CURRENT_TIMESTAMP;
