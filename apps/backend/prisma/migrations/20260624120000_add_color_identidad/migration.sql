-- Color de identidad UI: operador (Charlie) y unidad de taxi.
-- usuarios.color           -> key de paleta del Charlie (verde, azul, negro, rojo, ...)
-- unidades.color_identidad -> key de paleta de la unidad (separado del color FISICO del auto en unidades.color)
ALTER TABLE "usuarios" ADD COLUMN "color" TEXT;
ALTER TABLE "unidades" ADD COLUMN "color_identidad" TEXT;

-- Backfill de continuidad: preservar los colores que ya tenian los 4 Charlies actuales
-- (antes hardcodeados por nombre en el frontend, ahora persistidos en la DB).
UPDATE "usuarios" SET "color" = 'verde' WHERE lower("nombre") LIKE '%carmita%';
UPDATE "usuarios" SET "color" = 'azul'  WHERE lower("nombre") LIKE '%alejandra%';
UPDATE "usuarios" SET "color" = 'negro' WHERE lower("nombre") LIKE '%gabriel%';
UPDATE "usuarios" SET "color" = 'rojo'  WHERE lower("nombre") LIKE '%kathia%';
