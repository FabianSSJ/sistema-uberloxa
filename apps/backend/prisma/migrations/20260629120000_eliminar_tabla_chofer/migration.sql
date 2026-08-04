-- Elimina la entidad Chofer (vestigial). El conductor vive en unidades.chofer_nombre /
-- chofer_telefono (strings). Nada del sistema usaba la tabla choferes ni la relación chofer_id.

ALTER TABLE "unidades" DROP CONSTRAINT IF EXISTS "unidades_chofer_id_fkey";
DROP INDEX IF EXISTS "unidades_chofer_id_idx";
ALTER TABLE "unidades" DROP COLUMN IF EXISTS "chofer_id";
DROP TABLE IF EXISTS "choferes";
