-- Coherencia cola/estado: una unidad fuera de la cola de despacho (activado_en NULL) está INACTIVA.
-- Antes el default era 'disponible', lo que mostraba como "Disponible" unidades que en realidad
-- no estaban en servicio. Ahora arrancan inactivas y se activan al entrar a la cola.

ALTER TABLE "unidades" ALTER COLUMN "estado" SET DEFAULT 'inactivo';

UPDATE "unidades" SET "estado" = 'inactivo'
WHERE "activado_en" IS NULL AND "estado" <> 'inactivo';
