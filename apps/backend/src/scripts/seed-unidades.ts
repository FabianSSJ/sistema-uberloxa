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

// Lista estructurada de unidades en base a los datos enviados por el usuario.
const unidades = [
  { numeroUnidad: '77', vehiculo: 'Hyundai i10', choferNombre: 'Arison Alegria', placa: 'AGB-0786' },
  { numeroUnidad: '09', vehiculo: 'Hyundai Accent Dorado', choferNombre: 'Daniela Daúl', placa: 'LBA-9102' },
  { numeroUnidad: '10', vehiculo: 'Kia Soluto Blanco', choferNombre: 'Edgar Fabián Puertas Gallardo', placa: 'LBD-8886' },
  { numeroUnidad: '65', vehiculo: 'Hyundai Accent Plateado', choferNombre: 'EDGAR ALVARADO', placa: 'PCP-5896' },
  { numeroUnidad: '25', vehiculo: 'Chevrolet Joy Sedan Plomo', choferNombre: 'CRISTYAN ALEJANDRO YUNGA MALLA', placa: 'OBC-8050' },
  { numeroUnidad: '58', vehiculo: 'Kia Río R Plomo', choferNombre: 'JOSÉ DÍAZ O JORGE SANCHEZ', placa: 'LBB-2110' },
  { numeroUnidad: '24', vehiculo: 'Toyota Raize Plata', choferNombre: 'Rebeca Gómez', placa: 'ABQ-3687' },
  { numeroUnidad: '05', vehiculo: 'Kia Picanto Rojo', choferNombre: 'DANNY RIOFRIO', placa: 'PCU-4048' },
  { numeroUnidad: '29', vehiculo: 'Kia Soluto', choferNombre: 'DENNIS SANCHEZ', placa: 'ABR-2171' },
  { numeroUnidad: '31', vehiculo: 'Kia Soluto 2026 Color gris', choferNombre: 'Kevin Danilo Sarango Chamba', placa: 'LBD-8613' },
  { numeroUnidad: '62', vehiculo: 'Hyundai Getz celeste', choferNombre: 'Cristian Vega', placa: 'TDR-0052' }, // Formato Placa corregido (TDR-052 -> TDR-0052 si aplica, o dejada como original)
  { numeroUnidad: '38', vehiculo: 'Chevrolet Sail Vino', choferNombre: 'CRISTHIAN VASQUEZ', placa: 'PCN-4018' },
  { numeroUnidad: '27', vehiculo: 'Chevrolet Aveo Family Concho de Vino', choferNombre: 'RONALD ALVARADO', placa: 'PUB-0602' },
  { numeroUnidad: '16', vehiculo: 'Hyundai Accent plomo', choferNombre: 'Edwin sigcho', placa: 'HBB-1624' },
  { numeroUnidad: '44', vehiculo: 'Hyundai Getz celeste', choferNombre: 'RAÚL CHICA', placa: 'PBQ-6224' },
  { numeroUnidad: '82', vehiculo: 'Hyundai Grand i10 gris oscuro', choferNombre: 'Javier Cumbicus', placa: 'PCZ-7496' },
  { numeroUnidad: '11', vehiculo: 'Nissan Tiida Negro', choferNombre: 'ALEXANDER ORDÓÑEZ', placa: 'PCF-4001' },
  { numeroUnidad: '17', vehiculo: 'Chevrolet Spark Negro', choferNombre: 'Anabel Mendoza', placa: 'LCE-0310' },
  { numeroUnidad: '54', vehiculo: 'Hyundai Grand I10 Blanco', choferNombre: 'Juan Pablo Samaniego Ordóñez', placa: 'LBC-9444' },
  { numeroUnidad: '66', vehiculo: 'Hyundai Getz gris', choferNombre: 'Dennis Pucha', placa: 'LCH-0697' },
  { numeroUnidad: '40', vehiculo: 'Renault Logan Rojo o Vino', choferNombre: 'CRISTIAN ARMIJOS', placa: 'HBC-3448' },
  { numeroUnidad: '61', vehiculo: 'Hyundai Accent dorado', choferNombre: 'John Quezada', placa: 'LBA-9642' },
  { numeroUnidad: '34', vehiculo: 'Chevrolet Aveo Activo 1.6 Concho de Vino', choferNombre: 'Maria Veronica Alvarado Rodríguez', placa: 'PBS-5659' },
  { numeroUnidad: '18', vehiculo: 'KIA Xcite Negro', choferNombre: 'Javier Vivanco', placa: 'LBA-7848' },
  { numeroUnidad: '63', vehiculo: 'Sin Color', choferNombre: 'Cristian Espinoza', placa: 'LBB-3862' },
  { numeroUnidad: '43', vehiculo: 'Modelo 2011 color dorado', choferNombre: 'Angel Ponce', placa: 'TAV-1194' },
  { numeroUnidad: '07', vehiculo: 'Hyundai Accent gris', choferNombre: 'Roy Román', placa: 'PDN-9724' },
  { numeroUnidad: '41', vehiculo: 'Volkswagen', choferNombre: 'RAMIRO FLORES', placa: 'LBD-7648' },
  { numeroUnidad: '12', vehiculo: 'Hyundai Accent blanco', choferNombre: 'Franz Carrión', placa: 'LBD-4035' },
  { numeroUnidad: '23', vehiculo: 'Chevrolet Spark LT blanco', choferNombre: 'Wilmer Iván Medina Muñoz', placa: 'AGE-0002' },
  { numeroUnidad: '06', vehiculo: 'Great Wall c 30 Color Plata', choferNombre: 'ALCIVIA Fierro', placa: 'LBC-3203' },
];

async function main() {
  console.log('Iniciando script de seeding para unidades...');

  let insertadas = 0;
  let actualizadas = 0;

  for (const u of unidades) {
    // Para asegurar un formato de placa consistente (ej. ABC-1234)
    const placaCorregida = u.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let placaFormateada = placaCorregida;
    if (placaCorregida.length === 7) {
      placaFormateada = `${placaCorregida.substring(0, 3)}-${placaCorregida.substring(3)}`;
    } else if (placaCorregida.length === 6) {
      placaFormateada = `${placaCorregida.substring(0, 3)}-0${placaCorregida.substring(3)}`;
    }

    try {
      const data = {
        numeroUnidad: u.numeroUnidad,
        choferNombre: u.choferNombre,
        vehiculo: u.vehiculo,
        estado: 'inactivo' as any, // Por defecto inactivos, como el resto
      };

      const result = await prisma.unidad.upsert({
        where: { placa: placaFormateada },
        update: data, // Si la placa ya existe, solo actualizamos los datos
        create: {
          placa: placaFormateada,
          ...data,
        },
      });

      console.log(`✅ Upserted Unidad ${result.numeroUnidad} (Placa: ${result.placa})`);
      if (result.createdAt.getTime() === result.activadoEn?.getTime() || !result.activadoEn) {
        // En un mundo ideal podríamos saber si fue insertado, 
        // pero Prisma upsert es una sola operación.
        insertadas++;
      } else {
        actualizadas++;
      }
      
    } catch (error: any) {
      console.error(`❌ Error con la unidad ${u.numeroUnidad} (Placa original: ${u.placa}):`, error.message);
    }
  }

  console.log('\n=======================================');
  console.log(`¡Proceso finalizado! Se procesaron ${unidades.length} unidades.`);
  console.log('=======================================');
}

main()
  .catch((e) => {
    console.error('Error fatal al ejecutar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
