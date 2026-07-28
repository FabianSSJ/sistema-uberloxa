import { IsString, IsOptional, IsInt, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClienteDto {
  @ApiPropertyOptional({ description: 'Código del cliente (único)' })
  @IsInt({ message: 'El código debe ser un número entero' })
  @Min(1, { message: 'El código debe ser mayor a 0' })
  @IsOptional()
  codigo?: number;

  @ApiPropertyOptional({ description: 'Nombre completo del cliente (si no viene, el service arma uno provisorio a partir del teléfono)' })
  @IsString()
  @IsOptional()
  @MaxLength(150, { message: 'El nombre no puede exceder los 150 caracteres' })
  nombre?: string;

  @ApiPropertyOptional({ description: 'Teléfono principal' })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'El teléfono no puede exceder los 50 caracteres' })
  telefono?: string;

  @ApiPropertyOptional({ description: 'Teléfono alternativo' })
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'El teléfono alternativo no puede exceder los 50 caracteres' })
  telefonoAlt?: string;

  @ApiPropertyOptional({ description: 'ID del sector asociado' })
  @IsInt({ message: 'El ID del sector debe ser un número entero' })
  @IsOptional()
  sectorId?: number;

  @ApiPropertyOptional({ description: 'Dirección del cliente' })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'La dirección no puede exceder los 255 caracteres' })
  direccion?: string;

  @ApiPropertyOptional({ description: 'Descripción adicional' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Link a Google Maps' })
  @IsString()
  @IsOptional()
  linkGoogleMaps?: string;
}
