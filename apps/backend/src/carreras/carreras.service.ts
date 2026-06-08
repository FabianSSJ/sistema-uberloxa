import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { AssignUnidadDto } from './dto/assign-unidad.dto';
import { UpdateEstadoCarreraDto } from './dto/update-estado-carrera.dto';
import { EstadoCarrera } from '../../generated/prisma/client';

@Injectable()
export class CarrerasService {
  constructor(private prisma: PrismaService) {}

  async create(createCarreraDto: CreateCarreraDto, usuarioId?: number) {
    // Verificar que el cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createCarreraDto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente #${createCarreraDto.clienteId} no existe`);
    }

    let estadoInicial: EstadoCarrera = EstadoCarrera.sin_asignar;
    if (createCarreraDto.unidadId) {
      const unidad = await this.prisma.unidad.findUnique({
        where: { id: createCarreraDto.unidadId },
      });
      if (!unidad) {
        throw new NotFoundException(`Unidad #${createCarreraDto.unidadId} no existe`);
      }
      estadoInicial = EstadoCarrera.pendiente;
    }

    return this.prisma.$transaction(async (tx) => {
      const carrera = await tx.carrera.create({
        data: {
          clienteId: createCarreraDto.clienteId,
          unidadId: createCarreraDto.unidadId,
          estado: estadoInicial,
          notas: createCarreraDto.notas,
          creadoPorId: usuarioId,
        },
        include: {
          cliente: { include: { sector: true } },
          unidad: true,
        }
      });

      await tx.historialEstadoCarrera.create({
        data: {
          carreraId: carrera.id,
          estadoNuevo: estadoInicial,
        },
      });

      return carrera;
    });
  }

  findAll() {
    return this.prisma.carrera.findMany({
      include: {
        cliente: { include: { sector: true } },
        unidad: {
          include: {
            modelo: {
              include: {
                marca: true
              }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const carrera = await this.prisma.carrera.findUnique({
      where: { id },
      include: {
        cliente: { include: { sector: true } },
        unidad: true,
        historial: {
          orderBy: { fechaHora: 'desc' },
        },
      },
    });

    if (!carrera) {
      throw new NotFoundException(`Carrera #${id} no encontrada`);
    }
    return carrera;
  }

  async assignUnidad(id: number, assignUnidadDto: AssignUnidadDto) {
    const carrera = await this.findOne(id);

    if (carrera.estado !== EstadoCarrera.sin_asignar && carrera.estado !== EstadoCarrera.perdida) {
      throw new BadRequestException(`No se puede asignar unidad a una carrera en estado ${carrera.estado}`);
    }

    const unidad = await this.prisma.unidad.findUnique({
      where: { id: assignUnidadDto.unidadId },
    });
    
    if (!unidad) {
      throw new NotFoundException(`Unidad #${assignUnidadDto.unidadId} no existe`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedCarrera = await tx.carrera.update({
        where: { id },
        data: { 
          unidadId: assignUnidadDto.unidadId,
          estado: EstadoCarrera.pendiente 
        },
        include: {
          cliente: { include: { sector: true } },
          unidad: true,
        }
      });

      await tx.historialEstadoCarrera.create({
        data: {
          carreraId: id,
          estadoAnterior: carrera.estado,
          estadoNuevo: EstadoCarrera.pendiente,
        },
      });

      return updatedCarrera;
    });
  }

  async updateEstado(id: number, updateEstadoDto: UpdateEstadoCarreraDto) {
    const carrera = await this.findOne(id);
    const estadoNuevo = updateEstadoDto.estado;

    if (carrera.estado === estadoNuevo) {
      return carrera; // Ya está en ese estado
    }

    // Reglas de negocio básicas: si se cancela o pierde o acepta, registrar fechaFin
    const esFinDeCiclo = estadoNuevo === EstadoCarrera.aceptada || 
                         estadoNuevo === EstadoCarrera.cancelada || 
                         estadoNuevo === EstadoCarrera.perdida;

    return this.prisma.$transaction(async (tx) => {
      const updatedCarrera = await tx.carrera.update({
        where: { id },
        data: { 
          estado: estadoNuevo,
          fechaFin: esFinDeCiclo ? new Date() : null,
        },
        include: {
          cliente: { include: { sector: true } },
          unidad: true,
        }
      });

      await tx.historialEstadoCarrera.create({
        data: {
          carreraId: id,
          estadoAnterior: carrera.estado,
          estadoNuevo: estadoNuevo,
        },
      });

      return updatedCarrera;
    });
  }
}
