import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usuariosService: UsuariosService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * NestJS llama a validate() automáticamente después de verificar la firma.
   * Con tokens de larga duración (30d) la firma válida ya no alcanza: hay que revalidar
   * contra la DB en cada request para que "Desactivar" en Gestión de Usuarios corte el
   * acceso al instante, no recién cuando expire el token. Devolvemos username/nombre/rol/
   * modulosPermitidos FRESCOS de la DB (no los del payload firmado en el login): cualquier
   * edición de un SUPERADMIN sobre esos campos aplica al instante, no recién cuando expire
   * el token viejo. Usamos UsuariosService.findOne (su publicSelect nunca trae passwordHash)
   * en vez de leer la tabla directo, para no duplicar ese invariante en dos lugares.
   * Si la DB falla acá (blip transitorio), fallamos cerrado con 401 en vez de dejar que el
   * error crudo de Prisma escale a un 500 sin manejar en cada endpoint protegido.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    let usuario: Awaited<ReturnType<UsuariosService['findOne']>>;
    try {
      usuario = await this.usuariosService.findOne(payload.sub);
    } catch {
      throw new UnauthorizedException('Sesión inválida');
    }
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Sesión inválida');
    }
    return {
      ...payload,
      username: usuario.username,
      nombre: usuario.nombre,
      rol: usuario.rol,
      modulosPermitidos: usuario.modulosPermitidos,
    };
  }
}
