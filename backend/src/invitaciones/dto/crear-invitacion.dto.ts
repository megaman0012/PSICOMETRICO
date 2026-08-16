import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CrearInvitacionDto {
  @IsInt()
  candidatoId!: number;

  @IsInt()
  bateriaId!: number;

  @IsOptional()
  @IsInt()
  horasExpiracion?: number;

  @IsOptional()
  @IsBoolean()
  enviarCorreo?: boolean;
}
