import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { EstadoCarrera, Prisma } from '../../generated/prisma/client';

// Al asignar una carrera, la unidad queda ocupada este tiempo y luego se auto-libera.
const MINUTOS_OCUPADO = 15;

// Ecuador (America/Guayaquil) es UTC-5 fijo, sin horario de verano — permite hacer
// la matemática de "día local" con un offset constante, sin librerías de timezone.
const OFFSET_ECUADOR_MS = 5 * 60 * 60 * 1000;
const HORA_VENTANA_TARDIA = 23;
const MINUTO_VENTANA_TARDIA = 30;
const EXTENSION_VENTANA_TARDIA_MS = 60 * 60 * 1000; // 1 hora

// Estados "en proceso": nunca se pierden del panel aunque cambie el día calendario.
// 'asignada' no lo usa el código actual, pero queda por compatibilidad con datos viejos.
const EN_PROCESO: EstadoCarrera[] = ['pendiente', 'asignada'];

/**
 * Instante (UTC) hasta el cual una carrera resuelta sigue viendose en el panel de "hoy".
 * Regla: vive hasta la medianoche (hora Ecuador) del día siguiente a su creación — salvo
 * que se haya creado entre las 23:30 y las 23:59, en cuyo caso vive 1 hora exacta desde
 * su creación (para no cortarla seca justo al cruzar la medianoche).
 */
function calcularVisibleHasta(createdAt: Date): Date {
  const local = new Date(createdAt.getTime() - OFFSET_ECUADOR_MS); // hora de Ecuador, representada como UTC

  if (local.getUTCHours() === HORA_VENTANA_TARDIA && local.getUTCMinutes() >= MINUTO_VENTANA_TARDIA) {
    return new Date(createdAt.getTime() + EXTENSION_VENTANA_TARDIA_MS);
  }

  const medianocheSiguienteLocal = Date.UTC(
    local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1, 0, 0, 0, 0,
  );
  return new Date(medianocheSiguienteLocal + OFFSET_ECUADOR_MS);
}

function esVisibleEnPanel(carrera: { createdAt: Date; estado: EstadoCarrera }, ahora: Date): boolean {
  if (EN_PROCESO.includes(carrera.estado)) return true;
  return ahora < calcularVisibleHasta(carrera.createdAt);
}

