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
  const sector = await prisma.sector.upsert({
    where: { nombre: 'Tebaida Alta' },
    update: {},
    create: { nombre: 'Tebaida Alta' },
  });

  await prisma.cliente.create({
    data: {
      nombre: 'Sin Nombre',
      telefono: '0993916503',
      sectorId: sector.id,
      direccion: 'Argentina entre chile y bolivia 4 casas antes del dragon rojo 2,4 al 45',
      descripcion: null,
    },
  });

  console.log('✅ Cliente sin nombre añadido con éxito');
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
