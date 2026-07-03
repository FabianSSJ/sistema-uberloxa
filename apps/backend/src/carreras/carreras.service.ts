import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { EstadoCarrera } from '../../generated/prisma/client';

// Al asignar una carrera, la unidad queda ocupada este tiempo y luego se auto-libera.
const MINUTOS_OCUPADO = 15;

@Injectable()
export class CarrerasService {
  constructor(private prisma: PrismaService) {}

  async create(createCarreraDto: CreateCarreraDto, userId?: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createCarreraDto.clienteId }
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente #${createCarreraDto.clienteId} no existe.`);
    }

    if (createCarreraDto.unidadId) {
      const unidad = await this.prisma.unidad.findUnique({
        where: { id: createCarreraDto.unidadId }
      });
      if (!unidad) {
        throw new NotFoundException(`Unidad #${createCarreraDto.unidadId} no existe.`);
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const count = await this.prisma.carrera.count({
      where: {
        createdAt: { gte: startOfDay }
      }
    });

    const carrera = await this.prisma.carrera.create({
      data: {
        clienteId: createCarreraDto.clienteId,
        unidadId: createCarreraDto.unidadId || null,
        notas: createCarreraDto.notas || null,
        // Por defecto la carrera nace TERMINADA (se completa sola). Solo se marca cancelada/perdida a mano.
        estado: createCarreraDto.unidadId ? 'completada' : 'pendiente',
        fechaFin: createCarreraDto.unidadId ? new Date() : null,
        creadoPorId: userId || null,
        numeroDiario: count + 1,
      },
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: {
          select: { id: true, nombre: true, rol: true, color: true }
        }
      }
    });

    await this.prisma.historialEstadoCarrera.create({
      data: {
        carreraId: carrera.id,
        estadoAnterior: null,
        estadoNuevo: carrera.estado
      }
    });

    // Al asignarle una carrera, la unidad pasa a 'ocupado' por MINUTOS_OCUPADO; luego se auto-libera.
    if (createCarreraDto.unidadId) {
      const ocupadoHasta = new Date(Date.now() + MINUTOS_OCUPADO * 60 * 1000);
      await this.prisma.unidad.update({
        where: { id: createCarreraDto.unidadId },
        data: { estado: 'ocupado', ocupadoHasta },
      });
    }

    return carrera;
  }

  async findAll(user?: any) {
    const where: any = {};
    if (user?.rol === 'CHARLIE') {
      where.creadoPorId = user.sub;
    }

    return this.prisma.carrera.findMany({
      where,
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: {
          select: { id: true, nombre: true, rol: true, color: true }
        }
      },
      orderBy: { id: 'desc' },
      take: 100, // Limitar a las ultimas 100 por ahora
    });
  }

  async findRecent(user?: any) {
    const where: any = {};
    if (user?.rol === 'CHARLIE') {
      where.creadoPorId = user.sub;
    }

    return this.prisma.carrera.findMany({
      where,
      take: 5,
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: { select: { id: true, nombre: true, rol: true, color: true } }
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const carrera = await this.prisma.carrera.findUnique({
      where: { id },
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: { select: { id: true, nombre: true, rol: true, color: true } }
      }
    });
    if (!carrera) {
      throw new NotFoundException(`Carrera #${id} no encontrada`);
    }
    return carrera;
  }

  async completar(id: number, unidadId?: number) {
    const carrera = await this.findOne(id);
    
    const uId: number | null = unidadId ? Number(unidadId) : carrera.unidadId;
    if (unidadId) {
      const unidad = await this.prisma.unidad.findUnique({
        where: { id: Number(unidadId) }
      });
      if (!unidad) {
        throw new NotFoundException(`Unidad #${unidadId} no existe.`);
      }
    }

    const updated = await this.prisma.carrera.update({
      where: { id },
      data: {
        estado: 'completada',
        fechaFin: new Date(),
        unidadId: unidadId !== undefined ? unidadId : carrera.unidadId
      },
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: { select: { id: true, nombre: true, rol: true, color: true } }
      }
    });

    await this.prisma.historialEstadoCarrera.create({
      data: {
        carreraId: id,
        estadoAnterior: carrera.estado,
        estadoNuevo: 'completada'
      }
    });

    // Terminar NO libera la unidad: sigue ocupada sus 15 min (solo cancelar/perder la liberan al instante).
    void uId;
    return updated;
  }

  async actualizarEstado(id: number, nuevoEstado: EstadoCarrera) {
    const carrera = await this.findOne(id);

    // La carrera nace 'completada'; se permite re-clasificarla (cancelada / perdida / volver a terminada).
    const updated = await this.prisma.carrera.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        fechaFin: new Date(), // Marcamos el fin también para cancelada/perdida
      },
      include: {
        cliente: {
          include: { sector: true }
        },
        unidad: {
          include: { modelo: { include: { marca: true } } }
        },
        creadoPor: { select: { id: true, nombre: true, rol: true, color: true } }
      }
    });

    await this.prisma.historialEstadoCarrera.create({
      data: {
        carreraId: id,
        estadoAnterior: carrera.estado,
        estadoNuevo: nuevoEstado
      }
    });

    // Cancelar/Perder liberan la unidad al instante (+ limpian el timer). 'completada' no la toca (sigue sus 15 min).
    if ((nuevoEstado === 'cancelada' || nuevoEstado === 'perdida') && carrera.unidadId) {
      await this.prisma.unidad.update({
        where: { id: carrera.unidadId },
        data: { estado: 'disponible', ocupadoHasta: null }
      });
    }

    return updated;
  }

  async cancelar(id: number) {
    return this.actualizarEstado(id, 'cancelada');
  }

  async perder(id: number) {
    return this.actualizarEstado(id, 'perdida');
  }

  async remove(id: number) {
    // Primero borrar el historial relacionado
    await this.prisma.historialEstadoCarrera.deleteMany({
      where: { carreraId: id }
    });
    // Luego borrar la carrera
    return this.prisma.carrera.delete({
      where: { id }
    });
  }
}
