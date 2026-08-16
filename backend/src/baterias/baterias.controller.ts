import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BateriasService } from './baterias.service';
import { CrearBateriaDto } from './dto/crear-bateria.dto';
import { Bateria } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('baterias')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BateriasController {
  constructor(private readonly bateriasService: BateriasService) {}

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async listar(): Promise<Bateria[]> {
    return this.bateriasService.listar();
  }

  @Get('activas')
  @Roles('ADMIN', 'EVALUADOR')
  async listarActivas(): Promise<Bateria[]> {
    return this.bateriasService.listarActivas();
  }

  @Post()
  @Roles('ADMIN')
  async crear(@Body() dto: CrearBateriaDto): Promise<Bateria> {
    return this.bateriasService.crear(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearBateriaDto,
  ): Promise<Bateria> {
    return this.bateriasService.actualizar(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.bateriasService.eliminar(id);
  }
}
