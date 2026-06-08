import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';

@Injectable()
export class MarcasService {
  constructor(private prisma: PrismaService) {}

  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  async create(createMarcaDto: CreateMarcaDto) {
    const nombreNormalizado = this.toTitleCase(createMarcaDto.nombre);
    
    const existe = await this.prisma.marca.findUnique({
      where: { nombre: nombreNormalizado },
    });

    if (existe) {
      throw new ConflictException(`La marca '${nombreNormalizado}' ya existe.`);
    }

    return this.prisma.marca.create({
      data: { nombre: nombreNormalizado },
    });
  }

  async findAll() {
    return this.prisma.marca.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const marca = await this.prisma.marca.findUnique({
      where: { id },
    });
    if (!marca) {
      throw new NotFoundException(`Marca #${id} no encontrada`);
    }
    return marca;
  }

  async update(id: number, updateMarcaDto: UpdateMarcaDto) {
    await this.findOne(id); // verifica si existe

    let dataToUpdate: any = {};
    if (updateMarcaDto.nombre) {
      const nombreNormalizado = this.toTitleCase(updateMarcaDto.nombre);
      const existe = await this.prisma.marca.findFirst({
        where: { 
          nombre: nombreNormalizado,
          id: { not: id } 
        },
      });

      if (existe) {
        throw new ConflictException(`La marca '${nombreNormalizado}' ya existe.`);
      }
      dataToUpdate.nombre = nombreNormalizado;
    }

    return this.prisma.marca.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.marca.delete({
      where: { id },
    });
  }
}