const INCLUDE_CARRERA = {
  cliente: { include: { sector: true } },
  unidad: { include: { modelo: { include: { marca: true } } } },
  creadoPor: { select: { id: true, nombre: true, rol: true, color: true } },
} as const;

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
        estado: createCarreraDto.estado ?? (createCarreraDto.unidadId ? 'completada' : 'pendiente'),
        fechaFin: (createCarreraDto.estado === 'completada' || createCarreraDto.estado === 'perdida' || createCarreraDto.estado === 'cancelada' || (!createCarreraDto.estado && createCarreraDto.unidadId)) ? new Date() : null,
        creadoPorId: userId || null,
        numeroDiario: count + 1,
      },
      include: INCLUDE_CARRERA,
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

  /**
   * Historial paginado (keyset, no offset): la página siguiente se pide con
   * `cursor = id de la última carrera cargada` — el WHERE id < cursor usa el índice
   * de la PK directo, así que cavar 50 páginas cuesta lo mismo que la primera
   * (a diferencia de OFFSET/LIMIT, que escanea y descarta todas las filas saltadas).
   * `desde`/`hasta` filtran por rango de fecha usando el índice (creado_por, created_at)
   * o (created_at) según el rol.
   */
  async findAll(user: any, params: { desde?: Date; hasta?: Date; cursor?: number; take?: number } = {}) {
    const take = params.take ?? 30;

    const where: Prisma.CarreraWhereInput = {};
    if (user?.rol === 'CHARLIE') where.creadoPorId = user.sub;
    if (params.desde || params.hasta) {
      where.createdAt = {
        ...(params.desde ? { gte: params.desde } : {}),
        ...(params.hasta ? { lt: params.hasta } : {}),
      };
    }
    if (params.cursor) where.id = { lt: params.cursor };

    // Pedimos una de más para saber si hay página siguiente sin un segundo roundtrip (count aparte).
    const filas = await this.prisma.carrera.findMany({
      where,
      include: INCLUDE_CARRERA,
      orderBy: { id: 'desc' },
      take: take + 1,
    });

    const hayMas = filas.length > take;
    const data = hayMas ? filas.slice(0, take) : filas;
    const nextCursor = hayMas ? data[data.length - 1].id : null;

    return { data, nextCursor };
  }

  /**
   * Datos del panel de despacho (dashboard del Charlie): carreras de "hoy" + las que
   * sigan en proceso de días anteriores, con la ventana de gracia de 23:30-23:59.
   * Filtramos primero por un rango ancho e indexado (createdAt >= cutoff OR estado en
   * proceso) para que el motor use el índice y no escanee la tabla entera; la regla
   * exacta (con el corte por minuto) se aplica en memoria sobre ese subconjunto ya
   * chico — nunca son más que las carreras de ~1 día, sea cual sea el tamaño histórico.
   */
  async findPanel(user?: any) {
    const ahora = new Date();
    const cutoff = new Date(ahora.getTime() - 26 * 60 * 60 * 1000); // 24h + margen de sobra

    const where: Prisma.CarreraWhereInput = {
      OR: [
        { createdAt: { gte: cutoff } },
        { estado: { in: EN_PROCESO } },
      ],
    };
    if (user?.rol === 'CHARLIE') where.creadoPorId = user.sub;

    const candidatas = await this.prisma.carrera.findMany({
      where,
      include: INCLUDE_CARRERA,
      orderBy: { id: 'desc' },
    });

    return candidatas.filter((c) => esVisibleEnPanel(c, ahora));
  }

  async findRecent(user?: any) {
    const where: Prisma.CarreraWhereInput = {};
    if (user?.rol === 'CHARLIE') where.creadoPorId = user.sub;

    return this.prisma.carrera.findMany({
      where,
      take: 5,
      include: INCLUDE_CARRERA,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Ownership check para CHARLIE (mismo criterio que findAll/findPanel/findRecent: solo ve
   * lo que ella creó). Devuelve 404, no 403 — así no confirma a un ID adivinado que la
   * carrera existe pero es de otro, evitando enumeración de recursos ajenos.
   */
  private assertAcceso(carrera: { id: number; creadoPorId: number | null }, user?: any) {
    if (user?.rol === 'CHARLIE' && carrera.creadoPorId !== user.sub) {
      throw new NotFoundException(`Carrera #${carrera.id} no encontrada`);
    }
  }

  async findOne(id: number, user?: any) {
    const carrera = await this.prisma.carrera.findUnique({
      where: { id },
      include: INCLUDE_CARRERA,
    });
    if (!carrera) {
      throw new NotFoundException(`Carrera #${id} no encontrada`);
    }
    this.assertAcceso(carrera, user);
    return carrera;
  }

  async completar(id: number, unidadId?: number, user?: any) {
    const carrera = await this.findOne(id, user);

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
      include: INCLUDE_CARRERA,
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

  async actualizarEstado(id: number, nuevoEstado: EstadoCarrera, user?: any) {
    const carrera = await this.findOne(id, user);

    // La carrera nace 'completada'; se permite re-clasificarla (cancelada / perdida / volver a terminada).
    const updated = await this.prisma.carrera.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        fechaFin: new Date(), // Marcamos el fin también para cancelada/perdida
      },
      include: INCLUDE_CARRERA,
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

  async cancelar(id: number, user?: any) {
    return this.actualizarEstado(id, 'cancelada', user);
  }

  async perder(id: number, user?: any) {
    return this.actualizarEstado(id, 'perdida', user);
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
