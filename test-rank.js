const norm = (v) => (v == null ? '' : String(v).toLowerCase());

const matchMultiplier = (value, query) => {
  const v = norm(value);
  if (!v) return 0;
  if (typeof value === 'number') {
    const numQ = Number(query);
    if (!isNaN(numQ) && value === numQ) return 3;
  }
  if (v === query) return 3;
  if (v.startsWith(query)) return 2;
  if (v.includes(query)) return 1;
  return 0;
};

const CLIENTE_FIELDS = [
  { weight: 100, get: (c) => c?.codigo },
  { weight: 50, get: (c) => c?.nombre },
  { weight: 40, get: (c) => c?.telefono },
];

const scoreFields = (item, query, fields) => {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let best = 0;
  for (const f of fields) {
    const s = f.weight * matchMultiplier(f.get(item), q);
    if (s > best) best = s;
  }
  return best;
};

const rankBy = (items, query, scoreFn) => {
  if (!query || !query.trim()) return items;
  let scored = items
    .map((item) => ({ item, score: scoreFn(item, query) }))
    .filter((s) => s.score > 0);

  if (scored.length > 0) {
    const maxScore = Math.max(...scored.map((s) => s.score));
    if (maxScore >= 300) {
      scored = scored.filter((s) => s.score >= 300);
    }
  }

  return scored.sort((a, b) => b.score - a.score).map((s) => s.item);
};

const clientes = [
  { id: 1, codigo: 500, nombre: "Juan", telefono: "0987654321" },
  { id: 2, codigo: 5000, nombre: "Maria", telefono: "0987654500" },
  { id: 3, codigo: 50, nombre: "Pedro", telefono: "0985004321" },
  { id: 4, codigo: 312, nombre: "Luis", telefono: "0985004322" },
];

console.log('Search "500":', rankBy(clientes, "500", (c, q) => scoreFields(c, q, CLIENTE_FIELDS)).map(c => c.codigo));
console.log('Search "312":', rankBy(clientes, "312", (c, q) => scoreFields(c, q, CLIENTE_FIELDS)).map(c => c.codigo));
console.log('Search "50":', rankBy(clientes, "50", (c, q) => scoreFields(c, q, CLIENTE_FIELDS)).map(c => c.codigo));
