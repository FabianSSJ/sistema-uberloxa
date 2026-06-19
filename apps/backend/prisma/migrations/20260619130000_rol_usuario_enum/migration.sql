-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMIN', 'CHARLIE');

-- AlterTable: usuarios.rol TEXT -> RolUsuario (preservando datos existentes)
ALTER TABLE "usuarios" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "rol" TYPE "RolUsuario" USING ("rol"::"RolUsuario");
ALTER TABLE "usuarios" ALTER COLUMN "rol" SET DEFAULT 'CHARLIE';
