# Manual de Entornos de Base de Datos (Producción vs Pruebas)

Este proyecto usa **dos bases de datos** dentro del mismo contenedor Docker de PostgreSQL
(`uberloxa_db`, puerto `5436`), para no tocar la data real mientras se testea.

| Base | Rol | Para qué |
|------|-----|----------|
| `uberloxa_db` | **PRODUCCIÓN** | Información real y valiosa. |
| `uberloxa_test_db` | **PRUEBAS** | Entorno aislado para hacer locuras, borrar y testear sin miedo. |

> **Gestor de paquetes:** este repo usa **pnpm** (no npm). Todos los comandos van con `pnpm`.

> **Migraciones:** el proyecto migró de `prisma db push` a **migraciones versionadas**
> (`prisma migrate`). Nunca uses `db push`: rompe el historial de migraciones.

---

## 🔄 Cómo elegir a qué base te conectás

La conexión sale de `DATABASE_URL`. Hay dos formas:

### Opción A — Por archivo `.env` (la conexión por defecto)

Editá `apps/backend/.env` y apuntá la URL a la base que quieras:

```env
# Pruebas
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db?schema=public"

# Producción
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_db?schema=public"
```

> ⚠️ El `.env` (y el `.env.test`) están **gitignoreados**: contienen credenciales y no van al repo.

### Opción B — Inline para un comando puntual (recomendado para seeds/migraciones a test)

No tocás el `.env`; le pasás la URL solo a ese comando. Así no te olvidás de volver a producción:

```bash
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db?schema=public" \
  pnpm prisma migrate status
```

---

## 🛠️ Migraciones (desde `apps/backend`)

```bash
# Crear + aplicar una migración nueva (entorno de desarrollo)
pnpm prisma migrate dev --name <nombre_descriptivo>

# Aplicar las migraciones existentes a una base (sin crear nuevas)
pnpm prisma migrate deploy

# Regenerar el cliente Prisma tras tocar el schema (OBLIGATORIO)
pnpm prisma generate

# Ver el estado de migraciones de la base actual
pnpm prisma migrate status

# ⚠️ DESTRUCTIVO: borra y recrea la base aplicando todas las migraciones desde cero
pnpm prisma migrate reset
```

> Tras cualquier cambio de `schema.prisma`, corré **`pnpm prisma generate`** o el backend
> compilará contra tipos viejos (cliente desactualizado = errores de tipos fantasma).

### Enums del schema
Los estados se modelan como **enums de PostgreSQL** (buena práctica DBA, validación en la base):
- `EstadoCarrera`: `pendiente · asignada · completada · cancelada · perdida`
- `EstadoUnidad`: `disponible · ocupado · inactivo`
- `RolUsuario`: `SUPERADMIN · ADMIN · CHARLIE`

---

## 🌱 Sembrar data (seeds)

Los seeds son scripts TypeScript que se corren con **`tsx`** (no `npm run seed`):

```bash
# Usuarios del sistema (5: 1 superadmin, 1 admin, 3 charlie) — idempotente
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db?schema=public" \
  pnpm exec tsx src/scripts/seed-usuarios.ts

# Clientes masivos desde el Excel parseado (3995 clientes + sectores)
# Sin --apply hace dry-run; con --apply TRUNCA y recarga.
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db?schema=public" \
  pnpm exec tsx src/scripts/seed-completo.ts --apply
```

> `seed-completo.ts` lee `_parsed_full.json` (artefacto local del parser de migración,
> gitignoreado). Si no lo tenés, regeneralo con el parser antes de correrlo.

---

## 🚀 Levantar la app

```bash
pnpm install                      # en la raíz, una vez
cd apps/backend && pnpm start:dev # backend  → http://localhost:3000 (Swagger en /docs)
cd apps/frontend && pnpm dev      # frontend → http://localhost:5173
```

---

**Nota de seguridad:** antes de borrar cosas desde la interfaz, **fijate a qué base estás
conectado**. Las credenciales de arriba son del Docker **local de desarrollo**, no de un
servidor real. Hay un backup en `backup_produccion_uberloxa.sql` por las dudas (también gitignoreado).
