import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- LIMPIEZA DE CARRERAS E HISTORIAL ---');

  const countHistorialAntes = await prisma.historialEstadoCarrera.count();
  const countCarrerasAntes = await prisma.carrera.count();

  console.log(`Carreras antes de la limpieza: ${countCarrerasAntes}`);
  console.log(`Registros de historial antes de la limpieza: ${countHistorialAntes}`);

  // 1. Borrar historial de estados de carrera
  const delHistorial = await prisma.historialEstadoCarrera.deleteMany({});
  console.log(`✅ Registros de historial eliminados: ${delHistorial.count}`);

  // 2. Borrar carreras
  const delCarreras = await prisma.carrera.deleteMany({});
  console.log(`✅ Carreras eliminadas: ${delCarreras.count}`);

  // 3. Resetear unidades ocupadas a 'disponible'
  const resetUnidades = await prisma.unidad.updateMany({
    where: { estado: 'ocupado' },
    data: { estado: 'disponible', ocupadoHasta: null }
  });
  console.log(`✅ Unidades reseteadas a 'disponible': ${resetUnidades.count}`);

  const countCarrerasDespues = await prisma.carrera.count();
  console.log(`\n🎉 Limpieza completada exitosamente. Total de carreras actuales: ${countCarrerasDespues}`);
}

main()
  .catch((e) => {
    console.error('Error al limpiar carreras:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
