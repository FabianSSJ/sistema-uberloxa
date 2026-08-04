/**
 * Recuperacion de sector para clientes "sin sector" via gazetteer ampliado.
 *
 * Estrategia: para cada cliente sin sector, busca en su DIRECCION un barrio conocido
 * (match por PALABRA COMPLETA, no substring suelto, para no asignar mal). Los barrios
 * salen del gazetteer existente + una lista curada de barrios de Loja + alias de typos.
 *
 *   Preview (default): muestra que asignaria, NO escribe.
 *   --apply          : escribe los sectores recuperados en _parsed_full.json y
 *                      regenera REVISION_SIN_SECTOR.md con los que quedan sin barrio.
 */
import * as path from 'path';
import * as fs from 'fs';

const APPLY = process.argv.includes('--apply');
const JSON_PATH = path.resolve(__dirname, '../../../../_parsed_full.json');
const MD_PATH = path.resolve(__dirname, '../../../../REVISION_SIN_SECTOR.md');

const norm = (s: string): string =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/([a-z])(\d)/g, '$1 $2') // "zarzas2" -> "zarzas 2": el numero pegado rompe el match por palabra
    .replace(/\s+/g, ' ')
    .trim();

// Barrios de Loja que pueden faltar en el gazetteer (se suman a los ya detectados en los datos).
const EXTRA_BARRIOS = [
  'Panecillo', 'San Cayetano', 'Isidro Ayora', 'Belen', 'San Sebastian', 'Zamora Huayco',
  'Daniel Alvarez', 'Clodoveo Jaramillo', 'Esteban Godoy', 'Heroes del Cenepa', 'Yaguarcuna',
  'Celi Roman', 'Jipiro', 'Pucara', 'Carigan', 'Motupe', 'Menfis', 'Punzara', 'Turunuma',
  'La Banda', 'Colinas Lojanas', 'Reinaldo Espinosa', 'Borja', 'El Plateado', 'Sauces Norte',
  'Consacola', 'Bellavista', 'Mirasol', 'Amable Maria', 'Capuli', 'Inmaculada', 'San Pedro',
  'Tebaida', 'Julio Ordoñez', '8 de Diciembre', 'Santa Teresita', 'Las Pitas', 'San Vicente',
  'Ciudadela del Maestro', 'Plateado', 'Sauces', 'Zarzas',
];

// Alias de typos/variantes -> nombre canonico del barrio.
const ALIAS: Record<string, string> = {
  'estaban': 'Esteban Godoy',
  'esteban': 'Esteban Godoy',
  'esteaban': 'Esteban Godoy',
  'bellevista': 'Bellavista',
  'punzra': 'Punzara',
  'inmculada': 'Inmaculada',
  'sanpedro': 'San Pedro',
  'sampedro': 'San Pedro',
  'terecita': 'Santa Teresita',
  'teresita': 'Santa Teresita',
  'julio ordoñes': 'Julio Ordoñez',
  'zarsas': 'Zarzas',
};

// Terminos demasiado genericos para matchear solos (aparecen como referencia, no como barrio):
// "centro de salud", "centro de convenciones", "placa centro", etc.
const BLACKLIST = new Set(['centro']);

// Construye un regex que matchea el termino como palabra completa (bordes no alfanumericos).
const wordRegex = (term: string): RegExp =>
  new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);

