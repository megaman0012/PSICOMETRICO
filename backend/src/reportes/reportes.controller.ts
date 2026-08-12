import { Controller, Get, Param, ParseIntPipe, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  @Roles('ADMIN', 'EVALUADOR')
  async resumen() {
    return this.reportesService.resumenGeneral();
  }

  @Get('aplicaciones/csv')
  @Roles('ADMIN', 'EVALUADOR')
  async exportarAplicaciones(@Res() res: Response) {
    const csv = await this.reportesService.exportarAplicacionesCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aplicaciones_${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    res.send(csv);
  }

  @Get('aplicaciones/:id/csv')
  @Roles('ADMIN', 'EVALUADOR')
  async exportarAplicacion(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const csv = await this.reportesService.exportarAplicacionCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aplicacion_${id}.csv"`,
    );
    res.send(csv);
  }

  @Get('aplicaciones/:id/pdf')
  @Roles('ADMIN', 'EVALUADOR')
  async exportarAplicacionPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const pdf = await this.reportesService.exportarAplicacionPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="informe_psicometrico_${id}.pdf"`,
    );
    res.setHeader('Content-Length', String(pdf.length));
    res.send(pdf);
  }

  @Get('candidatos/:id/historial-csv')
  @Roles('ADMIN', 'EVALUADOR')
  async exportarHistorialCandidato(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const csv = await this.reportesService.exportarHistorialCandidatoCsv(id);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="historial_candidato_${id}.csv"`,
    );
    res.send(csv);
  }
}
