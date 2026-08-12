import { IsString, IsEmail, IsOptional, Matches } from 'class-validator';

export class CrearUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúscula, minúscula, número y carácter especial',
  })
  password!: string;

  @IsString()
  nombre!: string;

  @IsOptional()
  @IsString()
  rol?: string; // ADMIN, EVALUADOR, etc.
}