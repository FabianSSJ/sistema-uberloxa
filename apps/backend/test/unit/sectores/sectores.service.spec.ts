import { Test, TestingModule } from '@nestjs/testing';
import { SectoresService } from '../../../src/sectores/sectores.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  sector: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('SectoresService', () => {
  let service: SectoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectoresService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SectoresService>(SectoresService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear un sector exitosamente', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue(null);
      mockPrismaService.sector.create.mockResolvedValue({ id: 1, nombre: 'Norte' });

      const result = await service.create({ nombre: 'Norte' });
      
      expect(result).toEqual({ id: 1, nombre: 'Norte' });
      expect(mockPrismaService.sector.create).toHaveBeenCalledWith({
        data: { nombre: 'Norte' },
      });
    });

    it('debe lanzar ConflictException si el nombre ya existe', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue({ id: 1, nombre: 'Norte' });

      await expect(service.create({ nombre: 'Norte' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('debe retornar lista de sectores', async () => {
      mockPrismaService.sector.findMany.mockResolvedValue([{ id: 1, nombre: 'Norte' }]);

      const result = await service.findAll();
      
      expect(result).toEqual([{ id: 1, nombre: 'Norte' }]);
      expect(mockPrismaService.sector.findMany).toHaveBeenCalledWith({ orderBy: { nombre: 'asc' } });
    });
  });

  describe('findOne', () => {
    it('debe retornar un sector si existe', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue({ id: 1, nombre: 'Norte' });

      const result = await service.findOne(1);
      
      expect(result).toEqual({ id: 1, nombre: 'Norte' });
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar correctamente', async () => {
      // existe el sector a actualizar
      mockPrismaService.sector.findUnique
        .mockResolvedValueOnce({ id: 1, nombre: 'Norte' }) // findOne
        .mockResolvedValueOnce(null); // colision check
        
      mockPrismaService.sector.update.mockResolvedValue({ id: 1, nombre: 'Sur' });

      const result = await service.update(1, { nombre: 'Sur' });
      
      expect(result).toEqual({ id: 1, nombre: 'Sur' });
    });

    it('debe lanzar ConflictException si el nuevo nombre ya está en uso', async () => {
      mockPrismaService.sector.findUnique
        .mockResolvedValueOnce({ id: 1, nombre: 'Norte' }) // findOne
        .mockResolvedValueOnce({ id: 2, nombre: 'Sur' }); // colision check
        
      await expect(service.update(1, { nombre: 'Sur' })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe eliminar y retornar métricas de desvinculación', async () => {
      mockPrismaService.sector.findUnique.mockResolvedValue({ id: 1, nombre: 'Norte' });
      
      // Mock de la transacción simulando la función de callback
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          cliente: { updateMany: jest.fn().mockResolvedValue({ count: 5 }) },
          sector: { delete: jest.fn().mockResolvedValue({ id: 1 }) },
        };
        return callback(tx);
      });

      const result = await service.remove(1);
      
      expect(result).toEqual({
        message: "Sector 'Norte' eliminado correctamente. 5 clientes fueron desvinculados.",
        desvinculados: 5,
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
