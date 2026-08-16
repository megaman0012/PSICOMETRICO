import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  ParseIntPipe,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CandidatosService } from './candidatos.service';
import { CrearCandidatoDto } from './dto/crear-candidato.dto';
import { Candidato } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('candidatos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CandidatosController {
  constructor(private readonly candidatosService: CandidatosService) {}

  @Post()
  @Roles('ADMIN', 'EVALUADOR')
  async crear(@Body() dto: CrearCandidatoDto): Promise<Candidato> {
    return this.candidatosService.crear(dto);
  }

  @Get()
  @Roles('ADMIN', 'EVALUADOR')
  async encontrarTodos(): Promise<Candidato[]> {
    return this.candidatosService.encontrarTodos();
  }

  @Get('exportar')
  @Roles('ADMIN', 'EVALUADOR')
  async exportar(@Res() res: Response) {
    const csv = await this.candidatosService.exportarCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="candidatos_${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @Get('plantilla')
  @Roles('ADMIN', 'EVALUADOR')
  async plantilla(@Res() res: Response) {
    const csv = this.candidatosService.plantillaCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_candidatos.csv"');
    res.send(csv);
  }

  @Post('masivo')
  @Roles('ADMIN', 'EVALUADOR')
  @UseInterceptors(FileInterceptor('archivo'))
  async importarMasivo(@UploadedFile() archivo: Express.Multer.File) {
    return this.candidatosService.importarMasivo(archivo);
  }

  @Get('buscar/:cedula')
  @Roles('ADMIN', 'EVALUADOR')
  async buscarPorCedula(@Param('cedula') cedula: string): Promise<Candidato> {
    const candidato = await this.candidatosService.buscarPorCedula(cedula);
    if (!candidato) {
      throw new NotFoundException(`Candidato con cédula ${cedula} no encontrado`);
    }
    return candidato;
  }

  @Get(':id/historial')
  @Roles('ADMIN', 'EVALUADOR')
  async historial(@Param('id', ParseIntPipe) id: number): Promise<any> {
    const candidato = await this.candidatosService.historial(id);
    if (!candidato) {
      throw new NotFoundException(`Candidato con ID ${id} no encontrado`);
    }
    return candidato;
  }
}
