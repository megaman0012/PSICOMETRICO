import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PruebasService } from './pruebas.service';
import { Prueba } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CambiarEstadoPruebaDto, CrearPruebaDto } from './dto/crear-prueba.dto';

@Controller('pruebas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PruebasController {
  constructor(private readonly pruebasService: PruebasService) {}

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async encontrarTodas(): Promise<Prueba[]> {
    return this.pruebasService.encontrarTodas();
  }

  // Listado para administración: incluye pruebas inactivas y conteos
  @Get('todas')
  @Roles('ADMIN')
  async encontrarTodasAdmin(): Promise<Prueba[]> {
    return this.pruebasService.encontrarTodasAdmin();
  }

  @Get(':id')
  @Roles('ADMIN', 'EVALUADOR')
  async encontrarPorId(@Param('id', ParseIntPipe) id: number): Promise<Prueba> {
    const prueba = await this.pruebasService.encontrarPorId(id);
    if (!prueba) {
      throw new NotFoundException(`Prueba con ID ${id} no encontrada`);
    }
    return prueba;
  }

  @Post()
  @Roles('ADMIN')
  async crear(@Body() dto: CrearPruebaDto): Promise<Prueba> {
    return this.pruebasService.crear(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearPruebaDto,
  ): Promise<Prueba> {
    return this.pruebasService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async eliminar(@Param('id', ParseIntPipe) id: number): Promise<{ mensaje: string }> {
    return this.pruebasService.eliminar(id);
  }

  // Activa/desactiva una prueba sin reconstruir su estructura (no pierde datos).
  @Patch(':id/estado')
  @Roles('ADMIN')
  async cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CambiarEstadoPruebaDto,
  ): Promise<Prueba> {
    return this.pruebasService.cambiarEstado(id, dto.activa);
  }
}
