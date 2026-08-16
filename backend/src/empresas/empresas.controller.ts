import { Controller, Get, Post, Put, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { CrearEmpresaDto } from './dto/crear-empresa.dto';
import { Empresa } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('empresas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async listar(): Promise<Empresa[]> {
    return this.empresasService.listar();
  }

  @Post()
  @Roles('ADMIN')
  async crear(@Body() dto: CrearEmpresaDto): Promise<Empresa> {
    return this.empresasService.crear(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearEmpresaDto,
  ): Promise<Empresa> {
    return this.empresasService.actualizar(id, dto);
  }
}
