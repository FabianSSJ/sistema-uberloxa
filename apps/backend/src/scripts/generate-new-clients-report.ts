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

async function main() {
  // Consultar clientes agregados con código >= 4913
  const nuevos = await prisma.cliente.findMany({
    where: {
      codigo: { gte: 4913 }
    },
    orderBy: { codigo: 'asc' }
  });

  console.log(`Total clientes nuevos en la DB (código >= 4913): ${nuevos.length}`);

  const mdReportPath = path.join(__dirname, '../../../../nuevos_clientes_agregados.md');
  let mdContent = `# Reporte de Clientes Nuevos Agregados (${nuevos.length})\n\n`;
  mdContent += `Fecha de importación: ${new Date().toLocaleDateString('es-EC')} ${new Date().toLocaleTimeString('es-EC')}\n\n`;
  mdContent += `| Código | Nombre | Teléfono | Dirección |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;

  for (const c of nuevos) {
    mdContent += `| ${c.codigo} | ${c.nombre} | ${c.telefono || '-'} | ${c.direccion || '-'} |\n`;
  }

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');

  const jsonReportPath = path.join(__dirname, '../../../../nuevos_clientes_agregados.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(nuevos, null, 2), 'utf8');

  console.log(`Reporte actualizado generado en:\n - ${mdReportPath}\n - ${jsonReportPath}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
