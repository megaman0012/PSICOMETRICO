import { IsInt, Min, IsOptional } from 'class-validator';

export class CrearAplicacionDto {
  @IsInt()
  @Min(1)
  pruebaId!: number;

  @IsInt()
  @Min(1)
  candidatoId!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  evaluadorId?: number;
}
