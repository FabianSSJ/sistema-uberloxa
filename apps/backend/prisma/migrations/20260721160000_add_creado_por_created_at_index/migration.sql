-- Índice compuesto para acelerar las consultas por operador (Charlie) + rango de fecha:
-- panel de "hoy" y el historial paginado filtran por creado_por + created_at juntos.
CREATE INDEX "carreras_creado_por_created_at_idx" ON "carreras"("creado_por", "created_at");
