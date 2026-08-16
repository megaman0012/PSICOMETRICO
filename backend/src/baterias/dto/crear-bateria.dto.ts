import { IsString, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';

export class CrearBateriaDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsInt()
  empresaId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  pruebaIds?: number[];
}
