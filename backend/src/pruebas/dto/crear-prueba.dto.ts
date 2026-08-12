import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CrearOpcionDto {
  @IsString()
  texto!: string;

  @IsNumber()
  valor!: number;

  @IsOptional()
  @IsBoolean()
  esCorrecta?: boolean;
}

export class CrearPreguntaDto {
  @IsString()
  enunciado!: string;

  @IsOptional()
  @IsIn(['LIKERT', 'OPCION_MULTIPLE'])
  tipo?: string;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearOpcionDto)
  opciones!: CrearOpcionDto[];
}

export class CrearDimensionDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsInt()
  orden?: number;

  @IsOptional()
  @IsIn(['SUMA', 'PROMEDIO'])
  tipoAgregacion?: 'SUMA' | 'PROMEDIO';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearPreguntaDto)
  preguntas?: CrearPreguntaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearUmbralDto)
  umbrales?: CrearUmbralDto[];
}

export class CrearUmbralDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  puntuacionMinima!: number;

  @IsNumber()
  @Min(0)
  puntuacionMaxima!: number;

  @IsString()
  interpretacion!: string;
}

export class CambiarEstadoPruebaDto {
  @IsBoolean()
  activa!: boolean;
}

export class CrearPruebaDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearDimensionDto)
  dimensiones?: CrearDimensionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CrearUmbralDto)
  umbrales?: CrearUmbralDto[];
}
