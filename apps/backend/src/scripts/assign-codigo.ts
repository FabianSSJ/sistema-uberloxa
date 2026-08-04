import { PrismaClient } from '../../generated/prisma/client';
import * as xlsx from 'xlsx';
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

// Normaliza nombres: quita acentos, mayúsculas, deja solo letras/números/espacios.
function normName(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Normaliza teléfonos: solo dígitos.
function normPhone(s: string): string {
  return (s || '').replace(/\D/g, '');
}

async function main() {
  const excelPath = path.resolve(__dirname, '../../../../CLIENTES UBER ACTUALIZADA 2025.xlsx');
  if (!fs.existsSync(excelPath)) {
    throw new Error(`No se encontró el Excel: ${excelPath}`);
  }

  const wb = xlsx.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // Índices desde el Excel. row[0] = codigo, row[1] = nombre, row[3] = telefono.
  // (fila 0 = cabecera, empezamos en 1)
  const byName = new Map<string, { codigo: number; nombre: string }[]>();
  const byPhone = new Map<string, { codigo: number; nombre: string }>();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const codigo = Number(r[0]);
    if (!Number.isInteger(codigo)) continue;

    const nombre = (r[1] ?? '').toString().trim();
    const tel = (r[3] ?? '').toString().trim();

    const nn = normName(nombre);
    if (nn) {
      if (!byName.has(nn)) byName.set(nn, []);
      byName.get(nn)!.push({ codigo, nombre });
    }

    const np = normPhone(tel);
    if (np.length >= 7 && !byPhone.has(np)) {
      byPhone.set(np, { codigo, nombre });
    }
  }

  const clientes = await prisma.cliente.findMany({ orderBy: { id: 'asc' } });

  const asignar: { id: number; nombre: string; codigo: number; via: string }[] = [];
  const ambiguos: { id: number; nombre: string; opciones: number[] }[] = [];
  const sinMatch: { id: number; nombre: string; telefono: string | null }[] = [];

  for (const c of clientes) {
    const np = normPhone(c.telefono || '');
    let matched: { codigo: number } | undefined;
    let via = '';

    if (np.length >= 7 && byPhone.has(np)) {
      matched = byPhone.get(np);
      via = 'telefono';
    } else {
      const hits = byName.get(normName(c.nombre));
      if (hits && hits.length === 1) {
        matched = hits[0];
        via = 'nombre';
      } else if (hits && hits.length > 1) {
        ambiguos.push({ id: c.id, nombre: c.nombre, opciones: hits.map(h => h.codigo) });
        continue;
      }
    }

    if (matched) {
      asignar.push({ id: c.id, nombre: c.nombre, codigo: matched.codigo, via });
    } else {
      sinMatch.push({ id: c.id, nombre: c.nombre, telefono: c.telefono });
    }
  }

  // Detectar códigos duplicados dentro del plan de asignación.
  const porCodigo = new Map<number, number[]>();
  for (const a of asignar) {
    if (!porCodigo.has(a.codigo)) porCodigo.set(a.codigo, []);
    porCodigo.get(a.codigo)!.push(a.id);
  }
  const duplicados = [...porCodigo.entries()].filter(([, ids]) => ids.length > 1);

  console.log(`\n=== ASIGNACIÓN DE CÓDIGO (${APPLY ? 'APPLY' : 'DRY-RUN'}) ===`);
  console.log(`Clientes en BD: ${clientes.length} | Matcheados: ${asignar.length} | Ambiguos: ${ambiguos.length} | Sin match: ${sinMatch.length}\n`);

  console.log('--- Mapeo propuesto (id BD -> codigo) ---');
  for (const a of asignar.sort((x, y) => x.codigo - y.codigo)) {
    console.log(`  codigo ${String(a.codigo).padStart(3)} <- id ${String(a.id).padStart(3)} | ${a.nombre} (via ${a.via})`);
  }

  if (ambiguos.length) {
    console.log('\n--- ⚠️  AMBIGUOS (nombre repetido, sin teléfono para desempatar) ---');
    ambiguos.forEach(a => console.log(`  id ${a.id} | ${a.nombre} -> posibles códigos: ${a.opciones.join(', ')}`));
  }
  if (sinMatch.length) {
    console.log('\n--- ⚠️  SIN MATCH (revisar a mano) ---');
    sinMatch.forEach(s => console.log(`  id ${s.id} | ${s.nombre} | tel: ${s.telefono ?? '—'}`));
  }
  if (duplicados.length) {
    console.log('\n--- 🚨 CÓDIGOS DUPLICADOS (dos clientes apuntan al mismo código) ---');
    duplicados.forEach(([cod, ids]) => console.log(`  codigo ${cod} <- ids ${ids.join(', ')}`));
  }

  if (!APPLY) {
    console.log('\n(DRY-RUN: no se escribió nada. Ejecutá con --apply para aplicar.)');
    return;
  }

  if (duplicados.length) {
    throw new Error('Hay códigos duplicados. Abortando para no romper el constraint @unique. Revisá el reporte.');
  }

  console.log('\nAplicando...');
  for (const a of asignar) {
    await prisma.cliente.update({ where: { id: a.id }, data: { codigo: a.codigo } });
  }
  console.log(`✅ Listo. ${asignar.length} clientes actualizados con su código.`);
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
