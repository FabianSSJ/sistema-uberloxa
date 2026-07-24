import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '../../../generated/prisma/client';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'Gabriel' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'GabrielUber' })
  @IsString()
  @IsNotEmpty({ message: 'El username es requerido' })
  username: string;

  // Mismo mínimo que LoginDto: una contraseña creada acá tiene que poder usarse para entrar.
  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ enum: RolUsuario, required: false })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @ApiProperty({ required: false, description: 'Color de identidad (hex libre o de la paleta fija)' })
  @IsOptional()
  @IsString()
  color?: string;
}
