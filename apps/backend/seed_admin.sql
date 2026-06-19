INSERT INTO "usuarios" ("nombre", "username", "password_hash", "rol", "modulos_permitidos", "activo", "created_at") 
VALUES (
  'Administrador General', 
  'admin', 
  '$2b$10$UkQHNiC662NwkndlUuMVmeoioJ1VT9A/IRlc36u7hY2QwfwNPslEK', 
  'SUPERADMIN', 
  '{}', 
  true, 
  NOW()
) 
ON CONFLICT ("username") 
DO UPDATE SET "password_hash" = EXCLUDED."password_hash", "rol" = 'SUPERADMIN';
