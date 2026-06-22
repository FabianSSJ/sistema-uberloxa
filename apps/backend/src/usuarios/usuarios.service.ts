import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        modulosPermitidos: true,
        activo: true,
        createdAt: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        modulosPermitidos: true,
        activo: true,
        createdAt: true,
      },
    });
  }

  async create(data: any) {
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
      },
      select: { id: true, nombre: true, username: true, rol: true },
    });
  }

  async update(id: number, data: any) {
    const updateData: any = {
      nombre: data.nombre,
      rol: data.rol,
      activo: data.activo,
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
      select: { id: true, nombre: true, username: true, rol: true },
    });
  }

  async remove(id: number) {
    return this.prisma.usuario.delete({ where: { id } });
  }
}
