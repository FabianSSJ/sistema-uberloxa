import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';

@Injectable()
export class UnidadesService {
  constructor(private prisma: PrismaService) {}

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  async create(createUnidadDto: CreateUnidadDto) {
    const placaNormalizada = createUnidadDto.placa.toUpperCase().trim();
    
    const existe = await this.prisma.unidad.findUnique({
      where: { placa: placaNormalizada },
    });

    if (existe) {
      throw new ConflictException(`La unidad con placa '${placaNormalizada}' ya existe.`);
    }

    const modelo = await this.prisma.modelo.findUnique({ where: { id: createUnidadDto.modeloId } });
    if (!modelo) throw new NotFoundException(`Modelo #${createUnidadDto.modeloId} no existe`);

    return this.prisma.unidad.create({
      data: {
        placa: placaNormalizada,
        modeloId: createUnidadDto.modeloId,
        color: this.toTitleCase(createUnidadDto.color),
        anio: createUnidadDto.anio,
        choferNombre: this.toTitleCase(createUnidadDto.choferNombre),
        choferTelefono: createUnidadDto.choferTelefono || null,
      },
      include: {
        modelo: {
          include: { marca: true }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.unidad.findMany({
      include: {
        modelo: {
          include: { marca: true }
        }
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const unidad = await this.prisma.unidad.findUnique({
      where: { id },
      include: {
        modelo: {
          include: { marca: true }
        }
      }
    });
    if (!unidad) {
      throw new NotFoundException(`Unidad #${id} no encontrada`);
    }
    return unidad;
  }

  async update(id: number, updateUnidadDto: UpdateUnidadDto) {
    await this.findOne(id); // verifica existencia

    let dataToUpdate: any = { ...updateUnidadDto };

    if (updateUnidadDto.placa) {
      const placaNormalizada = updateUnidadDto.placa.toUpperCase().trim();
      const existe = await this.prisma.unidad.findFirst({
        where: { 
          placa: placaNormalizada,
          id: { not: id } 
        },
      });
      if (existe) {
        throw new ConflictException(`La unidad con placa '${placaNormalizada}' ya existe.`);
      }
      dataToUpdate.placa = placaNormalizada;
    }

    if (updateUnidadDto.modeloId) {
      const modelo = await this.prisma.modelo.findUnique({ where: { id: updateUnidadDto.modeloId } });
      if (!modelo) throw new NotFoundException(`Modelo #${updateUnidadDto.modeloId} no existe`);
    }

    if (updateUnidadDto.color) dataToUpdate.color = this.toTitleCase(updateUnidadDto.color);
    if (updateUnidadDto.choferNombre) dataToUpdate.choferNombre = this.toTitleCase(updateUnidadDto.choferNombre);

    return this.prisma.unidad.update({
      where: { id },
      data: dataToUpdate,
      include: {
        modelo: {
          include: { marca: true }
        }
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.unidad.delete({
      where: { id },
    });
  }
}
