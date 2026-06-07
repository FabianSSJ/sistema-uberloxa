# Backend — Sistema Uberloxa

API REST construida con NestJS + TypeScript + Prisma sobre PostgreSQL.

---

## Estructura

```
apps/backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   ├── clientes/
│   ├── sectores/
│   ├── unidades/
│   ├── carreras/
│   ├── usuarios/
│   └── common/           # Guards, interceptors, pipes compartidos
├── prisma/
│   ├── schema.prisma     # Esquema de la BD
│   └── migrations/       # Historial de migraciones
├── generated/
│   └── prisma/           # Cliente Prisma generado
├── prisma.config.ts      # Configuración de conexión Prisma
├── .env                  # Variables de entorno (no commitear)
└── .env.example          # Plantilla de variables de entorno
```

---

## Variables de Entorno

Crea un archivo `.env` en esta carpeta basado en `.env.example`:

```env
DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_db"
JWT_SECRET="tu_secret_seguro_aqui"
JWT_EXPIRES_IN="8h"
PORT=3000
```

---

## Instalación y Desarrollo

```bash
# Desde la raíz del monorepo
pnpm dev:backend

# O directamente desde esta carpeta
pnpm start:dev
```

El servidor corre en `http://localhost:3000`.

---

## Base de Datos

### Migraciones

```bash
# Crear y aplicar una nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Regenerar el cliente Prisma
npx prisma generate

# Ver la BD en el navegador
npx prisma studio
```

### Modelos

| Modelo | Tabla | Descripción |
|---|---|---|
| `Usuario` | `usuarios` | Acceso al sistema |
| `Sector` | `sectores` | Zonas geográficas |
| `Cliente` | `clientes` | Base de clientes |
| `Marca` | `marcas` | Marcas de vehículos |
| `Modelo` | `modelos` | Modelos de vehículos |
| `Unidad` | `unidades` | Taxis registrados |
| `Carrera` | `carreras` | Servicios de transporte |
| `HistorialEstadoCarrera` | `historial_estados_carrera` | Auditoría de estados |

### Estados de una Carrera

```
pendiente → asignada → en_curso → completada
                    ↘ cancelada
pendiente → perdida
```

---

## Módulos de la API

| Módulo | Ruta base | Descripción |
|---|---|---|
| Auth | `/auth` | Login y JWT |
| Usuarios | `/usuarios` | Gestión de usuarios |
| Sectores | `/sectores` | CRUD de sectores |
| Clientes | `/clientes` | CRUD de clientes |
| Marcas | `/marcas` | Catálogo de marcas |
| Modelos | `/modelos` | Catálogo de modelos |
| Unidades | `/unidades` | Gestión de taxis |
| Carreras | `/carreras` | Gestión de carreras |
| Reportes | `/reportes` | Estadísticas y trazabilidad |

---

## Índices de Rendimiento

Los siguientes índices están definidos en el schema para optimizar consultas de alta frecuencia:

- `carreras(created_at)` — filtros por fecha y hora
- `carreras(estado)` — conteos por estado
- `carreras(unidad_id, created_at)` — ranking de unidades
- `carreras(cliente_id)` — historial por cliente
- `clientes(telefono)` — búsqueda rápida por teléfono
- `historial_estados_carrera(fecha_hora)` — auditoría temporal