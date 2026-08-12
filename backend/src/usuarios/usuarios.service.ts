import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Usuario } from '@prisma/client';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import * as bcrypt from 'bcryptjs';

export type UsuarioSinPassword = Omit<Usuario, 'password'>;

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearUsuarioDto): Promise<Usuario> {
    // Hashear la contraseña antes de guardarla
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);
    
    return this.prisma.usuario.create({
      data: {
        email: dto.email,
        password: passwordHash,
        nombre: dto.nombre,
        rol: dto.rol || 'EVALUADOR',
      },
    });
  }

  async encontrarTodos(): Promise<UsuarioSinPassword[]> {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        fechaCreacion: true,
      }, // Excluir el password por seguridad
      orderBy: { nombre: 'asc' },
    });
  }

  async encontrarPorId(id: number): Promise<UsuarioSinPassword | null> {
    return this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        fechaCreacion: true,
      }, // Excluir el password por seguridad
    });
  }

  async validarCredenciales(email: string, password: string): Promise<UsuarioSinPassword | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });
    
    if (usuario && (await bcrypt.compare(password, usuario.password))) {
      const { password: _, ...result } = usuario;
      return result;
    }
    return null;
  }
}