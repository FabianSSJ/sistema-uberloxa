-- Marca si la carrera es una encomienda (envío de paquete) en vez de un viaje de pasajero.
ALTER TABLE "carreras" ADD COLUMN "es_encomienda" BOOLEAN NOT NULL DEFAULT false;
