import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSectorDto: CreateSectorDto) {
    const existe = await this.prisma.sector.findUnique({
      where: { nombre: createSectorDto.nombre },
    });

    if (existe) {
      throw new ConflictException(`El sector con nombre '${createSectorDto.nombre}' ya existe.`);
    }

    return this.prisma.sector.create({
      data: createSectorDto,
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
