import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { EstadoUnidad } from '../../generated/prisma/client';

@Injectable()
export class UnidadesService {
  private readonly logger = new Logger(UnidadesService.name);

  constructor(private prisma: PrismaService) {}

  private toTitleCase(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  }

  async create(createUnidadDto: CreateUnidadDto) {
    const placaNormalizada = createUnidadDto.placa.toUpperCase().trim();
    
    // Check placa
    const existePlaca = await this.prisma.unidad.findUnique({
      where: { placa: placaNormalizada },
    });
    if (existePlaca) {
      throw new ConflictException(`La unidad con placa '${placaNormalizada}' ya existe.`);
    }

    // Check numeroUnidad if provided
    if (createUnidadDto.numeroUnidad) {
      const existeNumero = await this.prisma.unidad.findUnique({
        where: { numeroUnidad: createUnidadDto.numeroUnidad.trim() }
      });
      if (existeNumero) {
        throw new ConflictException(`La unidad con número '${createUnidadDto.numeroUnidad}' ya existe.`);
      }
    }

    return this.prisma.unidad.create({
      data: {
        numeroUnidad: createUnidadDto.numeroUnidad ? createUnidadDto.numeroUnidad.trim() : null,
        placa: placaNormalizada,
        vehiculo: this.toTitleCase(createUnidadDto.vehiculo),
        choferNombre: this.toTitleCase(createUnidadDto.choferNombre),
        choferTelefono: createUnidadDto.choferTelefono || null,
        colorIdentidad: createUnidadDto.colorIdentidad ?? null,
      }
    });
  }

  // Libera las unidades cuyo tiempo de ocupación (15 min) ya venció. Antes se llamaba en
  // CADA lectura de findAll() — con el dashboard polleando cada 1s por cada Charlie conectada,
  // eso era un UPDATE contra la tabla por segundo por pestaña abierta, casi siempre sin nada
  // que actualizar. Como job cada 10s, la escritura queda desacoplada del camino de lectura
  // (10s de margen es irrelevante para el usuario: nadie nota una unidad liberada 10s tarde).
  @Interval(10_000)
  private async _liberarOcupadasVencidas() {
    const { count } = await this.prisma.unidad.updateMany({
      where: { estado: 'ocupado', ocupadoHasta: { not: null, lt: new Date() } },
      data: { estado: 'disponible', ocupadoHasta: null },
    });
    if (count > 0) this.logger.log(`Liberadas ${count} unidad(es) por tiempo de ocupación vencido`);
  }

  async findAll() {
    return this.prisma.unidad.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const unidad = await this.prisma.unidad.findUnique({
      where: { id }
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

    if (updateUnidadDto.numeroUnidad) {
      const numNorm = updateUnidadDto.numeroUnidad.trim();
      const existeNum = await this.prisma.unidad.findFirst({
        where: {
          numeroUnidad: numNorm,
          id: { not: id }
        }
      });
      if (existeNum) {
        throw new ConflictException(`La unidad con número '${numNorm}' ya existe.`);
      }
      dataToUpdate.numeroUnidad = numNorm;
    }

    if (updateUnidadDto.vehiculo) dataToUpdate.vehiculo = this.toTitleCase(updateUnidadDto.vehiculo);
    if (updateUnidadDto.choferNombre) dataToUpdate.choferNombre = this.toTitleCase(updateUnidadDto.choferNombre);

    return this.prisma.unidad.update({
      where: { id },
      data: dataToUpdate
    });
  }

  async cambiarEstado(id: number, estado: EstadoUnidad) {
    const unidad = await this.findOne(id); // verifica existencia + me da el activadoEn actual

    // Regla única de la cola de despacho (FIFO con posición fija):
    //  - inactivo            -> sale de la cola (activadoEn = null), pierde su turno.
    //  - entra a la cola      -> primera activación (activadoEn era null) toma now() y va al final.
    //  - ya estaba en la cola -> disponible/ocupado/descanso NO tocan activadoEn => conserva su lugar.
    const data: any = { estado };
    if (estado === 'inactivo') {
      data.activadoEn = null;
    } else if (!unidad.activadoEn) {
      data.activadoEn = new Date();
    }

    return this.prisma.unidad.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.unidad.delete({
      where: { id },
    });
  }
}
