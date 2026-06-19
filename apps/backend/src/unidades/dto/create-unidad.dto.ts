import { IsNotEmpty, IsInt, IsString, IsOptional, Matches } from 'class-validator';

export class CreateUnidadDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'numeroUnidad debe ser estrictamente numérico (ej. 01)' })
  numeroUnidad: string;

  @IsString()
  @IsNotEmpty()
  placa: string;

  @IsString()
  @IsNotEmpty()
  vehiculo: string;

  @IsString()
  @IsNotEmpty()
  choferNombre: string;

  @IsString()
  @IsOptional()
  choferTelefono?: string;
}
