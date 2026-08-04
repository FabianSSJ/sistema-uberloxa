import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ');
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function main() {
  console.log('--- MIGRACIÓN DE NUEVOS CLIENTES DESDE CLIENTES UBER ACTUALIZADA 2026.xlsx ---');

  // 1. Obtener estado actual de la DB
  const existingClients = await prisma.cliente.findMany({
    select: {
      id: true,
      codigo: true,
      nombre: true,
      direccion: true,
      telefono: true,
    }
  });

  console.log(`Clientes existentes en DB actual: ${existingClients.length}`);

  const existingCodigos = new Set<number>();
  const existingIdentities = new Set<string>();

  for (const c of existingClients) {
    if (c.codigo !== null && c.codigo !== undefined) {
      existingCodigos.add(c.codigo);
    }
    const normNombre = normalizeString(c.nombre);
    const normTel = normalizeString(c.telefono);
    const normDir = normalizeString(c.direccion);

    if (normNombre && normTel) {
      existingIdentities.add(`${normNombre}|tel:${normTel}`);
    }
    if (normNombre && normDir) {
      existingIdentities.add(`${normNombre}|dir:${normDir}`);
    }
  }

  // 2. Leer archivo Excel
  const excelPath = path.join(__dirname, '../../../../CLIENTES UBER ACTUALIZADA 2026.xlsx');
  console.log(`Leyendo Excel: ${excelPath}`);

  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:F1');
  range.e.c = 6; // Leer A-G

  const rows = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, range });
  console.log(`Total filas leídas del Excel: ${rows.length}`);

  const nuevosAgregados: Array<{
    codigo: number;
    nombre: string;
    direccion?: string;
    telefono?: string;
  }> = [];

  let procesados = 0;
  let ignoradosPorCodigo = 0;
  let ignoradosPorIdentidad = 0;
  let ignoradosInvalidos = 0;

  // Eliminar cualquier cliente basura creado por el encabezado (código 0 o nombre 'Nombre')
  await prisma.cliente.deleteMany({
    where: {
      OR: [
        { codigo: 0 },
        { nombre: 'Nombre' }
      ]
    }
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;

    const rawCodigo = row[0];
    const rawNombre = row[1];
    const rawDireccion = row[2];
    const rawTelefono = row[3];

    if (rawCodigo === undefined || rawCodigo === null || isNaN(Number(rawCodigo))) {
      ignoradosInvalidos++;
      continue;
    }
    if (!rawNombre || String(rawNombre).trim() === '' || String(rawNombre).trim().toLowerCase() === 'nombre' || Number(rawCodigo) === 0) {
      ignoradosInvalidos++;
      continue;
    }

    const codigo = Number(rawCodigo);
    const nombre = toTitleCase(String(rawNombre).trim());
    const direccion = rawDireccion ? String(rawDireccion).trim() : undefined;
    const telefono = rawTelefono ? String(rawTelefono).trim() : undefined;

    procesados++;

    // Validación 1: Código ya existe en DB
    if (existingCodigos.has(codigo)) {
      ignoradosPorCodigo++;
      continue;
    }

    // Validación 2: Redundancia/Duplicado por Nombre + Teléfono o Nombre + Dirección
    const normNombre = normalizeString(nombre);
    const normTel = normalizeString(telefono);
    const normDir = normalizeString(direccion);

    const keyTel = normTel ? `${normNombre}|tel:${normTel}` : '';
    const keyDir = normDir ? `${normNombre}|dir:${normDir}` : '';

    if ((keyTel && existingIdentities.has(keyTel)) || (keyDir && existingIdentities.has(keyDir))) {
      ignoradosPorIdentidad++;
      continue;
    }

    // Si pasa las validaciones, es un registro nuevo
    try {
      await prisma.cliente.create({
        data: {
          codigo,
          nombre,
          direccion: direccion || null,
          telefono: telefono || null,
        }
      });

      // Actualizar sets locales para no meter duplicados si el mismo Excel trae repetidos
      existingCodigos.add(codigo);
      if (keyTel) existingIdentities.add(keyTel);
      if (keyDir) existingIdentities.add(keyDir);

      nuevosAgregados.push({
        codigo,
        nombre,
        direccion,
        telefono,
      });

    } catch (e: any) {
      console.error(`Error al insertar cliente código ${codigo}:`, e.message);
    }
  }

  console.log('\n====================================');
  console.log('RESUMEN DE MIGRACIÓN 2026');
  console.log(`Registros válidos procesados: ${procesados}`);
  console.log(`Ignorados por código existente: ${ignoradosPorCodigo}`);
  console.log(`Ignorados por redundancia (nombre + tel/dir): ${ignoradosPorIdentidad}`);
  console.log(`NUEVOS CLIENTES INSERTADOS: ${nuevosAgregados.length}`);
  console.log('====================================\n');

  // Guardar reporte en JSON y Markdown para la entrega al usuario
  const jsonReportPath = path.join(__dirname, '../../../../nuevos_clientes_agregados.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(nuevosAgregados, null, 2), 'utf8');

  const mdReportPath = path.join(__dirname, '../../../../nuevos_clientes_agregados.md');
  let mdContent = `# Reporte de Clientes Nuevos Agregados (${nuevosAgregados.length})\n\n`;
  mdContent += `Fecha: ${new Date().toLocaleString()}\n\n`;
  mdContent += `| Código | Nombre | Teléfono | Dirección |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;

  for (const c of nuevosAgregados) {
    mdContent += `| ${c.codigo} | ${c.nombre} | ${c.telefono || '-'} | ${c.direccion || '-'} |\n`;
  }

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`Reportes guardados en:\n - ${jsonReportPath}\n - ${mdReportPath}`);
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
