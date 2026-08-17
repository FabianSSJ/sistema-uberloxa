import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnidadesService } from '../unidades/unidades.service';
import { CreateCarreraDto } from './dto/create-carrera.dto';
import { EstadoCarrera, Prisma } from '../../generated/prisma/client';

// Ya no hay candado rígido de "unidad ocupada N minutos" (se sacó a propósito: era muy
// rígido para redespachar rápido). Lo único que queda es esta ventana CORTA para frenar
// una doble-asignación real — dos Charlies (o dos pestañas) arrastrando la misma unidad
// casi al mismo tiempo, antes de que el poll de 1s alcance a mostrarla como ya despachada.
const VENTANA_ANTI_DOBLE_ASIGNACION_MS = 10_000;

// Ecuador (America/Guayaquil) es UTC-5 fijo, sin horario de verano — permite hacer
// la matemática de "día local" con un offset constante, sin librerías de timezone.
const OFFSET_ECUADOR_MS = 5 * 60 * 60 * 1000;
// Exportada: es la ÚNICA fuente de verdad del corte de jornada para el backend entero.
// estadisticas.service.ts y reportes.service.ts la importan en vez de hardcodear "4 horas"
// por su cuenta — así un cambio de horario no puede desincronizar un archivo del resto.
export const HORA_INICIO_JORNADA = 4; // 04:00 AM (corte a las 03:59:59)
const HORA_VENTANA_TARDIA = 3; // 03:30 a 03:59
const MINUTO_VENTANA_TARDIA = 30;
const EXTENSION_VENTANA_TARDIA_MS = 30 * 60 * 1000; // 30 minutos de gracia para las carreras creadas al cierre de turno

// Estados "en proceso": nunca se pierden del panel aunque cambie la jornada operativa.
// 'asignada' no lo usa el código actual, pero queda por compatibilidad con datos viejos.
const EN_PROCESO: EstadoCarrera[] = ['pendiente', 'asignada'];

/**
 * Instante (UTC) de inicio de la jornada operativa a la que pertenece la fecha dada.
 * La jornada va de 04:00:00 a 03:59:59 del día siguiente en hora de Ecuador.
 */
export function inicioJornadaOperativaEcuador(fecha: Date = new Date()): Date {
  const local = new Date(fecha.getTime() - OFFSET_ECUADOR_MS);
  const h = local.getUTCHours();
  const diaAjustado = h < HORA_INICIO_JORNADA ? local.getUTCDate() - 1 : local.getUTCDate();
  const utcMs = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), diaAjustado, HORA_INICIO_JORNADA, 0, 0, 0);
  return new Date(utcMs + OFFSET_ECUADOR_MS);
}

