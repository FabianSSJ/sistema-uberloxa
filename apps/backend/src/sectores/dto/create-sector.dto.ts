import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectorDto {
  @ApiProperty({
    description: 'Nombre único del sector',
    example: 'Norte',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre del sector no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional del sector',
    example: 'Zona norte de la ciudad, desde la calle X hasta Y',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;
}
