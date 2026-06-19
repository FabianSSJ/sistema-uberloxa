import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCarreraDto {
  @IsNumber()
  clienteId: number;

  @IsNumber()
  @IsOptional()
  unidadId?: number;

  @IsString()
  @IsOptional()
  notas?: string;
}
