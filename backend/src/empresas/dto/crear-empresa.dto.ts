import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CrearEmpresaDto {
  @IsString()
  nombre!: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;

  @IsOptional()
  @IsString()
  certificadoTitulo?: string;

  @IsOptional()
  @IsString()
  certificadoTexto?: string;
}
