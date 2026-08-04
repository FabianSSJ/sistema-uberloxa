-- Momento hasta el cual la unidad está ocupada por una carrera (15 min por defecto).
-- Pasado este instante, la unidad se auto-libera (vuelve a 'disponible') al leerse.
ALTER TABLE "unidades" ADD COLUMN "ocupado_hasta" TIMESTAMP(3);
