/**
 * Aplica la columna "Sector" completada por el usuario en REVISION_SIN_SECTOR.md al
 * _parsed_full.json, canonicalizando contra los sectores existentes:
 *   - exacto / articulo / etapa / typo  -> sector existente
 *   - nombre base de un sector con sufijo unico (ej "las palmas" -> "Palmas Altas")
 *   - nombre base de un par Alto/Bajo    -> resuelve por la direccion; si no, PENDIENTE
 *   - sin match                          -> sector NUEVO (nombre limpio en Title Case)
 *
 *   Preview (default): muestra que haria, no escribe.  --apply: escribe el JSON.
 */
import * as fs from 'fs';
import * as path from 'path';

const APPLY = process.argv.includes('--apply');
const ROOT = path.resolve(__dirname, '../../../../');
const JSONP = path.join(ROOT, '_parsed_full.json');
const MDP = path.join(ROOT, 'REVISION_SIN_SECTOR.md');

const data: any[] = JSON.parse(fs.readFileSync(JSONP, 'utf8'));
const byCod = new Map(data.map((r) => [String(r.codigo), r]));
const existentes = [...new Set(data.filter((r) => r.sector).map((r) => r.sector as string))];

const TYPOS: Record<string, string> = { yahuarcuna: 'yaguarcuna', mestro: 'maestro', ciudadlea: 'ciudadela', ciuadela: 'ciudadela', ciudadelea: 'ciudadela', aqruitectos: 'arquitectos', aruitectos: 'arquitectos', albarez: 'alvarez', danial: 'daniel', acasias: 'acacias', estapa: 'etapa', xona: 'zona', arque: 'parque' };
function canon(s: string): string {
  let x = (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  x = x.split(' ').map((w) => TYPOS[w] || w).join(' ');
  x = x.replace(/\bciudadela maestro\b/, 'ciudadela del maestro');
  x = x.replace(/\b(primera|1ra|1era|uno)\b/g, '1').replace(/\b(segunda|2da|dos)\b/g, '2').replace(/\b(tercera|3ra|tres)\b/g, '3');
  x = x.replace(/\betapa\b/g, '').replace(/\s+/g, ' ').trim().replace(/\s1$/, '');
  x = x.replace(/^(barrio|la|las|los|el)\s+/, '');
  return x;
}
const dbExact = new Map(existentes.map((s) => [canon(s), s]));

// Nombre limpio para sectores NUEVOS (acentos + Title Case con preposiciones en minuscula).
const WORD: Record<string, string> = { samana: 'Samaná', saman: 'Samaná', balcon: 'Balcón', cofradia: 'Cofradía', condor: 'Cóndor', montana: 'Montaña', rodriguez: 'Rodríguez', orquidead: 'Orquídeas', orquideas: 'Orquídeas', cipres: 'Cipreses', witt: 'Witt', acasias: 'Acacias', estapa: 'Etapa', xona: 'Zona', arque: 'Parque', ciuadela: 'Ciudadela', ciudadlea: 'Ciudadela', aqruitectos: 'Arquitectos', minacho: 'Minacho' };
const LOWER = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e']);
function clean(raw: string): string {
  const words = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map((w) => WORD[w] || w);
  return words.map((w, i) => (i > 0 && LOWER.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

// Nombre forzado por canon (consolida variantes que clean() no junta).
const FORCE: Record<string, string> = {
  'ciudadela de los arquitectos': 'Ciudadela de los Arquitectos',
  'ciudadela arquitectos': 'Ciudadela de los Arquitectos',
  'ciudadelas los arquitectos': 'Ciudadela de los Arquitectos',
  'acacias': 'Las Acacias',
};

// Valores que parecen CALLE/referencia, no barrio -> no crear, pasar a aclarar.
const DUDOSO = new Set(['sevilla de oro']);

const BLANK = new Set(['', 'null', 'n/a', '-']);
const aExistente: any[] = [], aNuevo: any[] = [], pendienteAB: any[] = [], dudoso: any[] = [];

for (const line of fs.readFileSync(MDP, 'utf8').split(/\r?\n/)) {
  if (!line.startsWith('|') || line.includes('Código') || line.includes('|---')) continue;
  const c = line.split('|').map((x) => x.trim());
  if (c.length < 5) continue;
  const codigo = c[1], value = c[3];
  if (BLANK.has(value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim())) continue;
  const k = canon(value);
  if (DUDOSO.has(k)) { dudoso.push({ codigo, value }); continue; }
  if (dbExact.has(k)) { aExistente.push({ codigo, sector: dbExact.get(k) }); continue; }
  const cands = existentes.filter((s) => canon(s).startsWith(k + ' '));
  if (cands.length === 1) { aExistente.push({ codigo, sector: cands[0] }); continue; }
  if (cands.length > 1) {
    const dir = (byCod.get(String(codigo))?.direccion || '').toLowerCase();
    const pick = /\balto\b/.test(dir) ? cands.find((s) => /alto/i.test(s)) : /\bbajo\b/.test(dir) ? cands.find((s) => /bajo/i.test(s)) : null;
    if (pick) aExistente.push({ codigo, sector: pick });
    else pendienteAB.push({ codigo, value, cands, dir: byCod.get(String(codigo))?.direccion || '' });
    continue;
  }
  aNuevo.push({ codigo, sector: FORCE[k] || clean(value) });
}

// Aplicar
if (APPLY) {
  for (const a of [...aExistente, ...aNuevo]) { const r = byCod.get(String(a.codigo)); if (r) { r.sector = a.sector; r.via = 'manual'; } }
  fs.writeFileSync(JSONP, JSON.stringify(data, null, 0), 'utf8');
}

// Reportar
const nuevosCount: Record<string, number> = {};
aNuevo.forEach((a) => (nuevosCount[a.sector] = (nuevosCount[a.sector] || 0) + 1));
console.log(`=== APPLY-REVISION (${APPLY ? 'APLICADO' : 'PREVIEW'}) ===`);
console.log('-> A sector EXISTENTE :', aExistente.length, 'filas');
console.log('-> A sector NUEVO     :', aNuevo.length, 'filas /', Object.keys(nuevosCount).length, 'sectores nuevos');
console.log('-> PENDIENTE Alto/Bajo:', pendienteAB.length, 'filas (necesitan tu ojo)');
console.log('-> DUDOSO (calle?)    :', dudoso.length, 'filas');
console.log('\n=== SECTORES NUEVOS A CREAR ===');
Object.entries(nuevosCount).sort((a, b) => b[1] - a[1]).forEach(([s, n]) => console.log(`   ${String(n).padStart(2)}  ${s}`));
console.log('\n=== PENDIENTES Alto/Bajo (aclará vos) ===');
pendienteAB.forEach((p) => console.log(`   #${p.codigo} "${p.value}" -> [${p.cands.join(' / ')}]  dir: ${p.dir.slice(0, 50)}`));
console.log('\n=== DUDOSO (calle o barrio?) ===');
dudoso.forEach((d) => console.log(`   #${d.codigo} "${d.value}"`));
