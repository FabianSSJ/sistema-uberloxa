-- Bloqueo de cuenta por intentos fallidos de login, independiente del throttle por IP.
-- En esta central de despacho toda la oficina comparte una sola IP, asi que un throttle
-- solo por IP diluye cualquier ataque dirigido a UNA cuenta puntual dentro del trafico
-- normal de logins de las demas Charlies. Este bloqueo es por username.
ALTER TABLE "usuarios" ADD COLUMN "intentos_fallidos" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "usuarios" ADD COLUMN "bloqueado_hasta" TIMESTAMP(3);
