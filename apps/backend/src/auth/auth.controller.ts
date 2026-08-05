import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  // Límite propio, más estricto que el global (3000/min): frena fuerza bruta de contraseña
  // sin depender del límite genérico de toda la API. Por IP, no por usuario — y está
  // confirmado que la mayoría de las Charlies + admin entran desde la MISMA IP de oficina,
  // muchas veces agrupadas al arrancar el turno (varios logins + algún typo en pocos
  // minutos). 40/min deja margen real para eso. La protección DE VERDAD contra fuerza bruta
  // ya está en AuthService (bloqueo por CUENTA a los 6 intentos fallidos) — este throttle
  // por IP es una capa extra contra spray de usuarios, no la única línea de defensa, así que
  // no hace falta que sea agresivo a costa de trabar un arranque de turno normal.
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión', description: 'Retorna un JWT Bearer token' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna access_token' })
  @ApiResponse({ status: 400, description: 'Payload inválido (class-validator)' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos, esperá un minuto.' })
  login(@Body() dto: LoginDto): Promise<any> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario del token JWT' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  getMe(@CurrentUser() user: JwtPayload): JwtPayload {
    return user;
  }
}
