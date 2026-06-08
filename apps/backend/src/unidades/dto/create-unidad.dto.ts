import { IsNotEmpty, IsInt, IsString, IsOptional } from 'class-validator';

export class CreateUnidadDto {
  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsInt()
  @IsNotEmpty()
  modeloId: number;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @IsNotEmpty()
  anio: number;

  @IsString()
  @IsNotEmpty()
  choferNombre: string;

  @IsString()
  @IsOptional()
  choferTelefono?: string;
}
