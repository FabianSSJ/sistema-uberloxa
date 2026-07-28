import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Bloqueo de CUENTA (por username), independiente del throttle por IP que ya existe en
// /auth/login. En esta central de despacho toda la oficina comparte una sola IP — eso
// diluye cualquier ataque dirigido a UNA cuenta puntual dentro del tráfico normal de
// logins de las demás Charlies. Este bloqueo protege cada cuenta sin importar desde dónde
// se conecten (relevante también para admin, que sí entra desde IPs variables).
const MAX_INTENTOS_FALLIDOS = 6;
const BLOQUEO_MINUTOS = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<any> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username: dto.username },
    });

    // Mensaje genérico intencional: no revelar si el usuario existe o no (security)
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Si ya está bloqueada, ni siquiera comparamos la contraseña. Esto SÍ confirma que la
    // cuenta existe (a diferencia del mensaje genérico de arriba) — trade-off deliberado:
    // preferimos que una Charlie bloqueada entienda por qué no puede entrar, en vez de
    // hacerle creer que el sistema está roto (como ya pasó una vez esta semana).
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60_000);
      throw new UnauthorizedException(
        `Cuenta bloqueada temporalmente por demasiados intentos fallidos. Probá de nuevo en ${minutosRestantes} minuto${minutosRestantes === 1 ? '' : 's'}.`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!isPasswordValid) {
      const intentos = usuario.intentosFallidos + 1;
      const seBloquea = intentos >= MAX_INTENTOS_FALLIDOS;
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidos: seBloquea ? 0 : intentos,
          bloqueadoHasta: seBloquea ? new Date(Date.now() + BLOQUEO_MINUTOS * 60_000) : null,
        },
      });
      if (seBloquea) {
        throw new UnauthorizedException(`Demasiados intentos fallidos. Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos.`);
      }
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Login correcto: limpiar cualquier rastro de intentos fallidos previos.
    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null },
      });
    }

    const payload: JwtPayload = {
      sub: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      modulosPermitidos: usuario.modulosPermitidos,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
        modulosPermitidos: usuario.modulosPermitidos,
      }
    };
  }
}
