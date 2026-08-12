import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../../src/auth/auth.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import type { LoginDto } from '../../../src/auth/dto/login.dto';

// ──────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────

const mockPrismaService = {
  usuario: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn(),
};

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

async function buildUserFixture(overrides: Partial<{
  id: number;
  username: string;
  nombre: string;
  password: string;
  activo: boolean;
  rol: string;
  modulosPermitidos: string[];
  intentosFallidos: number;
  bloqueadoHasta: Date | null;
}> = {}) {
  const {
    id = 1,
    username = 'admin',
    nombre = 'Administrador',
    password = 'secret123',
    activo = true,
    rol = 'SUPERADMIN',
    modulosPermitidos = ['clientes', 'carreras'],
    intentosFallidos = 0,
    bloqueadoHasta = null,
  } = overrides;

  return {
    id,
    username,
    nombre,
    passwordHash: await bcrypt.hash(password, 10),
    activo,
    rol,
    modulosPermitidos,
    intentosFallidos,
    bloqueadoHasta,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
}

// ──────────────────────────────────────────────────────────
// Suite
// ──────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────
  // login()
  // ────────────────────────────────────────────────────────

  describe('login()', () => {
    describe('camino feliz', () => {
      it('retorna access_token cuando las credenciales son válidas', async () => {
        const user = await buildUserFixture();
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);
        mockJwtService.signAsync.mockResolvedValue('signed.jwt.token');

        const dto: LoginDto = { username: 'admin', password: 'secret123' };
        const result = await service.login(dto);

        expect(result).toEqual({
          access_token: 'signed.jwt.token',
          user: {
            id: 1,
            nombre: 'Administrador',
            username: 'admin',
            rol: 'SUPERADMIN',
            modulosPermitidos: ['clientes', 'carreras'],
          },
        });
      });

      it('llama a findUnique con el username correcto', async () => {
        const user = await buildUserFixture();
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);
        mockJwtService.signAsync.mockResolvedValue('token');

        await service.login({ username: 'admin', password: 'secret123' });

        expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledWith({
          where: { username: 'admin' },
        });
        expect(mockPrismaService.usuario.findUnique).toHaveBeenCalledTimes(1);
      });

      it('firma el JWT con el payload correcto (sub, username, nombre)', async () => {
        const user = await buildUserFixture({ id: 42, nombre: 'Juan Pérez' });
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);
        mockJwtService.signAsync.mockResolvedValue('token');

        await service.login({ username: 'admin', password: 'secret123' });

        expect(mockJwtService.signAsync).toHaveBeenCalledWith({
          sub: 42,
          username: 'admin',
          nombre: 'Juan Pérez',
          rol: 'SUPERADMIN',
          modulosPermitidos: ['clientes', 'carreras'],
        });
      });

      it('nunca incluye passwordHash en el payload del JWT', async () => {
        const user = await buildUserFixture();
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);
        mockJwtService.signAsync.mockResolvedValue('token');

        await service.login({ username: 'admin', password: 'secret123' });

        const signPayload = mockJwtService.signAsync.mock.calls[0][0] as Record<string, unknown>;
        expect(signPayload).not.toHaveProperty('passwordHash');
        expect(signPayload).not.toHaveProperty('password');
      });
    });

    // ────────────────────────────────────────────────────
    // Seguridad: todos los caminos de error deben ser
    // indistinguibles para prevenir user enumeration
    // ────────────────────────────────────────────────────

    describe('seguridad — error genérico ante credenciales inválidas', () => {
      const EXPECTED_ERROR_MESSAGE = 'Credenciales inválidas';

      it('lanza UnauthorizedException cuando el usuario no existe', async () => {
        mockPrismaService.usuario.findUnique.mockResolvedValue(null);

        await expect(
          service.login({ username: 'noexiste', password: 'cualquier' }),
        ).rejects.toThrow(new UnauthorizedException(EXPECTED_ERROR_MESSAGE));
      });

      it('lanza UnauthorizedException cuando el usuario está inactivo (activo=false)', async () => {
        const user = await buildUserFixture({ activo: false });
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);

        await expect(
          service.login({ username: 'admin', password: 'secret123' }),
        ).rejects.toThrow(new UnauthorizedException(EXPECTED_ERROR_MESSAGE));
      });

      it('lanza UnauthorizedException cuando la contraseña es incorrecta', async () => {
        const user = await buildUserFixture({ password: 'correcta123' });
        mockPrismaService.usuario.findUnique.mockResolvedValue(user);

        await expect(
          service.login({ username: 'admin', password: 'incorrecta999' }),
        ).rejects.toThrow(new UnauthorizedException(EXPECTED_ERROR_MESSAGE));
      });

      it('el mensaje de error es idéntico en todos los casos de fallo (anti user-enumeration)', async () => {
        const scenarios: Array<() => Promise<void>> = [
          async () => {
            mockPrismaService.usuario.findUnique.mockResolvedValue(null);
            await service.login({ username: 'x', password: 'y' });
          },
          async () => {
            const user = await buildUserFixture({ activo: false });
            mockPrismaService.usuario.findUnique.mockResolvedValue(user);
            await service.login({ username: 'admin', password: 'secret123' });
          },
          async () => {
            const user = await buildUserFixture();
            mockPrismaService.usuario.findUnique.mockResolvedValue(user);
            await service.login({ username: 'admin', password: 'wrong' });
          },
        ];

        for (const scenario of scenarios) {
          await expect(scenario()).rejects.toMatchObject({
            message: EXPECTED_ERROR_MESSAGE,
            status: 401,
          });
          jest.clearAllMocks();
        }
      });

      it('no llama a jwtService.signAsync en ningún caso de fallo', async () => {
        mockPrismaService.usuario.findUnique.mockResolvedValue(null);
        await service.login({ username: 'x', password: 'y' }).catch(() => {});
        expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      });
    });

    describe('robustez', () => {
      it('propaga errores de la DB sin modificarlos', async () => {
        const dbError = new Error('Connection refused');
        mockPrismaService.usuario.findUnique.mockRejectedValue(dbError);

        await expect(
          service.login({ username: 'admin', password: 'pass' }),
        ).rejects.toThrow('Connection refused');
      });
    });
  });
});
