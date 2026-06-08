# Guía de Migración de Clientes (Excel a Base de Datos)

Esta guía detalla el proceso paso a paso para migrar el resto de los clientes desde el archivo `CLIENTES UBER ACTUALIZADA 2025.xlsx` hacia la base de datos de forma prolija, de 50 en 50 registros.

> [!IMPORTANT]
> El objetivo de migrar en bloques de 50 es permitir una curaduría manual de los datos, dado que el Excel original tiene inconsistencias (nombres de sectores mezclados con direcciones, notas extrañas, etc.).

## 1. Extraer el Lote desde el Excel hacia Markdown

No tienes que abrir el Excel ni copiar y pegar a mano. Hemos diseñado un script extractor que saca los clientes, aplica una heurística básica para separar el sector de la dirección y crea el archivo Markdown automáticamente.

Abre la terminal, ubícate en la carpeta `apps/backend` y usa el comando extractor pasando el número de registros que vas a saltar (`--skip=X`).

```bash
# Navegar al backend
cd apps/backend

# Extraer los segundos 50 registros (filas 51 a 100)
npx tsx src/scripts/extract-to-md.ts --skip=50

# Para el siguiente lote, sumarías 50 más:
# npx tsx src/scripts/extract-to-md.ts --skip=100
```

Este comando escribirá la tabla en el archivo `preview_clientes.md` en la raíz del proyecto.

## 2. Revisión Humana y Limpieza (Criterios Clave)

Abre el archivo generado `preview_clientes.md` y revisa la tabla prestando atención a lo siguiente:

- **Separar Sector de Dirección:** Si en la columna de Dirección ves que inicia con el sector (o el script cortó mal), arréglalo pasándolo a la columna `SECTOR`.
- **Datos basura a Notas:** Cualquier dato que no sea una dirección o un sector (ej: "camioneta marcelo", códigos raros, etc.) muévelo a la columna `NOTAS EXTRA`.
- **Campos Vacíos:** Si un cliente no tiene sector definido porque el Excel era ilegible, déjalo vacío.

## 3. Reglas Automáticas (No hacer a mano)

No te preocupes por arreglar mayúsculas o abreviaciones. El script de inyección se encarga automáticamente de:

1. **Title Case:** Todo se formatea automáticamente (ej. `ESTEBAN GODOY` -> `Esteban Godoy`).
2. **Corrección de CDLA:** `Cdla` o `Cdad` se transforman en `Ciudadela` y `Ciudad`.
3. **Casos Específicos:** 
   - `Ciudadela Zarzas` -> `Zarzas`
   - `Las Pitas` -> `Pitas`
   - `La Argelia` -> `Argelia`

> [!TIP]
> Si descubres más sectores problemáticos, agrega nuevas reglas de reemplazo en la función `normalizeSector` dentro del archivo `seed-excel.ts`.

## 4. Inyectar a la Base de Datos

Una vez que la tabla en `preview_clientes.md` esté impecable, ejecuta la inyección (asegúrate de tener Docker corriendo para la DB local):

```bash
# Estando en apps/backend
npx tsx src/scripts/seed-excel.ts
```

> [!NOTE]
> El script usa un `upsert` para los Sectores. Esto significa que si el sector ya existe en la base de datos, simplemente lo reutiliza y enlaza al cliente, evitando duplicados.
> Los clientes se insertan sin comprobar duplicados para mantener historial si existen homónimos, excepto si tú lo decides en el futuro.

## 5. Repetir el Ciclo

Cuando el script finalice, repite el paso 1 aumentando el valor de `--skip`.
Ejemplo: `--skip=50` -> `--skip=100` -> `--skip=150` hasta terminar el Excel.
