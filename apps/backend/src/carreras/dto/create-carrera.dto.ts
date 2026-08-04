import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { EstadoCarrera } from '../../../generated/prisma/client';

export class CreateCarreraDto {
  @IsNumber()
  clienteId: number;

  @IsNumber()
  @IsOptional()
  unidadId?: number;

  @IsString()
  @IsOptional()
  notas?: string;

  @IsEnum(EstadoCarrera)
  @IsOptional()
  estado?: EstadoCarrera;
}
