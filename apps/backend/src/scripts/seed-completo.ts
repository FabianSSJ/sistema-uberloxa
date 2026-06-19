import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes('--apply');

async function main() {
  const jsonPath = path.resolve(__dirname, '../../../../_parsed_full.json');
  const data: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const conSector = data.filter(r => r.sector);
  const sinSector = data.length - conSector.length;

  // Dedupe por codigo (el @unique no admite repetidos)
  const seen = new Set<number>();
  const recs: any[] = [];
  let dupCodigo = 0;
  for (const r of conSector) {
    if (r.codigo != null) {
      if (seen.has(r.codigo)) { dupCodigo++; continue; }
      seen.add(r.codigo);
    }
    recs.push(r);
  }

  const sectores = [...new Set(recs.map(r => r.sector))].sort();

  console.log('=== SEED COMPLETO (' + (APPLY ? 'APPLY' : 'DRY-RUN') + ') ===');
  console.log('Base de datos    :', dbUrl.split('@')[1] || dbUrl);
  console.log('Clientes a sembrar:', recs.length, '(con sector)');
  console.log('Sectores distintos:', sectores.length);
  console.log('Codigos duplicados saltados:', dupCodigo);
  console.log('Sin sector (NO se siembran, quedan en REVISION_SIN_SECTOR.md):', sinSector);

  if (!APPLY) {
    console.log('\n--- Muestra de lo que insertaria ---');
    recs.slice(0, 8).forEach(r => console.log('  #' + r.codigo + ' ' + r.nombre + ' | [' + r.sector + '] | ' + (r.direccion || '').slice(0, 35)));
    console.log('\nDRY-RUN: no se escribio nada. Ejecuta con --apply para sembrar.');
    return;
  }

  console.log('\nTruncando clientes, sectores, carreras e historial (CASCADE)...');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE historial_estados_carrera, carreras, clientes, sectores RESTART IDENTITY CASCADE'
  );

  console.log('Insertando sectores...');
  await prisma.sector.createMany({ data: sectores.map(nombre => ({ nombre })) });
  const secRows = await prisma.sector.findMany();
  const secId = new Map(secRows.map(s => [s.nombre, s.id]));

  console.log('Insertando clientes...');
  const clientesData = recs.map(r => ({
    codigo: r.codigo ?? null,
    nombre: r.nombre,
    telefono: r.telefono ?? null,
    direccion: r.direccion ?? null,
    descripcion: null,
    sectorId: secId.get(r.sector) ?? null,
  }));

  const chunk = 500;
  for (let i = 0; i < clientesData.length; i += chunk) {
    await prisma.cliente.createMany({ data: clientesData.slice(i, i + chunk) });
    process.stdout.write('  ' + Math.min(i + chunk, clientesData.length) + '/' + clientesData.length + '\r');
  }

  const totalC = await prisma.cliente.count();
  const totalS = await prisma.sector.count();
  console.log('\n✅ Listo. ' + totalC + ' clientes y ' + totalS + ' sectores sembrados.');
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
