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

async function fixSector(badName: string, goodName: string) {
  console.log(`Corrigiendo sector "${badName}" a "${goodName}"...`);

  const sectorMalo = await prisma.sector.findUnique({
    where: { nombre: badName }
  });

  const sectorBueno = await prisma.sector.findUnique({
    where: { nombre: goodName }
  });

  if (!sectorMalo) {
    console.log(`⚠️ No se encontró el sector "${badName}".`);
    return;
  }

  if (!sectorBueno) {
    // Si no existe el bueno, simplemente renombramos el malo
    await prisma.sector.update({
      where: { id: sectorMalo.id },
      data: { nombre: goodName }
    });
    console.log(`✅ Sector renombrado correctamente de "${badName}" a "${goodName}"`);
  } else {
    // Si existen ambos, reasignar clientes y borrar el malo
    await prisma.cliente.updateMany({
      where: { sectorId: sectorMalo.id },
      data: { sectorId: sectorBueno.id }
    });
    await prisma.sector.delete({
      where: { id: sectorMalo.id }
    });
    console.log(`✅ Clientes reasignados y sector "${badName}" eliminado.`);
  }
}

async function main() {
  await fixSector('Las Pitas', 'Pitas');
  await fixSector('La Argelia', 'Argelia');
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
