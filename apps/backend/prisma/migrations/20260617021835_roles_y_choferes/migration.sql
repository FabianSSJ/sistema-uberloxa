-- AlterTable
ALTER TABLE "unidades" ADD COLUMN     "chofer_id" INTEGER,
ALTER COLUMN "chofer_nombre" DROP NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "modulos_permitidos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rol" TEXT NOT NULL DEFAULT 'CHARLIE';

-- CreateTable
CREATE TABLE "choferes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "choferes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unidades_chofer_id_idx" ON "unidades"("chofer_id");

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_chofer_id_fkey" FOREIGN KEY ("chofer_id") REFERENCES "choferes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Insert unique choferes from unidades
INSERT INTO "choferes" ("nombre", "telefono")
SELECT DISTINCT "chofer_nombre", "chofer_telefono" 
FROM "unidades" 
WHERE "chofer_nombre" IS NOT NULL;

-- Data Migration: Link unidades to choferes
UPDATE "unidades" u
SET "chofer_id" = c.id
FROM "choferes" c
WHERE u."chofer_nombre" = c."nombre"
AND (u."chofer_telefono" = c."telefono" OR (u."chofer_telefono" IS NULL AND c."telefono" IS NULL));
