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

function toSentenceCase(str: string | null): string | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function main() {
  console.log('Corrigiendo Title Case a Sentence Case en direcciones y descripciones...');
  
  const clientes = await prisma.cliente.findMany();
  let updatedCount = 0;

  for (const cliente of clientes) {
    const newDireccion = toSentenceCase(cliente.direccion);
    const newDescripcion = toSentenceCase(cliente.descripcion);

    if (newDireccion !== cliente.direccion || newDescripcion !== cliente.descripcion) {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          direccion: newDireccion,
          descripcion: newDescripcion,
        }
      });
      updatedCount++;
    }
  }

  console.log(`✅ ¡Proceso completado! Se corrigieron ${updatedCount} clientes.`);
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
