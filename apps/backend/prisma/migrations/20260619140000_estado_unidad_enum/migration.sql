-- CreateEnum
CREATE TYPE "EstadoUnidad" AS ENUM ('disponible', 'ocupado', 'inactivo');

-- AlterTable: unidades -> nuevo estado (default disponible)
ALTER TABLE "unidades" ADD COLUMN "estado" "EstadoUnidad" NOT NULL DEFAULT 'disponible';
