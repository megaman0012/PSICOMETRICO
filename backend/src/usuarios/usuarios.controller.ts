import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsuariosService, UsuarioSinPassword } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { Usuario } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../auth/authenticated-request';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('ADMIN') // Solo administradores pueden crear usuarios
  async crear(@Body() dto: CrearUsuarioDto): Promise<Usuario> {
    return this.usuariosService.crear(dto);
  }

  @Get()
  @Roles('ADMIN') // Solo administradores pueden listar usuarios
  async encontrarTodos(): Promise<UsuarioSinPassword[]> {
    return this.usuariosService.encontrarTodos();
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard) // Cualquier usuario autenticado puede ver su propio perfil
  async obtenerPerfil(@Request() req: AuthenticatedRequest): Promise<UsuarioSinPassword | null> {
    return this.usuariosService.encontrarPorId(req.user.id);
  }
}