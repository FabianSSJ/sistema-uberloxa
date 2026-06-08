import { Test, TestingModule } from '@nestjs/testing';
import { ClientesService } from '../../../src/clientes/clientes.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  cliente: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  sector: {
    findUnique: jest.fn(),
  },
};

describe('ClientesService', () => {
  let service: ClientesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ClientesService>(ClientesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un cliente sin sectorId', async () => {
      mockPrismaService.cliente.create.mockResolvedValue({ id: 1, nombre: 'Juan' });

      const result = await service.create({ nombre: 'Juan' });
      
      expect(result).toEqual({ id: 1, nombre: 'Juan' });
      expect(mockPrismaService.sector.findUnique).not.toHaveBeenCalled();
      expect(mockPrismaService.cliente.create).toHaveBeenCalledWith({
        data: { nombre: 'Juan' },
      });
    });

    it('debe validar el sector si se envía sectorId', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue({ id: 10, nombre: 'Centro' });
      mockPrismaService.cliente.create.mockResolvedValue({ id: 1, nombre: 'Juan', sectorId: 10 });

      const result = await service.create({ nombre: 'Juan', sectorId: 10 });
      
      expect(result).toEqual({ id: 1, nombre: 'Juan', sectorId: 10 });
      expect(mockPrismaService.sector.findUnique).toHaveBeenCalledWith({ where: { id: 10 } });
    });

    it('debe lanzar NotFoundException si el sectorId no existe', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue(null);

      await expect(service.create({ nombre: 'Juan', sectorId: 99 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('debe retornar solo clientes activos incluyendo su sector', async () => {
      mockPrismaService.cliente.findMany.mockResolvedValue([{ id: 1, nombre: 'Juan', activo: true }]);

      const result = await service.findAll();
      
      expect(result).toEqual([{ id: 1, nombre: 'Juan', activo: true }]);
      expect(mockPrismaService.cliente.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        include: { sector: true },
        orderBy: { nombre: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar un cliente activo', async () => {
      mockPrismaService.cliente.findFirst.mockResolvedValue({ id: 1, nombre: 'Juan', activo: true });

      const result = await service.findOne(1);
      
      expect(result).toEqual({ id: 1, nombre: 'Juan', activo: true });
    });

    it('debe lanzar NotFoundException si no existe o está inactivo', async () => {
      mockPrismaService.cliente.findFirst.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('debe hacer soft delete (activo: false)', async () => {
      // existe
      mockPrismaService.cliente.findFirst.mockResolvedValue({ id: 1, nombre: 'Juan', activo: true });
      mockPrismaService.cliente.update.mockResolvedValue({ id: 1, nombre: 'Juan', activo: false });

      const result = await service.remove(1);
      
      expect(result).toEqual({
        message: "Cliente 'Juan' eliminado correctamente (Soft Delete).",
        id: 1,
      });
      expect(mockPrismaService.cliente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false },
      });
    });
  });
});
