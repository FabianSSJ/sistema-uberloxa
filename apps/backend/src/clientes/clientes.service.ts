import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Prisma } from '../../generated/prisma/client';

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

  // El código es único en TODA la base (incluye clientes inactivos). Si ya está tomado,
  // mensaje claro para que el usuario elija otro. excludeId: para no chocar consigo mismo al editar.
  private async _validarCodigoUnico(codigo: number, excludeId?: number) {
    const existente = await this.prisma.cliente.findFirst({
      where: { codigo, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existente) {
      throw new ConflictException(`El código ${codigo} ya está ocupado por "${existente.nombre}". Elegí otro.`);
    }
  }

  async create(createClienteDto: CreateClienteDto) {
    if (createClienteDto.sectorId) {
      await this._validarSector(createClienteDto.sectorId);
    }
    if (createClienteDto.codigo != null) {
      await this._validarCodigoUnico(createClienteDto.codigo);
    }

    // El nombre no es obligatorio (ej. alta rápida desde el despacho, solo con teléfono):
    // si no viene, armamos algo identificable en vez de guardar la columna vacía —
    // igual va a la bandeja de "Nuevos" (sin código) para que lo completen después.
    const nombre = createClienteDto.nombre?.trim() || (createClienteDto.telefono ? `Cliente ${createClienteDto.telefono}` : 'Cliente sin nombre');

    return this.prisma.cliente.create({
      data: { ...createClienteDto, nombre },
      // Mismo shape que findAll(): el frontend appendea esta respuesta directo a la cache
      // de la lista completa (evita refetchear ~4mil clientes por cada alta) — sin el
      // include acá, ese append dejaría el cliente nuevo con sector "undefined" hasta el
      // próximo refetch real.
      include: { sector: true },
    });
  }

  async findAll() {
    return this.prisma.cliente.findMany({
      where: { activo: true },
      include: { sector: true },
      orderBy: { codigo: { sort: 'asc', nulls: 'last' } },
      // Guardarraíl, no límite funcional: el Dashboard de Charlie y CarreraFormModal
      // buscan sobre esta lista completa en memoria (fuzzy search instantáneo, sin ida
      // y vuelta al server por cada tecla) — a la escala actual (~4mil clientes activos)
      // es la opción correcta. Si el negocio crece un orden de magnitud, esa búsqueda
      // tiene que migrar a /clientes/paginado (ya existe, mismo scoring en SQL). Este
      // take solo evita que un bug futuro mande un payload sin techo.
      take: 10_000,
    });
  }

  // "Pendientes" = clientes activos SIN código (agregados en caliente, falta completarlos).
  async findPendientes() {
    return this.prisma.cliente.findMany({
      where: { activo: true, codigo: null },
      include: { sector: true },
      orderBy: { id: 'desc' }, // los más recientes primero
      // Guardarraíl: esta bandeja se drena activamente (se completa cada cliente y sale
      // de la lista) — nunca debería crecer sin límite. Igual que arriba, defensivo.
      take: 2_000,
    });
  }

  async countPendientes() {
    const count = await this.prisma.cliente.count({ where: { activo: true, codigo: null } });
    return { count };
  }

  async findPaginated(page: number, limit: number, search?: string) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const offset = (safePage - 1) * safeLimit;

    // Sin búsqueda: orden por código (comportamiento de siempre).
    if (!search || !search.trim()) {
      const where = { activo: true };
      const [data, total] = await Promise.all([
        this.prisma.cliente.findMany({
          where,
          include: { sector: true },
          orderBy: { codigo: { sort: 'asc', nulls: 'last' } },
          skip: offset,
          take: safeLimit,
        }),
        this.prisma.cliente.count({ where }),
      ]);
      return { data, total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
    }

    const q = search.trim().toLowerCase();

    // Query PURAMENTE NUMÉRICA = búsqueda por CÓDIGO exacta ("12" trae solo el 12).
    // Espejo de scoreCliente en el frontend. Evita el ruido de nombres/direcciones con dígitos.
    if (/^\d+$/.test(q)) {
      const where = { activo: true, codigo: Number(q) };
      const [data, total] = await Promise.all([
        this.prisma.cliente.findMany({ where, include: { sector: true }, skip: offset, take: safeLimit }),
        this.prisma.cliente.count({ where }),
      ]);
      return { data, total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
    }

    // Con búsqueda de texto: RANKING por relevancia en SQL (espejo de scoreCliente en el frontend).
    // Pesos: codigo 100, nombre 50, telefono/alt 40, sector 20, direccion 15, descripcion 10.
    const score = Prisma.sql`GREATEST(
      -- Código: SOLO coincidencia exacta ("12" trae el 12, no el 120/121). Espejo de matchers.ts.
      CASE WHEN c.codigo::text = ${q} THEN 300 ELSE 0 END,
      CASE WHEN lower(c.nombre) = ${q} THEN 150
           WHEN lower(c.nombre) LIKE ${q} || '%' THEN 100
           WHEN lower(c.nombre) LIKE '%' || ${q} || '%' THEN 50 ELSE 0 END,
      CASE WHEN lower(c.telefono) = ${q} THEN 120
           WHEN lower(c.telefono) LIKE ${q} || '%' THEN 80
           WHEN lower(c.telefono) LIKE '%' || ${q} || '%' THEN 40 ELSE 0 END,
      CASE WHEN lower(c.telefono_alt) = ${q} THEN 120
           WHEN lower(c.telefono_alt) LIKE ${q} || '%' THEN 80
           WHEN lower(c.telefono_alt) LIKE '%' || ${q} || '%' THEN 40 ELSE 0 END,
      CASE WHEN lower(s.nombre) = ${q} THEN 60
           WHEN lower(s.nombre) LIKE ${q} || '%' THEN 40
           WHEN lower(s.nombre) LIKE '%' || ${q} || '%' THEN 20 ELSE 0 END,
      CASE WHEN lower(c.direccion) = ${q} THEN 45
           WHEN lower(c.direccion) LIKE ${q} || '%' THEN 30
           WHEN lower(c.direccion) LIKE '%' || ${q} || '%' THEN 15 ELSE 0 END,
      CASE WHEN lower(c.descripcion) = ${q} THEN 30
           WHEN lower(c.descripcion) LIKE ${q} || '%' THEN 20
           WHEN lower(c.descripcion) LIKE '%' || ${q} || '%' THEN 10 ELSE 0 END
    )`;

    // 1) IDs ordenados por relevancia (paginados).
    const ranked = await this.prisma.$queryRaw<Array<{ id: number }>>(Prisma.sql`
      SELECT t.id FROM (
        SELECT c.id, c.codigo, ${score} AS score
        FROM clientes c
        LEFT JOIN sectores s ON s.id = c.sector_id
        WHERE c.activo = true
      ) t
      WHERE t.score > 0
      ORDER BY t.score DESC, t.codigo ASC NULLS LAST
      LIMIT ${safeLimit} OFFSET ${offset}
    `);

    // 2) Total de matches (para la paginación).
    const totalRes = await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS count FROM (
        SELECT ${score} AS score
        FROM clientes c
        LEFT JOIN sectores s ON s.id = c.sector_id
        WHERE c.activo = true
      ) t
      WHERE t.score > 0
    `);
    const total = Number(totalRes[0]?.count ?? 0);

    const ids = ranked.map((r) => Number(r.id));
    if (ids.length === 0) {
      return { data: [], total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
    }

    // 3) Traigo los registros completos (con sector) y los reordeno según el ranking.
    const rows = await this.prisma.cliente.findMany({
      where: { id: { in: ids } },
      include: { sector: true },
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const data = ids.map((id) => byId.get(id)).filter(Boolean);

    return { data, total, page: safePage, totalPages: Math.ceil(total / safeLimit) || 1 };
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
    if (updateClienteDto.codigo != null) {
      await this._validarCodigoUnico(updateClienteDto.codigo, id);
    }

    return this.prisma.cliente.update({
      where: { id },
      data: updateClienteDto,
    });
  }

  async remove(id: number) {
    // Verificar existencia
    const cliente = await this.findOne(id);

    // Soft delete + liberar el código: el registro queda (historial) pero su código vuelve a estar
    // disponible para otro cliente (el código es único en toda la base, incluidos los inactivos).
    await this.prisma.cliente.update({
      where: { id },
      data: { activo: false, codigo: null },
    });

    return {
      message: `Cliente '${cliente.nombre}' eliminado correctamente (Soft Delete).`,
      id: cliente.id,
    };
  }

  async removeAllPendientes() {
    const result = await this.prisma.cliente.updateMany({
      where: { activo: true, codigo: null },
      data: { activo: false },
    });

    return {
      message: `${result.count} clientes pendientes eliminados correctamente.`,
      count: result.count,
    };
  }
}
