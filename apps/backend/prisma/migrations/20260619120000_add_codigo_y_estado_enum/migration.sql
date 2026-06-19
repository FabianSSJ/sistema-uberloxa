-- CreateEnum
CREATE TYPE "EstadoCarrera" AS ENUM ('pendiente', 'asignada', 'completada', 'cancelada', 'perdida');

-- DropForeignKey (modelo_id pasa a nullable)
ALTER TABLE "unidades" DROP CONSTRAINT "unidades_modelo_id_fkey";

-- AlterTable: clientes -> nuevo codigo
ALTER TABLE "clientes" ADD COLUMN     "codigo" INTEGER;

-- AlterTable: carreras.estado TEXT -> EstadoCarrera (preservando datos existentes)
ALTER TABLE "carreras" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "carreras" ALTER COLUMN "estado" TYPE "EstadoCarrera" USING ("estado"::"EstadoCarrera");
ALTER TABLE "carreras" ALTER COLUMN "estado" SET DEFAULT 'pendiente';

-- AlterTable: historial_estados_carrera TEXT -> EstadoCarrera (preservando datos)
ALTER TABLE "historial_estados_carrera" ALTER COLUMN "estado_anterior" TYPE "EstadoCarrera" USING ("estado_anterior"::"EstadoCarrera");
ALTER TABLE "historial_estados_carrera" ALTER COLUMN "estado_nuevo" TYPE "EstadoCarrera" USING ("estado_nuevo"::"EstadoCarrera");

-- AlterTable: unidades -> numero_unidad, vehiculo, modelo_id nullable
ALTER TABLE "unidades" ADD COLUMN     "numero_unidad" TEXT,
ADD COLUMN     "vehiculo" TEXT,
ALTER COLUMN "modelo_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_numero_unidad_key" ON "unidades"("numero_unidad");

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
