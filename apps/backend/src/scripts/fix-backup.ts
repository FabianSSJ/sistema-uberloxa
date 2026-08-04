import { PrismaClient } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
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
  console.log('Arreglando usuarios...');
  const usuarios = await prisma.usuario.findMany();
  
  const passwordHash = await bcrypt.hash('123456', 10);

  for (const u of usuarios) {
    let modulos = u.modulosPermitidos;
    if (u.rol === 'CHARLIE') {
      modulos = ['carreras', 'clientes', 'unidades', 'choferes'];
    }
    await prisma.usuario.update({
      where: { id: u.id },
      data: {
        passwordHash,
        modulosPermitidos: modulos,
        activo: true
      }
    });
    console.log(`Usuario actualizado: ${u.username} (rol: ${u.rol}) - Clave reseteada a 123456`);
  }
  
  console.log('¡Todos los usuarios han sido arreglados!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
