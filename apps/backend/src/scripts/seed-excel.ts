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

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Función para Sentence Case: "ESTEBAN GODOY ES GENIAL" -> "Esteban godoy es genial"
function toSentenceCase(str: string): string {
  if (!str) return '';
  const s = str.trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Función para normalizar sectores
function normalizeSector(rawSector: string): string {
  if (!rawSector) return '';
  let s = toTitleCase(rawSector.trim());
  
  // Reemplazos comunes
  s = s.replace(/\bCdla\b/gi, 'Ciudadela');
  s = s.replace(/\bCdad\b/gi, 'Ciudad');
  s = s.replace(/\bCiudadela Zarzas\b/gi, 'Zarzas');
  s = s.replace(/\bLas Pitas\b/gi, 'Pitas');
  s = s.replace(/\bLa Argelia\b/gi, 'Argelia');
  
  return s;
}

async function main() {
  console.log('Iniciando migración desde el archivo Markdown corregido...');
  
  const mdPath = path.resolve(__dirname, '../../../../preview_clientes.md');
  if (!fs.existsSync(mdPath)) {
    throw new Error(`No se encontró el archivo: ${mdPath}`);
  }
  
  const mdContent = fs.readFileSync(mdPath, 'utf8');
  const lines = mdContent.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) continue;
    if (line.includes('|---|')) continue; // Separador de tabla
    if (line.includes('NOMBRE') && line.includes('SECTOR')) continue; // Cabecera
    
    // Parseo de la tabla markdown
    // Las columnas son: [vacio, ID, NOMBRE, TELEFONO, SECTOR, DIRECCION, NOTAS, vacio]
    const columns = line.split('|').map(col => col.trim());
    if (columns.length < 7) continue;

    const rawNombre = columns[2];
    const rawTelefono = columns[3];
    const rawSector = columns[4];
    const rawDireccion = columns[5];
    const rawNotas = columns[6];

    // Normalización con fallbacks
    const nombre = rawNombre && rawNombre !== '' ? toTitleCase(rawNombre) : 'Sin Nombre';
    const telefono = rawTelefono && rawTelefono !== '' ? rawTelefono : null;
    const sectorNombre = normalizeSector(rawSector);
    const direccion = toSentenceCase(rawDireccion);
    const descripcion = rawNotas ? toSentenceCase(rawNotas) : null;

    let sectorId: number | undefined = undefined;

    // Si hay sector, buscar o crear
    if (sectorNombre) {
      const sector = await prisma.sector.upsert({
        where: { nombre: sectorNombre },
        update: {},
        create: { nombre: sectorNombre },
      });
      sectorId = sector.id;
    }

    // Crear el cliente
    await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        direccion: direccion || null,
        descripcion,
        sectorId,
      },
    });

    console.log(`✅ Cliente migrado: ${nombre} | Sector: ${sectorNombre || 'N/A'}`);
  }

  console.log('🎉 ¡Migración de los 50 clientes finalizada con éxito desde el Markdown!');
}

main()
  .catch(e => {
    console.error('Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
