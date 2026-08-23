import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from '../../../src/auth/strategies/jwt.strategy';
import { UsuariosService } from '../../../src/usuarios/usuarios.service';
import type { JwtPayload } from '../../../src/auth/interfaces/jwt-payload.interface';

const mockUsuariosService = {
  findOne: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-secret'),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const payload: JwtPayload = {
    sub: 1,
    username: 'admin',
    nombre: 'Administrador',
    rol: 'SUPERADMIN',
    modulosPermitidos: ['clientes', 'carreras'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsuariosService, useValue: mockUsuariosService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza el token si el usuario ya no existe en la DB', async () => {
    mockUsuariosService.findOne.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('rechaza el token si el usuario fue desactivado (revocación por "Desactivar")', async () => {
    mockUsuariosService.findOne.mockResolvedValue({
      id: 1,
      username: 'admin',
      nombre: 'Administrador',
      rol: 'SUPERADMIN',
      modulosPermitidos: ['clientes', 'carreras'],
      activo: false,
    });

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });

  it('devuelve username/nombre/rol/modulosPermitidos FRESCOS de la DB, no los del payload firmado', async () => {
    mockUsuariosService.findOne.mockResolvedValue({
      id: 1,
      username: 'admin.renombrado',
      nombre: 'Admin Renombrado',
      rol: 'CHARLIE',
      modulosPermitidos: ['carreras'],
      activo: true,
    });

    const result = await strategy.validate(payload);

    expect(result.username).toBe('admin.renombrado');
    expect(result.nombre).toBe('Admin Renombrado');
    expect(result.rol).toBe('CHARLIE');
    expect(result.modulosPermitidos).toEqual(['carreras']);
  });

  it('consulta por el id del payload (sub), no por username', async () => {
    mockUsuariosService.findOne.mockResolvedValue({
      id: 1,
      username: 'admin',
      nombre: 'Administrador',
      rol: 'SUPERADMIN',
      modulosPermitidos: ['clientes', 'carreras'],
      activo: true,
    });

    await strategy.validate(payload);

    expect(mockUsuariosService.findOne).toHaveBeenCalledWith(1);
  });

  it('falla cerrado (401, no 500) si la consulta a la DB rechaza', async () => {
    mockUsuariosService.findOne.mockRejectedValue(new Error('Connection refused'));

    await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});
