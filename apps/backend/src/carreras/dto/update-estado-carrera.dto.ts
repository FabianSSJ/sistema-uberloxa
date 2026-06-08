import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoCarrera } from '../../../generated/prisma/client';

export class UpdateEstadoCarreraDto {
  @IsEnum(EstadoCarrera)
  @IsNotEmpty()
  estado: EstadoCarrera;
}
