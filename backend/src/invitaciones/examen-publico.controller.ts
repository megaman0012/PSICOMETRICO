import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InvitacionesService } from './invitaciones.service';
import { GuardarRespuestasDto } from './dto/guardar-respuestas.dto';

@Controller('publico/examen')
export class ExamenPublicoController {
  constructor(private readonly invitacionesService: InvitacionesService) {}

  @Get(':token')
  async obtenerExamen(@Param('token') token: string) {
    return this.invitacionesService.obtenerExamen(token);
  }

  @Post(':token/respuestas')
  async guardarRespuestas(
    @Param('token') token: string,
    @Body() dto: GuardarRespuestasDto,
  ) {
    await this.invitacionesService.guardarRespuestas(token, dto);
    return { guardado: true };
  }

  @Post(':token/finalizar')
  async finalizar(@Param('token') token: string, @Body() dto: GuardarRespuestasDto) {
    return this.invitacionesService.finalizar(token, dto);
  }
}
