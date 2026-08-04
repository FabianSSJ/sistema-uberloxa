import { PrismaClient } from '../../generated/prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = (process.env.DATABASE_URL || '').replace('localhost', '127.0.0.1');
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const unidadesAAgregar = [
  {
    numeroUnidad: "42",
    choferNombre: "Darwin Efrain Chuquimarca Valladares",
    choferTelefono: null,
    placa: "LBD-6134",
    color: "Plata",
    vehiculo: "Volkswagen Polo",
    estado: "disponible" as const,
  },
  {
    numeroUnidad: "19",
    choferNombre: "Gabriel Silva",
    choferTelefono: null,
    placa: "LBC-3068",
    color: "Blanco",
    vehiculo: "Hyundai",
    estado: "disponible" as const,
  },
  {
    numeroUnidad: "46",
    choferNombre: "Bryan Jumbo",
    choferTelefono: "0994843764",
    placa: "PCI-3983",
    color: "Blanco",
    vehiculo: "Hyundai Accent",
    estado: "disponible" as const,
  },
  {
    numeroUnidad: "27",
    choferNombre: "Byron Rueda",
    choferTelefono: "0998316867",
    placa: "PQE-208",
    color: "Plateado",
    vehiculo: "Hyundai Getz",
    estado: "disponible" as const,
  },
  {
    numeroUnidad: "38",
    choferNombre: "Cristhian Vasquez",
    choferTelefono: "0983670397",
    placa: "PCN-4018",
    color: "Vino",
    vehiculo: "Chevrolet Sail",
    estado: "disponible" as const,
  },
];

async function main() {
  console.log('--- AGREGANDO / ACTUALIZANDO UNIDADES EN LA BASE DE DATOS ---');

  for (const u of unidadesAAgregar) {
    // Buscar si ya existe por número de unidad o placa
    const existe = await prisma.unidad.findFirst({
      where: {
        OR: [
          { numeroUnidad: u.numeroUnidad },
          { placa: u.placa }
        ]
      }
    });

    if (existe) {
      const updated = await prisma.unidad.update({
        where: { id: existe.id },
        data: {
          numeroUnidad: u.numeroUnidad,
          choferNombre: u.choferNombre,
          choferTelefono: u.choferTelefono || existe.choferTelefono,
          placa: u.placa,
          color: u.color,
          vehiculo: u.vehiculo,
          estado: 'disponible',
        }
      });
      console.log(`✅ Unidad Nº ${u.numeroUnidad} ACTUALIZADA (ID: ${updated.id}): ${u.choferNombre} - ${u.vehiculo} (${u.placa})`);
    } else {
      const created = await prisma.unidad.create({
        data: {
          numeroUnidad: u.numeroUnidad,
          choferNombre: u.choferNombre,
          choferTelefono: u.choferTelefono,
          placa: u.placa,
          color: u.color,
          vehiculo: u.vehiculo,
          estado: 'disponible',
        }
      });
      console.log(`✨ Unidad Nº ${u.numeroUnidad} CREADA EXITOSAMENTE (ID: ${created.id}): ${u.choferNombre} - ${u.vehiculo} (${u.placa})`);
    }
  }

  const total = await prisma.unidad.count();
  console.log(`\n🎉 Proceso completado. Total de unidades en la base de datos: ${total}`);
}

main()
  .catch((e) => {
    console.error('Error al agregar unidades:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