export function finJornadaOperativaEcuador(fecha: Date = new Date()): Date {
  return new Date(inicioJornadaOperativaEcuador(fecha).getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Instante (UTC) hasta el cual una carrera resuelta sigue viéndose en el panel de "hoy".
 * Regla: vive hasta las 04:00 AM (hora Ecuador) del cierre de su jornada operativa — salvo
 * que se haya creado entre las 03:30 y las 03:59, en cuyo caso vive 30 minutos exactos desde
 * su creación (para no cortarla seca justo al cruzar las 04:00 AM).
 */
function calcularVisibleHasta(createdAt: Date): Date {
  const local = new Date(createdAt.getTime() - OFFSET_ECUADOR_MS); // hora de Ecuador, representada como UTC

  if (local.getUTCHours() === HORA_VENTANA_TARDIA && local.getUTCMinutes() >= MINUTO_VENTANA_TARDIA) {
    return new Date(createdAt.getTime() + EXTENSION_VENTANA_TARDIA_MS);
  }

  return finJornadaOperativaEcuador(createdAt);
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

// Versión liviana para el HOT PATH (findPanel/findRecent): el dashboard del Charlie pollea
// esto cada 1 segundo por cada Charlie/admin conectado, y no usa sector ni modelo/marca —
// solo lo mínimo para mostrar la cola (nombre+código del cliente, número+chofer de la
// unidad). Traer el resto en cada poll es peso de red repetido sin ningún consumidor real.
const INCLUDE_CARRERA_LIVIANO = {
  cliente: { select: { id: true, nombre: true, codigo: true } },
  unidad: { select: { id: true, numeroUnidad: true, choferNombre: true } },
  creadoPor: { select: { id: true, nombre: true, rol: true, color: true } },
} as const;

@Injectable()
export class CarrerasService {
  constructor(
    private prisma: PrismaService,
    private unidadesService: UnidadesService,
  ) {}

  /**
   * Valida que una unidad pueda recibir una carrera: existe, no está inactiva, y no
   * acaba de recibir otra carrera hace segundos (ver VENTANA_ANTI_DOBLE_ASIGNACION_MS).
   * `excluirCarreraId` es para completar(): no hay que compararse contra sí misma al
   * reasignarle unidad a una carrera que ya la tenía.
   *
   * Corre DENTRO de la transacción del caller (recibe `tx`, no usa this.prisma) y toma
   * un advisory lock transaccional por unidad ANTES de leer nada: sin esto, dos requests
   * casi simultáneos podrían pasar el chequeo los dos antes de que ninguno haga commit
   * (check-then-act clásico) — el lock serializa asignaciones concurrentes a LA MISMA
   * unidad (unidades distintas no se bloquean entre sí) hasta que la transacción termina.
   */
  private async assertUnidadAsignable(tx: Prisma.TransactionClient, unidadId: number, excluirCarreraId?: number) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${unidadId})`;

    const unidad = await tx.unidad.findUnique({
      where: { id: unidadId }
    });
    if (!unidad) {
      throw new NotFoundException(`Unidad #${unidadId} no existe.`);
    }
    // Una unidad inactiva no está operando: no puede recibir carreras. Se valida acá
    // (fuente de verdad) aunque el frontend ya filtre/bloquee esto en el selector y el
    // drag-and-drop, porque nunca hay que confiar solo en el cliente.
    if (unidad.estado === 'inactivo') {
      throw new BadRequestException(`La unidad Nº ${unidad.numeroUnidad ?? unidad.id} está inactiva y no puede recibir carreras.`);
    }

    const asignacionReciente = await tx.carrera.findFirst({
      where: {
        unidadId,
        ...(excluirCarreraId ? { id: { not: excluirCarreraId } } : {}),
        createdAt: { gte: new Date(Date.now() - VENTANA_ANTI_DOBLE_ASIGNACION_MS) },
      },
      select: { id: true },
    });
    if (asignacionReciente) {
      throw new BadRequestException(`La unidad Nº ${unidad.numeroUnidad ?? unidad.id} acaba de recibir otra carrera — esperá unos segundos e intentá de nuevo.`);
    }

    return unidad;
  }

  async create(createCarreraDto: CreateCarreraDto, userId?: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createCarreraDto.clienteId }
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente #${createCarreraDto.clienteId} no existe.`);
    }

    // El conteo diario de carreras arranca en #1 a las 04:00 AM (inicio de jornada operativa)
    const inicioJornada = inicioJornadaOperativaEcuador();

    const carrera = await this.prisma.$transaction(async (tx) => {
      if (createCarreraDto.unidadId) {
        await this.assertUnidadAsignable(tx, createCarreraDto.unidadId);
      }

      const count = await tx.carrera.count({
        where: {
          createdAt: { gte: inicioJornada }
        }
      });

      return tx.carrera.create({
        data: {
          clienteId: createCarreraDto.clienteId,
          unidadId: createCarreraDto.unidadId || null,
          notas: createCarreraDto.notas || null,
          estado: createCarreraDto.estado ?? (createCarreraDto.unidadId ? 'completada' : 'pendiente'),
          esEncomienda: createCarreraDto.esEncomienda ?? false,
          fechaFin: (createCarreraDto.estado === 'completada' || createCarreraDto.estado === 'perdida' || createCarreraDto.estado === 'cancelada' || (!createCarreraDto.estado && createCarreraDto.unidadId)) ? new Date() : null,
          creadoPorId: userId || null,
          numeroDiario: count + 1,
        },
        include: INCLUDE_CARRERA,
      });
    });

    await this.prisma.historialEstadoCarrera.create({
      data: {
        carreraId: carrera.id,
        estadoAnterior: null,
        estadoNuevo: carrera.estado
      }
    });



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
    if (user?.rol === 'CHARLIE' && user?.sub) {
      where.creadoPorId = user.sub;
    }
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
   * sigan en proceso de jornadas anteriores, con la ventana de gracia de 03:30-03:59.
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
    if (user?.rol === 'CHARLIE' && user?.sub) {
      where.creadoPorId = user.sub;
    }

    const candidatas = await this.prisma.carrera.findMany({
      where,
      include: INCLUDE_CARRERA_LIVIANO,
      orderBy: { id: 'desc' },
      // Techo de seguridad: en operación normal esto nunca se acerca (un día activo son
      // decenas/pocos cientos de carreras), pero sin límite el query escala sin techo si
      // algún día queda un lote de pendientes sin resolver acumulándose indefinidamente.
      take: 500,
    });

    return candidatas.filter((c) => esVisibleEnPanel(c, ahora));
  }

  /**
   * Panel + unidades en un solo viaje. El dashboard del Charlie necesitaba ambos datasets
   * en simultaneo y los pedia con dos polls de 1s independientes (2 requests/seg por
   * pestaña abierta, todo el dia) — acá se combinan en un solo request para que el
   * frontend pollee esto UNA vez por segundo en lugar de dos.
   */
  async findPanelCompleto(user?: any) {
    const [carreras, unidades] = await Promise.all([
      this.findPanel(user),
      this.unidadesService.findAll(),
    ]);
    return { carreras, unidades };
  }

  // NOTA: sin consumidores en el frontend hoy (usePanelCarreras cubre el panel en vivo).
  // Se deja porque expone algo potencialmente útil (últimas 5 sin importar antigüedad),
  // pero si nadie lo llama en unos meses, se puede borrar junto con el hook del frontend.
  async findRecent(user?: any) {
    const where: Prisma.CarreraWhereInput = {};
    if (user?.rol === 'CHARLIE' && user?.sub) {
      where.creadoPorId = user.sub;
    }

    return this.prisma.carrera.findMany({
      where,
      take: 5,
      include: INCLUDE_CARRERA_LIVIANO,
      orderBy: { id: 'desc' },
    });
  }

  /**
   * Ownership check para CHARLIE (mismo criterio que findAll/findPanel/findRecent: solo ve
   * lo que ella creó). Devuelve 404, no 403 — así no confirma a un ID adivinado que la
   * carrera existe pero es de otro, evitando enumeración de recursos ajenos.
   */
  private assertAcceso(carrera: { id: number; creadoPorId: number | null }, user?: any) {
    if (user?.rol === 'CHARLIE' && user?.sub && carrera.creadoPorId !== user.sub) {
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

    const updated = await this.prisma.$transaction(async (tx) => {
      if (unidadId) {
        await this.assertUnidadAsignable(tx, Number(unidadId), id);
      }

      return tx.carrera.update({
        where: { id },
        data: {
          estado: 'completada',
          fechaFin: new Date(),
          unidadId: unidadId !== undefined ? unidadId : carrera.unidadId
        },
        include: INCLUDE_CARRERA,
      });
    });

    await this.prisma.historialEstadoCarrera.create({
      data: {
        carreraId: id,
        estadoAnterior: carrera.estado,
        estadoNuevo: 'completada'
      }
    });

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
