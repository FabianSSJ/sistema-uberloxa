# Sistema Uberloxa

Sistema web de gestión y despacho de carreras para central de taxis. Permite registrar clientes, unidades, asignar carreras y generar reportes de trazabilidad completos.

---

## Estructura del Proyecto

```
sistema-uberloxa/
├── apps/
│   ├── frontend/         # React + Vite (interfaz de la central)
│   └── backend/          # NestJS + Prisma (API REST)
├── docker-compose.yml    # PostgreSQL dockerizado
├── turbo.json            # Configuración de Turborepo
├── pnpm-workspace.yaml   # Workspace de pnpm
└── package.json          # Scripts raíz
```

---

## Requisitos Previos

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 10
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/FabianSSJ/sistema-uberloxa.git
cd sistema-uberloxa
```

### 2. Instalar dependencias

```bash
pnpm install
pnpm approve-builds
```

### 3. Levantar la base de datos

```bash
docker-compose up -d
```

### 4. Configurar variables de entorno

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edita `apps/backend/.env` con tus credenciales.

### 5. Correr migraciones

```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

---

## Desarrollo

Desde la raíz del proyecto, en terminales separadas:

```bash
# Frontend → http://localhost:5174
pnpm dev:frontend

# Backend → http://localhost:3000
pnpm dev:backend
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL 16 |
| ORM | Prisma 7 |
| Backend | NestJS + TypeScript |
| Frontend | React + Vite + TypeScript |
| Monorepo | Turborepo + pnpm |
| Contenedores | Docker |
| Deploy | Railway |

---

## Base de Datos

El esquema incluye 7 tablas normalizadas:

- `usuarios` — acceso de la central al sistema
- `sectores` — zonas geográficas
- `clientes` — base de ~4,667 clientes migrados desde Excel
- `marcas` / `modelos` — catálogo de vehículos
- `unidades` — taxis registrados con chofer asignado
- `carreras` — registro de cada servicio con estado y timestamps
- `historial_estados_carrera` — trazabilidad completa de cambios de estado

---

## Scripts Disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev:frontend` | Inicia el frontend en modo desarrollo |
| `pnpm dev:backend` | Inicia el backend en modo desarrollo |
| `pnpm build` | Build de todos los proyectos |
| `docker-compose up -d` | Levanta PostgreSQL |
| `docker-compose down` | Detiene PostgreSQL |