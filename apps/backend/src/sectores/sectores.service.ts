import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

export const normalizeSectorName = (str?: string | null): string => {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
};

@Injectable()
export class SectoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSectorDto: CreateSectorDto) {
    const nombreLimpio = createSectorDto.nombre?.trim().replace(/\s+/g, ' ');
    if (!nombreLimpio) {
      throw new ConflictException('El nombre del sector no puede estar vacío.');
    }

    const sectoresExistentes = (await this.prisma.sector.findMany({ select: { id: true, nombre: true } })) ?? [];
    const normNuevo = normalizeSectorName(nombreLimpio);

    const existe = sectoresExistentes.find(s => normalizeSectorName(s.nombre) === normNuevo);

    if (existe) {
      throw new ConflictException(`El sector o ciudadela '${existe.nombre}' ya existe en el sistema.`);
    }

    return this.prisma.sector.create({
      data: {
        ...createSectorDto,
        nombre: nombreLimpio,
      },
    });
  }

  async findAll() {
    return this.prisma.sector.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const sector = await this.prisma.sector.findUnique({
      where: { id },
    });

    if (!sector) {
      throw new NotFoundException(`Sector con ID ${id} no encontrado.`);
    }

    return sector;
  }

  async update(id: number, updateSectorDto: UpdateSectorDto) {
    // Verificar que exista
    await this.findOne(id);

    // Si intenta cambiar el nombre, verificar que no colisione con otro
    if (updateSectorDto.nombre) {
      const colision = await this.prisma.sector.findUnique({
        where: { nombre: updateSectorDto.nombre },
      });

      if (colision && colision.id !== id) {
        throw new ConflictException(`El sector con nombre '${updateSectorDto.nombre}' ya existe.`);
      }
    }

    return this.prisma.sector.update({
      where: { id },
      data: updateSectorDto,
    });
  }

  async remove(id: number) {
    // Validar existencia primero
    const sector = await this.findOne(id);

    // Prisma puede hacer el SetNull automáticamente por la FK configurada,
    // pero al hacerlo explícito en una transacción podemos retornar exactamente
    // la cantidad de clientes que fueron afectados para informar al usuario.
    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.cliente.updateMany({
        where: { sectorId: id },
        data: { sectorId: null },
      });

      await tx.sector.delete({
        where: { id },
      });

      return {
        desvinculados: updateResult.count,
        sectorEliminado: sector.nombre,
      };
    });

    return {
      message: `Sector '${result.sectorEliminado}' eliminado correctamente. ${result.desvinculados} clientes fueron desvinculados.`,
      desvinculados: result.desvinculados,
    };
  }
}
