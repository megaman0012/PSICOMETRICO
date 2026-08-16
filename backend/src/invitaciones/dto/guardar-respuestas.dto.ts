import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested, ArrayNotEmpty } from 'class-validator';

export class RespuestaPublicaDto {
  @IsInt()
  aplicacionId!: number;

  @IsInt()
  preguntaId!: number;

  @IsInt()
  opcionId!: number;
}

export class GuardarRespuestasDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RespuestaPublicaDto)
  respuestas!: RespuestaPublicaDto[];
}
