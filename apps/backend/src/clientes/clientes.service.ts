import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  private async _validarSector(sectorId: number) {
    const sector = await this.prisma.sector.findUnique({
      where: { id: sectorId },
    });
    if (!sector) {
      throw new NotFoundException(`El sector con ID ${sectorId} no existe.`);
    }
  }

  async create(createClienteDto: CreateClienteDto) {
    if (createClienteDto.sectorId) {
      await this._validarSector(createClienteDto.sectorId);
    }

    return this.prisma.cliente.create({
      data: createClienteDto,
    });
  }

  async findAll() {
    return this.prisma.cliente.findMany({
      where: { activo: true },
      include: { sector: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, activo: true },
      include: { sector: true },
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado o inactivo.`);
    }

    return cliente;
  }

  async update(id: number, updateClienteDto: UpdateClienteDto) {
    // Verificar que exista y esté activo
    await this.findOne(id);

    if (updateClienteDto.sectorId) {
      await this._validarSector(updateClienteDto.sectorId);
    }

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  async remove(id: number) {
    // Verificar existencia
    const cliente = await this.findOne(id);

    // Soft delete
    await this.prisma.cliente.update({
      where: { id },
      data: { activo: false },
    });

    return {
      message: `Cliente '${cliente.nombre}' eliminado correctamente (Soft Delete).`,
      id: cliente.id,
    };
  }
}
