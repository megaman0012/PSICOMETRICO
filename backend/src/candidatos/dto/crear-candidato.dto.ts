import { IsString, IsEmail, IsOptional, IsDateString, IsInt } from 'class-validator';

export class CrearCandidatoDto {
  @IsString()
  nombre!: string;

  @IsString()
  apellido!: string;

  @IsString()
  cedula!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  cargoPostulado?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsInt()
  empresaId?: number;
}
