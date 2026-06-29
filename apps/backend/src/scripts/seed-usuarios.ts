import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Permisos derivados del código actual (guards + MainLayout), NO inventados:
//  - SUPERADMIN: el guard lo bypassa -> modulosPermitidos no aplica ([]).
//  - ADMIN: no bypassa -> necesita todos los modulos para acceso operativo full.
//  - CHARLIE: no bypassa; el front lo limita a Carreras -> solo 'carreras'.
const USUARIOS = [
  { nombre: 'Administrador', username: 'admin',         password: 'admin123',      rol: 'SUPERADMIN', modulosPermitidos: [] as string[], color: null as string | null },
  { nombre: 'Byron',         username: 'ByronUber',     password: 'byronuber',     rol: 'ADMIN',      modulosPermitidos: ['carreras', 'clientes', 'unidades', 'choferes'], color: null },
  { nombre: 'Kathia',        username: 'KathiaUber',    password: 'KathiaUber',    rol: 'CHARLIE',    modulosPermitidos: ['carreras'], color: 'rojo' },
  { nombre: 'Carmita',       username: 'CarmitaUber',   password: 'CarmitaUber',   rol: 'CHARLIE',    modulosPermitidos: ['carreras'], color: 'verde' },
  { nombre: 'Alejandra',     username: 'AlejandraUber', password: 'AlejandraUber', rol: 'CHARLIE',    modulosPermitidos: ['carreras'], color: 'azul' },
  { nombre: 'Gabriel',       username: 'GabrielUber',   password: 'GabrielUber',   rol: 'CHARLIE',    modulosPermitidos: ['carreras'], color: 'negro' },
];

async function main() {
  console.log(`Sembrando ${USUARIOS.length} usuarios en: ${dbUrl.replace(/:[^:@]+@/, ':***@')}\n`);

  for (const u of USUARIOS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const data = {
      nombre: u.nombre,
      username: u.username,
      passwordHash,
      rol: u.rol as any,
      modulosPermitidos: u.modulosPermitidos,
      activo: true,
      color: u.color,
    };

    const res = await prisma.usuario.upsert({
      where: { username: u.username },
      update: { nombre: data.nombre, passwordHash, rol: data.rol, modulosPermitidos: data.modulosPermitidos, activo: true, color: u.color },
      create: data,
      select: { id: true, username: true, rol: true, modulosPermitidos: true },
    });

    console.log(`  ✔ [${res.rol}] ${res.username}  (modulos: ${res.modulosPermitidos.length ? res.modulosPermitidos.join(', ') : 'TODOS por bypass'})`);
  }

  const total = await prisma.usuario.count();
  console.log(`\nTotal usuarios en la BD: ${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
