import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import PDFDocument from 'pdfkit';

function escaparCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function formatearFecha(fecha: Date | string | null | undefined): string {
  if (!fecha) return '';
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async resumenGeneral() {
    const [totalCandidatos, totalAplicaciones, completadas, resultadosGlobales] =
      await Promise.all([
        this.prisma.candidato.count(),
        this.prisma.aplicacion.count(),
        this.prisma.aplicacion.count({ where: { completada: true } }),
        this.prisma.resultadoGlobal.findMany(),
      ]);

    const porClasificacion: Record<string, number> = {};
    let sumaPuntuacion = 0;
    for (const r of resultadosGlobales) {
      const clave = r.clasificacion || 'Sin clasificar';
      porClasificacion[clave] = (porClasificacion[clave] || 0) + 1;
      sumaPuntuacion += Number(r.puntuacion);
    }

    return {
      totalCandidatos,
      totalAplicaciones,
      completadas,
      pendientes: totalAplicaciones - completadas,
      promedioGlobal:
        resultadosGlobales.length > 0
          ? Math.round((sumaPuntuacion / resultadosGlobales.length) * 100) / 100
          : 0,
      porClasificacion,
    };
  }

  async exportarAplicacionesCsv(): Promise<string> {
    const aplicaciones = await this.prisma.aplicacion.findMany({
      include: {
        candidato: true,
        prueba: true,
        resultadosGlobales: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });

    const encabezado = [
      'ID',
      'Candidato',
      'Cedula',
      'Prueba',
      'FechaInicio',
      'FechaFin',
      'Completada',
      'Intento',
      'PuntuacionGlobal',
      'Clasificacion',
    ];

    const filas = aplicaciones.map((a) => {
      const global = a.resultadosGlobales[0];
      return [
        a.id,
        `${a.candidato.nombre} ${a.candidato.apellido}`,
        a.candidato.cedula,
        a.prueba.nombre,
        a.fechaInicio.toISOString(),
        a.fechaFin ? a.fechaFin.toISOString() : '',
        a.completada ? 'SI' : 'NO',
        a.numeroIntento,
        global ? Number(global.puntuacion).toFixed(2) : '',
        global?.clasificacion || '',
      ];
    });

    return [encabezado, ...filas].map((f) => f.map(escaparCsv).join(',')).join('\n');
  }

  async exportarHistorialCandidatoCsv(candidatoId: number): Promise<string> {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        aplicaciones: {
          include: {
            prueba: true,
            resultadosGlobales: true,
            resultadosDimension: {
              include: { dimension: true },
            },
          },
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });

    if (!candidato) {
      throw new NotFoundException(`Candidato con ID ${candidatoId} no encontrado`);
    }

    const lineas: string[][] = [];
    lineas.push(['Historial del candidato']);
    lineas.push(['Nombre', `${candidato.nombre} ${candidato.apellido}`]);
    lineas.push(['Cedula', candidato.cedula]);
    lineas.push(['Email', candidato.email]);
    lineas.push([]);
    lineas.push([
      'FechaInicio',
      'FechaFin',
      'Prueba',
      'Intento',
      'Completada',
      'PuntuacionGlobal',
      'ClasificacionGlobal',
    ]);

    for (const a of candidato.aplicaciones) {
      const global = a.resultadosGlobales[0];
      lineas.push([
        a.fechaInicio.toISOString(),
        a.fechaFin ? a.fechaFin.toISOString() : '',
        a.prueba.nombre,
        String(a.numeroIntento),
        a.completada ? 'SI' : 'NO',
        global ? Number(global.puntuacion).toFixed(2) : '',
        global?.clasificacion || '',
      ]);
    }

    lineas.push([]);
    lineas.push(['Prueba', 'Intento', 'Dimension', 'Puntuacion', 'Porcentaje', 'Clasificacion']);
    for (const a of candidato.aplicaciones) {
      for (const r of a.resultadosDimension) {
        lineas.push([
          a.prueba.nombre,
          String(a.numeroIntento),
          r.dimension.nombre,
          Number(r.puntuacion).toFixed(2),
          `${Number(r.porcentaje).toFixed(1)} %`,
          r.clasificacion || '',
        ]);
      }
    }

    return lineas.map((f) => f.map(escaparCsv).join(',')).join('\n');
  }

  async exportarAplicacionCsv(aplicacionId: number): Promise<string> {
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
      include: {
        candidato: true,
        prueba: true,
        resultadosDimension: {
          include: { dimension: true },
          orderBy: { dimension: { orden: 'asc' } },
        },
        resultadosGlobales: true,
      },
    });

    if (!aplicacion) {
      throw new NotFoundException(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    const lineas: string[][] = [];

    lineas.push(['Reporte Psicométrico']);
    lineas.push(['Candidato', `${aplicacion.candidato.nombre} ${aplicacion.candidato.apellido}`]);
    lineas.push(['Cedula', aplicacion.candidato.cedula]);
    lineas.push(['Prueba', aplicacion.prueba.nombre]);
    lineas.push(['Fecha', aplicacion.fechaInicio.toISOString()]);
    lineas.push(['Intento', String(aplicacion.numeroIntento)]);
    lineas.push([]);
    lineas.push(['Dimensión', 'Puntuación', 'Porcentaje', 'Clasificación', 'Interpretación']);

    for (const r of aplicacion.resultadosDimension) {
      lineas.push([
        r.dimension.nombre,
        Number(r.puntuacion).toFixed(2),
        `${Number(r.porcentaje).toFixed(2)} %`,
        r.clasificacion || '',
        r.interpretacion || '',
      ]);
    }

    const global = aplicacion.resultadosGlobales[0];
    if (global) {
      lineas.push([]);
      lineas.push([
        'GLOBAL',
        Number(global.puntuacion).toFixed(2),
        '',
        global.clasificacion || '',
        global.interpretacion || '',
      ]);
    }

    return lineas.map((f) => f.map(escaparCsv).join(',')).join('\n');
  }

  private async obtenerAplicacionCompleta(aplicacionId: number) {    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
      include: {
        candidato: true,
        prueba: true,
        resultadosDimension: {
          include: { dimension: true },
          orderBy: { dimension: { orden: 'asc' } },
        },
        resultadosGlobales: true,
      },
    });
    if (!aplicacion) {
      throw new NotFoundException(`Aplicación con ID ${aplicacionId} no encontrada`);
    }
    return aplicacion;
  }

  async exportarAplicacionPdf(aplicacionId: number): Promise<Buffer> {
    const aplicacion = await this.obtenerAplicacionCompleta(aplicacionId);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const terminado = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const nombre = `${aplicacion.candidato.nombre} ${aplicacion.candidato.apellido}`;

    // Encabezado
    doc.fontSize(20).fillColor('#1e3a8a').text('INFORME PSICOMÉTRICO', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#6b7280').text(`Generado el ${new Date().toLocaleString('es-ES')}`, { align: 'center' });
    doc.moveDown(1.2);
    doc.fillColor('#000000');

    // Datos del candidato
    doc.fontSize(12);
    doc.text(`Candidato: ${nombre}`);
    doc.text(`Cédula: ${aplicacion.candidato.cedula}`);
    doc.text(`Cargo postulado: ${aplicacion.candidato.cargoPostulado || '—'}`);
    doc.text(`Prueba: ${aplicacion.prueba.nombre}`);
    doc.text(`Fecha de inicio: ${formatearFecha(aplicacion.fechaInicio)}`);
    doc.text(`Fecha de finalización: ${formatearFecha(aplicacion.fechaFin)}`);
    doc.text(`Intento: ${aplicacion.numeroIntento}`);
    doc.moveDown(0.8);

    // Resultado global
    const global = aplicacion.resultadosGlobales[0];
    if (global) {
      doc.fontSize(13).fillColor('#1e3a8a').text('Resultado global');
      doc.fillColor('#000000');
      doc.moveDown(0.3);
      doc.fontSize(11).text(`Puntuación: ${Number(global.puntuacion).toFixed(1)} / 100`);
      doc.text(`Clasificación: ${global.clasificacion || 'Sin clasificar'}`);
      if (global.interpretacion) {
        doc.moveDown(0.3);
        doc.text(`Interpretación: ${global.interpretacion}`);
      }
      doc.moveDown(0.8);
    }

    // Resultados por dimensión (tabla simple)
    doc.fontSize(13).fillColor('#1e3a8a').text('Resultados por dimensión');
    doc.fillColor('#000000');
    doc.moveDown(0.3);

    const margen = 50;
    const ancho = doc.page.width - margen * 2;
    const col1 = ancho * 0.3;
    const col2 = ancho * 0.2;
    const col3 = ancho * 0.2;
    const col4 = ancho * 0.3;

    const filaTabla = (
      c1: string,
      c2: string,
      c3: string,
      c4: string,
      fondo = '#ffffff',
      negrita = false,
    ) => {
      const alto = 24;
      const y = doc.y;
      doc.rect(margen, y, ancho, alto).fill(fondo).stroke('#d1d5db');
      doc.fillColor('#111827');
      const fuente = negrita ? 'Helvetica-Bold' : 'Helvetica';
      doc.font(fuente).fontSize(9);
      doc.text(c1, margen + 4, y + 7, { width: col1 - 8 });
      doc.text(c2, margen + col1 + 4, y + 7, { width: col2 - 8 });
      doc.text(c3, margen + col1 + col2 + 4, y + 7, { width: col3 - 8 });
      doc.text(c4, margen + col1 + col2 + col3 + 4, y + 7, { width: col4 - 8 });
      doc.y = y + alto;
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
      }
    };

    filaTabla('Dimensión', 'Puntuación', 'Porcentaje', 'Clasificación', '#e5e7eb', true);
    aplicacion.resultadosDimension.forEach((r, i) => {
      filaTabla(
        r.dimension.nombre,
        Number(r.puntuacion).toFixed(2),
        `${Number(r.porcentaje).toFixed(1)}%`,
        r.clasificacion || '—',
        i % 2 === 0 ? '#ffffff' : '#f9fafb',
      );
    });
    doc.moveDown(1);

    // Recomendación
    doc.fontSize(13).fillColor('#1e3a8a').text('Recomendación');
    doc.fillColor('#000000');
    doc.moveDown(0.3);
    doc.fontSize(10);
    doc.text(
      'Este informe es una herramienta de apoyo para la toma de decisiones. ' +
        'Se recomienda complementar la evaluación psicométrica con una entrevista estructurada ' +
        'y la verificación de referencias antes de la decisión final de contratación.',
    );

    doc.end();
    return terminado;
  }
}
