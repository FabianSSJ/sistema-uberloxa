import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Iniciando script de migración de clientes 2026...');
  
  const filePath = path.join(process.cwd(), '../../CLIENTES UBER ACTUALIZADA 2026.xlsx');
  console.log(`Leyendo archivo: ${filePath}`);
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  console.log('Archivo leído, convirtiendo a JSON...');
  // Restringir el rango para evitar congelamiento si el Excel tiene columnas basura infinitas
  const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:E1');
  range.e.c = 5; // Solo leer hasta la columna F
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1, range });
  console.log(`Total de filas a procesar: ${data.length}`);
  
  let nuevos = 0;
  let ignorados = 0;
  let errores = 0;

  for (let i = 0; i < data.length; i++) {
    if (i % 500 === 0) console.log(`Procesando fila ${i} de ${data.length}...`);
    const row = data[i];
    if (!row || row.length < 2) continue;
    
    const rawCodigo = row[0];
    const rawNombre = row[1];
    const rawDireccion = row[2];
    const rawTelefono = row[3];

    if (!rawNombre || !rawCodigo || isNaN(Number(rawCodigo))) {
      continue;
    }

    const codigo = Number(rawCodigo);
    const nombre = String(rawNombre).trim();
    const direccion = rawDireccion ? String(rawDireccion).trim() : undefined;
    const telefono = rawTelefono ? String(rawTelefono).trim() : undefined;

    try {
      const existe = await prisma.cliente.findUnique({
        where: { codigo }
      });

      if (existe) {
        ignorados++;
      } else {
        await prisma.cliente.create({
          data: {
            codigo,
            nombre,
            direccion,
            telefono
          }
        });
        nuevos++;
        console.log(`[+] Creado: ${codigo} - ${nombre}`);
      }
    } catch (e: any) {
      console.error(`[!] Error al procesar código ${codigo}:`, e.message);
      errores++;
    }
  }

  console.log('====================================');
  console.log('MIGRACIÓN FINALIZADA');
  console.log(`Clientes Nuevos Agregados: ${nuevos}`);
  console.log(`Clientes Ignorados (Ya existían): ${ignorados}`);
  console.log(`Errores: ${errores}`);
  console.log('====================================');
}

main()
  .catch((e) => {
    console.error('Error fatal al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
