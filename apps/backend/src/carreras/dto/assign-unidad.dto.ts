import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignUnidadDto {
  @IsInt()
  @IsNotEmpty()
  unidadId: number;
}
