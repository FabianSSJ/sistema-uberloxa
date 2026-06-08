import { IsNotEmpty, IsInt, IsString } from 'class-validator';

export class CreateModeloDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsInt()
  @IsNotEmpty()
  marcaId: number;
}
