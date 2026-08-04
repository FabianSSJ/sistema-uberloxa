import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '8h');
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd' | 'w'}`,
          },
        };
      },
    }),
    // Frena fuerza bruta en /auth/login: 20 intentos por IP cada 60s. Solo se aplica ahí
    // (vía @UseGuards(ThrottlerGuard) en el controller) — no toca el resto de la API.
    // OJO: el límite es por IP, no por usuario — en una central de despacho varias Charlies
    // pueden compartir la misma IP/red. 5/min (el valor original) se agotaba entre varios
    // logins reales + algún typo; 20/min sigue frenando un ataque automatizado en serio
    // (nada que ver con probar contraseñas a mano) sin trabar el uso normal de la oficina.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
