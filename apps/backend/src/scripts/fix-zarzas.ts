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
  console.log('Corrigiendo sector "Ciudadela Zarzas 2" a "Zarzas 2"...');

  // Buscar ambos sectores
  const sectorMalo = await prisma.sector.findUnique({
    where: { nombre: 'Ciudadela Zarzas 2' }
  });

  let sectorBueno = await prisma.sector.findUnique({
    where: { nombre: 'Zarzas 2' }
  });

  if (!sectorBueno && sectorMalo) {
    // Si no existe el bueno, simplemente renombramos el malo
    await prisma.sector.update({
      where: { id: sectorMalo.id },
      data: { nombre: 'Zarzas 2' }
    });
    console.log('✅ Sector renombrado correctamente a "Zarzas 2"');
  } else if (sectorBueno && sectorMalo) {
    // Si existen ambos, reasignar clientes y borrar el malo
    await prisma.cliente.updateMany({
      where: { sectorId: sectorMalo.id },
      data: { sectorId: sectorBueno.id }
    });
    await prisma.sector.delete({
      where: { id: sectorMalo.id }
    });
    console.log('✅ Clientes reasignados y sector "Ciudadela Zarzas 2" eliminado.');
  } else {
    console.log('⚠️ No se encontró el sector "Ciudadela Zarzas 2".');
  }
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
