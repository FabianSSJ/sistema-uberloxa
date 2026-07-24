import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class FindCarrerasQueryDto {
  @IsISO8601()
  @IsOptional()
  desde?: string;

  @IsISO8601()
  @IsOptional()
  hasta?: string;

  // Keyset pagination: id de la última carrera ya cargada (se piden las siguientes, id < cursor).
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  cursor?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number;
}
