import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateUsuarioDto } from './create-usuario.dto';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @ApiProperty({ required: false, description: 'Activar/desactivar (soft-delete) al usuario' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
