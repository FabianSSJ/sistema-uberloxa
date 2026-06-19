# Manual de Entornos de Base de Datos (Producción vs Pruebas)

Este proyecto cuenta con dos bases de datos dentro de tu contenedor Docker para mantener la integridad de la información real.

1. **`uberloxa_db`**: Es la base de datos de PRODUCCIÓN. Aquí está la información real y valiosa.
2. **`uberloxa_test_db`**: Es la base de datos de PRUEBAS. Es un entorno aislado para hacer locuras, borrar registros y testear el sistema sin miedo.

---

## 🔄 Cómo cambiar entre Producción y Pruebas

Para decirle al sistema a qué base de datos conectarse, debes modificar el archivo `.env` que está en `apps/backend/.env`.

### 1. Para hacer PRUEBAS (Entorno Aislado)

1. Abre `apps/backend/.env`.
2. Cambia la variable `DATABASE_URL` para que apunte a la base de pruebas:
   ```env
   DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_test_db"
   ```
3. Si la base está vacía o hiciste cambios, debes empujar la estructura y sembrar data:
   Abre una terminal en `apps/backend` y ejecuta:
   ```bash
   npx prisma db push
   npm run seed
   ```

### 2. Para volver a PRODUCCIÓN (Datos Reales)

1. Abre `apps/backend/.env`.
2. Regresa la variable `DATABASE_URL` a la base de datos principal:
   ```env
   DATABASE_URL="postgresql://uberloxa:uberloxa123@localhost:5436/uberloxa_db"
   ```
3. ¡Listo! Al refrescar la página, volverás a ver tus datos reales.

---

**Nota de Seguridad:** Siempre fíjate en qué base de datos estás conectado antes de eliminar cosas desde la interfaz. 
Hay un backup SQL guardado en `backup_produccion_uberloxa.sql` por cualquier emergencia.
