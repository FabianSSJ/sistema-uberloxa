# Frontend — Sistema Uberloxa

Interfaz web para la central de despacho, construida con React + Vite + TypeScript.

---

## Estructura

```
apps/frontend/
├── public/               # Archivos estáticos
├── src/
│   ├── assets/           # Imágenes e íconos
│   ├── components/       # Componentes reutilizables
│   ├── pages/            # Vistas principales
│   ├── hooks/            # Custom hooks
│   ├── services/         # Llamadas a la API
│   ├── store/            # Estado global
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Funciones utilitarias
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── vite.config.js
```

---

## Instalación y Desarrollo

```bash
# Desde la raíz del monorepo
pnpm dev:frontend

# O directamente desde esta carpeta
pnpm dev
```

La app corre en `http://localhost:5174`.

---

## Stack Frontend

| Librería | Uso |
|---|---|
| React 18 | UI |
| Vite 5 | Bundler |
| TypeScript | Tipado |
| TanStack Query | Fetching y caché de datos |
| TanStack Table | Tablas virtualizadas para grandes volúmenes |
| React Router | Navegación |
| Axios | HTTP client |

---

## Vistas Principales

| Vista | Ruta | Descripción |
|---|---|---|
| Login | `/login` | Acceso de la central |
| Dashboard | `/` | Resumen del día |
| Carreras | `/carreras` | Lista y gestión de carreras |
| Nueva Carrera | `/carreras/nueva` | Crear carrera rápido |
| Clientes | `/clientes` | Base de clientes |
| Unidades | `/unidades` | Gestión de taxis |
| Reportes | `/reportes` | Estadísticas y filtros |

---

## Convenciones

- Componentes en PascalCase: `ClienteCard.tsx`
- Hooks con prefijo `use`: `useCarreras.ts`
- Servicios por módulo: `clientes.service.ts`
- Tipos en carpeta `types/`: `carrera.types.ts`

---

## Build para Producción

```bash
pnpm build
```

Los archivos de salida quedan en `dist/`.