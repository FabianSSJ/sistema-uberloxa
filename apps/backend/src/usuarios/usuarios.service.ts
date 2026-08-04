import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  // Campos públicos del usuario (nunca el passwordHash).
  private readonly publicSelect = {
    id: true,
    nombre: true,
    username: true,
    rol: true,
    modulosPermitidos: true,
    activo: true,
    color: true,
    createdAt: true,
  };

  async findAll() {
    return this.prisma.usuario.findMany({
      select: this.publicSelect,
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: this.publicSelect,
    });
  }

  async create(data: CreateUsuarioDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { username: data.username } });
    if (existing) {
      throw new BadRequestException('El nombre de usuario ya existe');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const rolToAssign = data.rol || 'CHARLIE';
    const modulosPermitidos = rolToAssign === 'SUPERADMIN' ? [] : ['carreras', 'clientes', 'unidades', 'choferes'];

    return this.prisma.usuario.create({
      data: {
        nombre: data.nombre,
        username: data.username,
        passwordHash,
        rol: rolToAssign,
        modulosPermitidos,
        color: data.color ?? null,
      },
      select: this.publicSelect,
    });
  }

  async update(id: number, data: UpdateUsuarioDto) {
    // undefined → Prisma ignora el campo; null → lo limpia. Así 'color' se puede setear o borrar.
    const updateData: any = {
      nombre: data.nombre,
      rol: data.rol,
      activo: data.activo,
      color: data.color,
    };

    if (data.rol) {
      updateData.modulosPermitidos = data.rol === 'SUPERADMIN' ? [] : ['carreras', 'clientes', 'unidades', 'choferes'];
    }

    if (data.username) {
      updateData.username = data.username;
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: this.publicSelect,
    });
  }

  // "Eliminar" = DESACTIVAR (soft-delete): bloquea el login pero conserva el historial
  // de carreras y su atribución. Reversible reactivando (update con activo=true).
  async remove(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // Anti-lockout: no permitir desactivar al último SUPERADMIN activo.
    if (usuario.rol === 'SUPERADMIN' && usuario.activo) {
      const superadminsActivos = await this.prisma.usuario.count({
        where: { rol: 'SUPERADMIN', activo: true },
      });
      if (superadminsActivos <= 1) {
        throw new BadRequestException('No se puede desactivar al último SUPERADMIN activo');
      }
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: this.publicSelect,
    });
  }
}
