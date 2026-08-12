import { IsArray } from 'class-validator';

export class GuardarRespuestasDto {
  @IsArray()
  respuestas!: {
    preguntaId: number;
    opcionId: number;
  }[];
}