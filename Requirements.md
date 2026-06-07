# Sistema Uberloxa — Requisitos del Proyecto

## Requisitos Funcionales

### Gestión de Clientes
- Registrar, editar y desactivar clientes
- Campos: nombre, teléfono, teléfono alternativo, sector, dirección, descripción, link Google Maps
- Búsqueda y filtrado por nombre, teléfono y sector
- Migración inicial de ~4,667 clientes desde Excel

### Gestión de Sectores
- Crear y editar sectores geográficos
- Asociar clientes a sectores

### Gestión de Unidades (Taxis)
- Registrar unidades con placa, marca, modelo, color, año, chofer y teléfono del chofer
- Editar datos de la unidad (incluyendo chofer asignado)

### Gestión de Carreras
- Crear carrera asociando cliente y unidad
- Estados: `pendiente`, `asignada`, `en_curso`, `completada`, `cancelada`, `perdida`
- Registrar fecha/hora de creación y fecha/hora de finalización
- Historial completo de cambios de estado con timestamp

### Reportes y Trazabilidad
- Carreras por día, semana, mes y rango de fechas personalizado
- Filtros por hora del día (horarios pico)
- Carreras por estado (completadas, canceladas, perdidas)
- Ranking de unidades por número de carreras
- Historial de carreras por cliente
- Tiempo promedio de atención

### Autenticación
- Login con usuario y contraseña para la central
- Sesión con JWT

---

## Requisitos No Funcionales

### Rendimiento
- Soporte para cientos de miles de registros de carreras
- Índices optimizados en campos de consulta frecuente
- Caché con Redis para reportes de alta demanda
- Paginación en todas las listas

### Escalabilidad
- Arquitectura monorepo preparada para crecer
- Base de datos dockerizada replicable en producción
- Deploy en Railway con PostgreSQL gestionado

### Seguridad
- Contraseñas hasheadas con bcrypt
- Autenticación JWT con expiración
- Variables de entorno para credenciales (nunca en código)

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Base de datos | PostgreSQL | 16 |
| Caché | Redis | 7 |
| ORM | Prisma | 7 |
| Backend | NestJS + TypeScript | 11 |
| Frontend | React + Vite + TypeScript | 5 |
| Gestor de paquetes | pnpm | 10 |
| Monorepo | Turborepo | 2 |
| Contenedores | Docker + Docker Compose | - |
| Deploy | Railway | - |

---

## Requisitos del Entorno de Desarrollo

- Node.js >= 20
- pnpm >= 10
- Docker Desktop
- Git