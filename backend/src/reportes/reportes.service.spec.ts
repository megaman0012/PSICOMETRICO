import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  candidato: {
    count: jest.fn(),
    findUnique: jest.fn(),
  },
  aplicacion: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  resultadoGlobal: {
    findMany: jest.fn(),
  },
};

const aplicacionBase = {
  id: 1,
  candidatoId: 1,
  pruebaId: 1,
  numeroIntento: 1,
  completada: true,
  fechaInicio: new Date('2026-08-12T10:00:00Z'),
  fechaFin: new Date('2026-08-12T11:00:00Z'),
  candidato: {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: 'V-12345678',
    cargoPostulado: 'Guardia',
  },
  prueba: { id: 1, nombre: 'Big Five' },
  resultadosGlobales: [
    {
      id: 1,
      puntuacion: 85.5,
      clasificacion: 'Alta',
      interpretacion: 'Cumple el perfil',
    },
  ],
  resultadosDimension: [
    {
      id: 1,
      dimension: { id: 1, nombre: 'Apertura' },
      puntuacion: 4.2,
      porcentaje: 84,
      clasificacion: 'Alta',
      interpretacion: 'Nivel adecuado',
    },
  ],
};

describe('ReportesService', () => {
  let service: ReportesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('resumenGeneral', () => {
    it('debe calcular totales y distribución por clasificación', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(10);
      (prisma.aplicacion.count as jest.Mock)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(4);
      (prisma.resultadoGlobal.findMany as jest.Mock).mockResolvedValue([
        { puntuacion: 80, clasificacion: 'Alta' },
        { puntuacion: 60, clasificacion: 'Media' },
        { puntuacion: 80, clasificacion: 'Alta' },
      ]);

      const resumen = await service.resumenGeneral();

      expect(resumen).toEqual({
        totalCandidatos: 10,
        totalAplicaciones: 6,
        completadas: 4,
        pendientes: 2,
        promedioGlobal: 73.33,
        porClasificacion: { Alta: 2, Media: 1 },
      });
    });

    it('debe manejar una base de datos vacía', async () => {
      (prisma.candidato.count as jest.Mock).mockResolvedValue(0);
      (prisma.aplicacion.count as jest.Mock).mockResolvedValue(0);
      (prisma.resultadoGlobal.findMany as jest.Mock).mockResolvedValue([]);

      const resumen = await service.resumenGeneral();

      expect(resumen).toEqual({
        totalCandidatos: 0,
        totalAplicaciones: 0,
        completadas: 0,
        pendientes: 0,
        promedioGlobal: 0,
        porClasificacion: {},
      });
    });
  });

  describe('exportarAplicacionesCsv', () => {
    it('debe generar un CSV con encabezado y filas', async () => {
      (prisma.aplicacion.findMany as jest.Mock).mockResolvedValue([aplicacionBase]);

      const csv = await service.exportarAplicacionesCsv();

      expect(csv).toContain('ID,Candidato,Cedula,Prueba');
      expect(csv).toContain('Juan Pérez');
      expect(csv).toContain('85.50');
      expect(csv).toContain('Alta');
    });
  });

  describe('exportarAplicacionCsv', () => {
    it('debe lanzar NotFoundException si la aplicación no existe', async () => {
      (prisma.aplicacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.exportarAplicacionCsv(999)).rejects.toThrow(NotFoundException);
    });

    it('debe generar un CSV con el detalle de la aplicación', async () => {
      (prisma.aplicacion.findUnique as jest.Mock).mockResolvedValue(aplicacionBase);

      const csv = await service.exportarAplicacionCsv(1);

      expect(csv).toContain('Reporte Psicométrico');
      expect(csv).toContain('Dimensión,Puntuación,Porcentaje,Clasificación,Interpretación');
      expect(csv).toContain('Apertura');
      expect(csv).toContain('GLOBAL');
    });
  });

  describe('exportarHistorialCandidatoCsv', () => {
    it('debe lanzar NotFoundException si el candidato no existe', async () => {
      (prisma.candidato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.exportarHistorialCandidatoCsv(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe generar un CSV con el historial completo', async () => {
      (prisma.candidato.findUnique as jest.Mock).mockResolvedValue({
        ...aplicacionBase.candidato,
        email: 'juan@example.com',
        aplicaciones: [aplicacionBase],
      });

      const csv = await service.exportarHistorialCandidatoCsv(1);

      expect(csv).toContain('Historial del candidato');
      expect(csv).toContain('Juan Pérez');
      expect(csv).toContain('PuntuacionGlobal,ClasificacionGlobal');
      expect(csv).toContain('85.50');
    });
  });

  describe('exportarAplicacionPdf', () => {
    it('debe lanzar NotFoundException si la aplicación no existe', async () => {
      (prisma.aplicacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.exportarAplicacionPdf(999)).rejects.toThrow(NotFoundException);
    });

    it('debe generar un buffer PDF válido', async () => {
      (prisma.aplicacion.findUnique as jest.Mock).mockResolvedValue(aplicacionBase);

      const pdf = await service.exportarAplicacionPdf(1);

      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.length).toBeGreaterThan(500);
      expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    });
  });
});
