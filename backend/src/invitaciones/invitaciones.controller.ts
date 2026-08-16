import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('invitaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitacionesController {
  constructor(private readonly invitacionesService: InvitacionesService) {}

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async listar() {
    return this.invitacionesService.listar();
  }

  @Post()
  @Roles('ADMIN', 'EVALUADOR')
  async crear(@Body() dto: CrearInvitacionDto) {
    return this.invitacionesService.crear(dto);
  }

  @Get(':id')
  @Roles('ADMIN', 'EVALUADOR')
  async detalle(@Param('id', ParseIntPipe) id: number) {
    return this.invitacionesService.detalle(id);
  }

  @Post(':id/reintentar')
  @Roles('ADMIN')
  async reintentar(@Param('id', ParseIntPipe) id: number) {
    return this.invitacionesService.reintentar(id);
  }

  @Post(':id/cancelar')
  @Roles('ADMIN')
  async cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.invitacionesService.cancelar(id);
  }
}
