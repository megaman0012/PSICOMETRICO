import { Controller, Get, Post, Param, Body, UseGuards, Request, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { AplicacionesService } from './aplicaciones.service';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { GuardarRespuestasDto } from './dto/guardar-respuestas.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AuthenticatedRequest } from '../auth/authenticated-request';

@Controller('aplicaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AplicacionesController {
  constructor(private readonly aplicacionesService: AplicacionesService) {}

  @Post()
  @Roles('ADMIN', 'EVALUADOR')
  async crear(@Request() req: AuthenticatedRequest, @Body() dto: CrearAplicacionDto): Promise<any> {
    // El evaluador siempre proviene del token JWT (no se acepta de la petición)
    dto.evaluadorId = req.user.id;
    return this.aplicacionesService.crear(dto);
  }

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async encontrarTodas(): Promise<any> {
    return this.aplicacionesService.encontrarTodas();
  }

  @Get(':id')
  @Roles('ADMIN', 'EVALUADOR')
  async encontrarPorId(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const aplicacion = await this.aplicacionesService.encontrarPorId(id);
    if (!aplicacion) {
      throw new NotFoundException(`Aplicación con ID ${id} no encontrada`);
    }
    return aplicacion;
  }

  @Post(':id/respuestas')
  @Roles('ADMIN', 'EVALUADOR')
  async guardarRespuestas(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GuardarRespuestasDto,
  ): Promise<void> {
    return this.aplicacionesService.guardarRespuestas(id, dto);
  }

  @Post(':id/finalizar')
  @Roles('ADMIN', 'EVALUADOR')
  async finalizar(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.aplicacionesService.finalizar(id);
  }
}