function main() {
  const data: any[] = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

  const baseSectores = [...new Set(data.filter((r) => r.sector).map((r) => r.sector as string))];
  const gaz = [...new Set([...baseSectores, ...EXTRA_BARRIOS])]
    .map((raw) => ({ raw, n: norm(raw), re: wordRegex(norm(raw)) }))
    .filter((g) => g.n.length > 3 && !BLACKLIST.has(g.n))
    .sort((a, b) => b.n.length - a.n.length); // preferir match mas largo/especifico
  const aliasEntries = Object.entries(ALIAS).map(([k, v]) => ({ raw: v, n: norm(k), re: wordRegex(norm(k)) }));

  const sinSector = data.filter((r) => !r.sector && r.direccion && String(r.direccion).trim());

  let recuperados = 0;
  const asignaciones: Array<{ codigo: any; nombre: string; sector: string; direccion: string }> = [];
  const restan: any[] = [];

  for (const r of sinSector) {
    // El barrio real esta SIEMPRE en el prefijo (antes de ':' o ';'); lo de despues son calles.
    //  - Con ':'  -> el prefijo ES el barrio: matcheo por palabra en todo el prefijo.
    //  - Sin ':'  -> exijo que el barrio este AL INICIO (si esta en el medio suele ser una calle).
    const full = norm(r.direccion);
    const m = full.match(/^([^:;]+)[:;]/);
    const zona = m ? m[1].trim() : full;
    const anchored = !m; // sin dos puntos => el barrio debe estar cerca del inicio
    const matchOne = (g: { raw: string; n: string; re: RegExp }) => {
      if (!g.re.test(zona)) return false;
      if (!anchored) return true; // con ':' el prefijo entero es el barrio
      const idx = zona.indexOf(g.n);
      return idx >= 0 && idx <= 14; // sin ':' descarta el barrio usado como calle en el medio
    };
    const hit = gaz.find(matchOne) || aliasEntries.find(matchOne);
    if (hit) {
      r.sector = hit.raw;
      r.via = 'gazetteer-v2';
      recuperados++;
      asignaciones.push({ codigo: r.codigo, nombre: r.nombre, sector: hit.raw, direccion: r.direccion });
    } else {
      restan.push(r);
    }
  }

  // Conteo por barrio asignado (para detectar asignaciones sospechosas).
  const porBarrio: Record<string, number> = {};
  asignaciones.forEach((a) => (porBarrio[a.sector] = (porBarrio[a.sector] || 0) + 1));

  console.log(`=== RECUPERACION DE SECTORES (${APPLY ? 'APPLY' : 'PREVIEW'}) ===`);
  console.log('Sin sector con direccion :', sinSector.length);
  console.log('Recuperados (barrio real):', recuperados);
  console.log('Quedan para revision manual:', restan.length);
  console.log('\n--- Recuperados por barrio ---');
  Object.entries(porBarrio).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log('  ' + String(n).padStart(3) + '  ' + s));
  console.log('\n--- Muestra de asignaciones (revisar que el barrio matchee la direccion) ---');
  asignaciones.slice(0, 25).forEach((a) => console.log(`  #${a.codigo} [${a.sector}] <- ${a.direccion.slice(0, 55)}`));

  if (!APPLY) {
    console.log('\nPREVIEW: no se escribio nada. Corre con --apply para guardar.');
    return;
  }

  // Escribir JSON actualizado.
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 0), 'utf8');

  // Regenerar el MD de revision manual con los que quedan.
  const sinDir = data.filter((r) => !r.sector && (!r.direccion || !String(r.direccion).trim()));
  let md = `# Clientes SIN sector detectado — asignación manual\n\n`;
  md += `> **${restan.length + sinDir.length} clientes** sin barrio identificado automáticamente. Completá la columna **Sector** donde corresponda (o dejá vacío si la dirección no tiene barrio). El resto ya se siembra automático.\n\n`;
  md += `| Código | Nombre | Sector (completá) | Dirección original |\n|---|---|---|---|\n`;
  for (const r of [...restan, ...sinDir]) {
    const dir = (r.direccion || '').replace(/\|/g, '/').slice(0, 70);
    md += `| ${r.codigo ?? ''} | ${r.nombre} |  | ${dir} |\n`;
  }
  fs.writeFileSync(MD_PATH, md, 'utf8');

  console.log('\nAPPLY: _parsed_full.json actualizado y REVISION_SIN_SECTOR.md regenerado.');
}

main();
