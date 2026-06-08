import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';

@Injectable()
export class ModelosService {
  constructor(private prisma: PrismaService) {}

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  async create(createModeloDto: CreateModeloDto) {
    const nombreNormalizado = this.toTitleCase(createModeloDto.nombre);
    
    // Check if marca exists
    const marca = await this.prisma.marca.findUnique({
      where: { id: createModeloDto.marcaId }
    });
    if (!marca) throw new NotFoundException(`Marca #${createModeloDto.marcaId} no existe`);

    const existe = await this.prisma.modelo.findFirst({
      where: { 
        nombre: nombreNormalizado,
        marcaId: createModeloDto.marcaId
      },
    });

    if (existe) {
      throw new ConflictException(`El modelo '${nombreNormalizado}' ya existe para esta marca.`);
    }

    return this.prisma.modelo.create({
      data: { 
        nombre: nombreNormalizado,
        marcaId: createModeloDto.marcaId
      },
      include: { marca: true }
    });
  }

  async findAll() {
    return this.prisma.modelo.findMany({
      include: { marca: true },
      orderBy: [
        { marca: { nombre: 'asc' } },
        { nombre: 'asc' }
      ],
    });
  }

  async findOne(id: number) {
    const modelo = await this.prisma.modelo.findUnique({
      where: { id },
      include: { marca: true }
    });
    if (!modelo) {
      throw new NotFoundException(`Modelo #${id} no encontrado`);
    }
    return modelo;
  }

  async update(id: number, updateModeloDto: UpdateModeloDto) {
    const modelo = await this.findOne(id);

    let dataToUpdate: any = {};
    const marcaId = updateModeloDto.marcaId || modelo.marcaId;

    if (updateModeloDto.marcaId) {
      const marca = await this.prisma.marca.findUnique({ where: { id: updateModeloDto.marcaId } });
      if (!marca) throw new NotFoundException(`Marca #${updateModeloDto.marcaId} no existe`);
      dataToUpdate.marcaId = updateModeloDto.marcaId;
    }

    if (updateModeloDto.nombre) {
      const nombreNormalizado = this.toTitleCase(updateModeloDto.nombre);
      const existe = await this.prisma.modelo.findFirst({
        where: { 
          nombre: nombreNormalizado,
          marcaId: marcaId,
          id: { not: id } 
        },
      });

      if (existe) {
        throw new ConflictException(`El modelo '${nombreNormalizado}' ya existe para esta marca.`);
      }
      dataToUpdate.nombre = nombreNormalizado;
    }

    return this.prisma.modelo.update({
      where: { id },
      data: dataToUpdate,
      include: { marca: true }
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.modelo.delete({
      where: { id },
    });
  }
}
