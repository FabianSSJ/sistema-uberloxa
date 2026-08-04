-- Cola de despacho de unidades.

-- Nuevo estado 'descanso': pausa temporal que CONSERVA el turno en la cola.
ALTER TYPE "EstadoUnidad" ADD VALUE IF NOT EXISTS 'descanso';

-- Momento de activación: define pertenencia a la cola (no null = en cola) y el orden (FIFO por este timestamp).
ALTER TABLE "unidades" ADD COLUMN "activado_en" TIMESTAMP(3);
