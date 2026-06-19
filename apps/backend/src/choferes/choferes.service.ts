import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChoferesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.chofer.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.chofer.findUnique({ where: { id } });
  }

  async create(data: { nombre: string; telefono?: string }) {
    return this.prisma.chofer.create({ data });
  }

  async update(id: number, data: { nombre?: string; telefono?: string; activo?: boolean }) {
    return this.prisma.chofer.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Instead of deleting, we might want to deactivate to preserve relations
    // But if we delete, we'll let Prisma handle the set null or cascade according to schema
    return this.prisma.chofer.delete({ where: { id } });
  }
}
