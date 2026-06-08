import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Aplica este guard con @UseGuards(JwtAuthGuard) en cualquier endpoint protegido.
 * Extiende AuthGuard('jwt') para usar la JwtStrategy de Passport automáticamente.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
