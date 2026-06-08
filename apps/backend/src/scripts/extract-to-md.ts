import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Heurística de separación Sector/Dirección (misma que antes)
function parseDireccion(rawStr: string) {
  if (!rawStr || typeof rawStr !== 'string') {
    return { sector: '', direccion: '' };
  }

  let str = rawStr.trim();
  
  if (str.includes(':')) {
    const parts = str.split(':');
    return {
      sector: parts[0].trim(),
      direccion: parts.slice(1).join(':').trim()
    };
  }

  const keywords = [' CALLE ', ' CALLES ', ' AV ', ' AV. ', ' AVENIDA ', ' VIA ', ' VÍA ', ' POR LA ', ' ENTRE '];
  let earliestIdx = -1;

  for (const kw of keywords) {
    const idx = str.toUpperCase().indexOf(kw);
    if (idx !== -1) {
      if (earliestIdx === -1 || idx < earliestIdx) {
        earliestIdx = idx;
      }
    }
  }

  if (earliestIdx > 0) {
    return {
      sector: str.substring(0, earliestIdx).trim(),
      direccion: str.substring(earliestIdx + 1).trim()
    };
  }

  const knownSectors = ['UNION LOJANA', 'PITAS'];
  for (const ks of knownSectors) {
    if (str.toUpperCase().startsWith(ks)) {
      return {
        sector: str.substring(0, ks.length).trim(),
        direccion: str.substring(ks.length).trim()
      };
    }
  }

  return { sector: '', direccion: str };
}

function main() {
  const args = process.argv.slice(2);
  const skipArg = args.find(a => a.startsWith('--skip='));
  const takeArg = args.find(a => a.startsWith('--take='));
  
  const skip = skipArg ? parseInt(skipArg.split('=')[1], 10) : 0;
  const take = takeArg ? parseInt(takeArg.split('=')[1], 10) : 50;

  console.log(`Extrayendo desde el Excel... (Saltando: ${skip}, Tomando: ${take})`);

  const excelPath = path.resolve(__dirname, '../../../../CLIENTES UBER ACTUALIZADA 2025.xlsx');
  if (!fs.existsSync(excelPath)) {
    console.error('No se encontró el archivo Excel en la raíz del proyecto.');
    process.exit(1);
  }

  const workbook = xlsx.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const allRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Ignorar cabecera original (índice 0)
  const dataRows = allRows.slice(1);
  
  const targetRows = dataRows.slice(skip, skip + take);
  
  if (targetRows.length === 0) {
    console.log('No hay más filas para extraer.');
    return;
  }

  let mdContent = `# Preview de Migración: Clientes (Desde la fila ${skip + 1} hasta ${skip + targetRows.length})\n\n`;
  mdContent += `Revisa y corrige estos datos antes de inyectarlos a la base de datos.\n\n`;
  mdContent += `| # | NOMBRE | TELEFONO | SECTOR (Extraído) | DIRECCION (Limpia) | NOTAS EXTRA |\n`;
  mdContent += `|---|---|---|---|---|---|\n`;

  for (let i = 0; i < targetRows.length; i++) {
    const row = targetRows[i];
    if (!row || row.length === 0) continue;

    const rawNombre = (row[1] || '').toString().trim();
    const rawDir = (row[2] || '').toString().trim();
    const rawTelefono = (row[3] || '').toString().trim();
    const notasExtra = row.slice(4).filter(Boolean).map(item => item.toString().trim()).join(' | ');

    if (!rawNombre) continue;

    const { sector, direccion } = parseDireccion(rawDir);
    
    // El índice original para referencia
    const idx = skip + i + 1;
    
    mdContent += `| ${idx} | ${rawNombre} | ${rawTelefono} | ${sector} | ${direccion} | ${notasExtra} |\n`;
  }

  const outPath = path.resolve(__dirname, '../../../../preview_clientes.md');
  fs.writeFileSync(outPath, mdContent, 'utf8');
  console.log(`✅ Archivo generado: preview_clientes.md`);
  console.log(`Revisa el archivo, corrige manualmente las inconsistencias y luego ejecuta: npx tsx src/scripts/seed-excel.ts`);
}

main();
