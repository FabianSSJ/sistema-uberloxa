import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCarreraDto {
  @IsInt()
  clienteId: number;

  @IsOptional()
  @IsInt()
  unidadId?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
