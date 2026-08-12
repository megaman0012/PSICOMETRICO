import { Test, TestingModule } from '@nestjs/testing';
import { CalificacionService } from './calificacion.service';
import { PrismaService } from '../prisma/prisma.service';
import { TipoAgregacion } from '@prisma/client';

// Mock del servicio de Prisma
const mockPrismaService = {
  dimension: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  pregunta: {
    findMany: jest.fn(),
  },
  aplicacion: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  respuesta: {
    findMany: jest.fn(),
  },
  umbralClasificacion: {
    findMany: jest.fn(),
  },
  resultadoDimension: {
    create: jest.fn(),
  },
  resultadoGlobal: {
    create: jest.fn(),
  },
};

describe('CalificacionService', () => {
  let service: CalificacionService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalificacionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CalificacionService>(CalificacionService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Aplicación válida por defecto para los tests
    (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
      id: 1,
      pruebaId: 1,
      completada: false,
      candidato: { id: 1 },
      prueba: { id: 1 },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calcularPuntuacionDimension', () => {
    it('should calculate score correctly for SUMA aggregation', async () => {
      // Mock de dimensión con tipo SUMA
      (prismaService.dimension.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        tipoAgregacion: TipoAgregacion.SUMA,
        prueba: { id: 1 },
      });

      // Mock de preguntas de la dimensión
      (prismaService.pregunta.findMany as jest.Mock).mockResolvedValue([
        { id: 1, dimensionId: 1 },
        { id: 2, dimensionId: 1 },
        { id: 3, dimensionId: 1 },
      ]);

      // Mock de respuestas dadas por el candidato
      (prismaService.respuesta.findMany as jest.Mock).mockResolvedValue([
        {
          preguntaId: 1,
          opcionRespuesta: { valor: 2 },
        },
        {
          preguntaId: 2,
          opcionRespuesta: { valor: 3 },
        },
        {
          preguntaId: 3,
          opcionRespuesta: { valor: 1 },
        },
      ]);

      const result = await service.calcularPuntuacionDimension(1, 1);

      expect(result).toEqual({
        puntuacion: 6, // 2 + 3 + 1 = 6
        tipoAgregacion: TipoAgregacion.SUMA,
        totalPreguntas: 3,
        totalRespuestas: 3,
      });
    });

    it('should calculate score correctly for PROMEDIO aggregation', async () => {
      // Mock de dimensión con tipo PROMEDIO
      (prismaService.dimension.findUnique as jest.Mock).mockResolvedValue({
        id: 2,
        tipoAgregacion: TipoAgregacion.PROMEDIO,
        prueba: { id: 1 },
      });

      // Mock de preguntas de la dimensión
      (prismaService.pregunta.findMany as jest.Mock).mockResolvedValue([
        { id: 4, dimensionId: 2 },
        { id: 5, dimensionId: 2 },
      ]);

      // Mock de respuestas dadas por el candidato (valores en escala 1-5)
      (prismaService.respuesta.findMany as jest.Mock).mockResolvedValue([
        {
          preguntaId: 4,
          opcionRespuesta: { valor: 4 },
        },
        {
          preguntaId: 5,
          opcionRespuesta: { valor: 5 },
        },
      ]);

      const result = await service.calcularPuntuacionDimension(1, 2);

      expect(result).toEqual({
        puntuacion: 4.5, // (4 + 5) / 2 = 4.5
        tipoAgregacion: TipoAgregacion.PROMEDIO,
        totalPreguntas: 2,
        totalRespuestas: 2,
      });
    });

    it('should handle missing responses gracefully', async () => {
      // Mock de dimensión con tipo SUMA
      (prismaService.dimension.findUnique as jest.Mock).mockResolvedValue({
        id: 3,
        tipoAgregacion: TipoAgregacion.SUMA,
        prueba: { id: 1 },
      });

      // Mock de preguntas de la dimensión
      (prismaService.pregunta.findMany as jest.Mock).mockResolvedValue([
        { id: 6, dimensionId: 3 },
        { id: 7, dimensionId: 3 },
        { id: 8, dimensionId: 3 },
      ]);

      // Mock de respuestas parciales (solo algunas preguntas respondidas)
      (prismaService.respuesta.findMany as jest.Mock).mockResolvedValue([
        {
          preguntaId: 6,
          opcionRespuesta: { valor: 2 },
        },
        // Falta respuesta para pregunta 7
        {
          preguntaId: 8,
          opcionRespuesta: { valor: 3 },
        },
      ]);

      const result = await service.calcularPuntuacionDimension(1, 3);

      expect(result).toEqual({
        puntuacion: 5, // 2 + 0 + 3 = 5 (asumiendo 0 para respuestas faltantes)
        tipoAgregacion: TipoAgregacion.SUMA,
        totalPreguntas: 3,
        totalRespuestas: 2,
      });
    });
  });

  describe('obtenerClasificacion', () => {
    it('should return correct classification for global thresholds', async () => {
      // Mock de umbrales globales (sin dimensionId)
      (prismaService.umbralClasificacion.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          nombre: 'Alto',
          puntuacionMinima: 4.0,
          puntuacionMaxima: 5.0,
          interpretacion: 'Desempeño superior',
          pruebaId: 1,
          dimensionId: null,
        },
        {
          id: 2,
          nombre: 'Medio',
          puntuacionMinima: 2.5,
          puntuacionMaxima: 3.99,
          interpretacion: 'Desempeño medio',
          pruebaId: 1,
          dimensionId: null,
        },
        {
          id: 3,
          nombre: 'Bajo',
          puntuacionMinima: 0.0,
          puntuacionMaxima: 2.49,
          interpretacion: 'Desempeño inferior',
          pruebaId: 1,
          dimensionId: null,
        },
      ]);

      // Test para puntuación alta
      let result = await service.obtenerClasificacion(4.5, 1, null);
      expect(result).toEqual({
        nombre: 'Alto',
        descripcion: '',
        interpretacion: 'Desempeño superior',
      });

      // Test para puntuación media
      result = await service.obtenerClasificacion(3.0, 1, null);
      expect(result).toEqual({
        nombre: 'Medio',
        descripcion: '',
        interpretacion: 'Desempeño medio',
      });

      // Test para puntuación baja
      result = await service.obtenerClasificacion(1.5, 1, null);
      expect(result).toEqual({
        nombre: 'Bajo',
        descripcion: '',
        interpretacion: 'Desempeño inferior',
      });
    });

    it('should return correct classification for dimensional thresholds', async () => {
      // Mock de umbrales por dimensión
      (prismaService.umbralClasificacion.findMany as jest.Mock).mockResolvedValue([
        {
          id: 4,
          nombre: 'Alto',
          puntuacionMinima: 15,
          puntuacionMaxima: 20,
          interpretacion: 'Nivel alto en esta dimensión',
          pruebaId: 1,
          dimensionId: 1,
        },
        {
          id: 5,
          nombre: 'Medio',
          puntuacionMinima: 10,
          puntuacionMaxima: 14,
          interpretacion: 'Nivel medio en esta dimensión',
          pruebaId: 1,
          dimensionId: 1,
        },
        {
          id: 6,
          nombre: 'Bajo',
          puntuacionMinima: 0,
          puntuacionMaxima: 9,
          interpretacion: 'Nivel bajo en esta dimensión',
          pruebaId: 1,
          dimensionId: 1,
        },
      ]);

      // Test para puntuación alta en dimensión
      const result = await service.obtenerClasificacion(18, 1, 1);
      expect(result).toEqual({
        nombre: 'Alto',
        descripcion: '',
        interpretacion: 'Nivel alto en esta dimensión',
      });
    });

    it('should handle case when no thresholds are defined', async () => {
      // Mock de ningún umbral definido
      (prismaService.umbralClasificacion.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.obtenerClasificacion(3.0, 1, null);
      expect(result).toEqual({
        nombre: 'Sin clasificar',
        descripcion: 'No se han definido umbrales de clasificación',
        interpretacion: 'No se puede determinar el nivel de desempeño',
      });
    });
  });

  describe('finalizarAplicacion', () => {
    it('should complete the full qualification process', async () => {
      // Mock de aplicación
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        pruebaId: 1,
        completada: false,
      });

      // Mock de dimensiones de la prueba
      (prismaService.dimension.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          pruebaId: 1,
          tipoAgregacion: TipoAgregacion.SUMA,
          preguntas: [
            { id: 1, opciones: [{ valor: 2 }, { valor: 1 }, { valor: 0 }] },
            { id: 2, opciones: [{ valor: 2 }, { valor: 1 }, { valor: 0 }] },
          ],
        },
        {
          id: 2,
          pruebaId: 1,
          tipoAgregacion: TipoAgregacion.PROMEDIO,
          preguntas: [
            { id: 3, opciones: [{ valor: 1 }, { valor: 2 }, { valor: 3 }, { valor: 4 }, { valor: 5 }] },
            { id: 4, opciones: [{ valor: 1 }, { valor: 2 }, { valor: 3 }, { valor: 4 }, { valor: 5 }] },
          ],
        },
      ]);

      // Mock de consulta de dimensión (usada por calcularYGuardarResultadoDimension)
      (prismaService.dimension.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        pruebaId: 1,
      });

      // Mock de preguntas de la prueba (usada por calcularYGuardarResultadoGlobal)
      (prismaService.pregunta.findMany as jest.Mock).mockResolvedValue([
        { id: 1, dimensionId: 1 },
        { id: 2, dimensionId: 1 },
      ]);

      // Mock de cálculos de puntuación para cada dimensión.
      // Se llaman 4 veces: una por dimensión al guardar cada resultado y
      // dos más al recalcular dentro del resultado global.
      jest.spyOn(service, 'calcularPuntuacionDimension')
        .mockResolvedValueOnce({ puntuacion: 3, tipoAgregacion: TipoAgregacion.SUMA, totalPreguntas: 2, totalRespuestas: 2 }) // Dimensión 1: SUMA (máx 4)
        .mockResolvedValueOnce({ puntuacion: 3.5, tipoAgregacion: TipoAgregacion.PROMEDIO, totalPreguntas: 2, totalRespuestas: 2 }) // Dimensión 2: PROMEDIO (máx 5)
        .mockResolvedValueOnce({ puntuacion: 3, tipoAgregacion: TipoAgregacion.SUMA, totalPreguntas: 2, totalRespuestas: 2 }) // Dimensión 1 (global)
        .mockResolvedValueOnce({ puntuacion: 3.5, tipoAgregacion: TipoAgregacion.PROMEDIO, totalPreguntas: 2, totalRespuestas: 2 }); // Dimensión 2 (global)

      // Mock de obtención de clasificaciones
      (prismaService.umbralClasificacion.findMany as jest.Mock)
        // Primera llamada: para dimensión 1 (SUMA)
        .mockResolvedValueOnce([
          { nombre: 'Alto', puntuacionMinima: 8, puntuacionMaxima: 15, interpretacion: 'Alto desempeño', pruebaId: 1, dimensionId: 1 },
          { nombre: 'Medio', puntuacionMinima: 4, puntuacionMaxima: 7, interpretacion: 'Medio desempeño', pruebaId: 1, dimensionId: 1 },
          { nombre: 'Bajo', puntuacionMinima: 0, puntuacionMaxima: 3, interpretacion: 'Bajo desempeño', pruebaId: 1, dimensionId: 1 },
        ])
        // Segunda llamada: para dimensión 2 (PROMEDIO)
        .mockResolvedValueOnce([
          { nombre: 'Alto', puntuacionMinima: 3.0, puntuacionMaxima: 5.0, interpretacion: 'Alto desempeño', pruebaId: 1, dimensionId: 2 },
          { nombre: 'Medio', puntuacionMinima: 2.0, puntuacionMaxima: 2.99, interpretacion: 'Medio desempeño', pruebaId: 1, dimensionId: 2 },
          { nombre: 'Bajo', puntuacionMinima: 0.0, puntuacionMaxima: 1.99, interpretacion: 'Bajo desempeño', pruebaId: 1, dimensionId: 2 },
        ])
        // Tercera llamada: para resultado global (sin dimensionId)
        .mockResolvedValueOnce([
          { nombre: 'Excelente', puntuacionMinima: 80.0, puntuacionMaxima: 100.0, interpretacion: 'Desempeño excelente', pruebaId: 1, dimensionId: null },
          { nombre: 'Bueno', puntuacionMinima: 50.0, puntuacionMaxima: 79.99, interpretacion: 'Desempeño bueno', pruebaId: 1, dimensionId: null },
          { nombre: 'Necesita mejorar', puntuacionMinima: 0.0, puntuacionMaxima: 49.99, interpretacion: 'Desempeño que necesita mejorar', pruebaId: 1, dimensionId: null },
        ]);

      // Mock de creación de resultados
      (prismaService.resultadoDimension.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prismaService.resultadoGlobal.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prismaService.aplicacion.update as jest.Mock).mockResolvedValue({ id: 1, completada: true, fechaFin: new Date() });

      // Ejecutar la función principal
      await service.finalizarAplicacion(1);

      // Verificar que se llamaron las funciones esperadas
      expect(prismaService.aplicacion.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(prismaService.dimension.findMany).toHaveBeenCalledWith({
        where: { pruebaId: 1 },
        include: {
          preguntas: {
            include: {
              opciones: { select: { valor: true } },
            },
          },
        },
      });
      expect(service.calcularPuntuacionDimension).toHaveBeenCalledTimes(4);
      expect(prismaService.resultadoDimension.create).toHaveBeenCalledTimes(2);
      expect(prismaService.resultadoGlobal.create).toHaveBeenCalledTimes(1);
      expect(prismaService.aplicacion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { completada: true, fechaFin: expect.any(Date) },
      });
    });

    it('should throw error if application not found', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.finalizarAplicacion(999)).rejects.toThrow(
        `Aplicación con ID 999 no encontrada`,
      );
    });

    it('should throw error if application already completed', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        completada: true,
      });

      await expect(service.finalizarAplicacion(1)).rejects.toThrow(
        `La aplicación 1 ya está completada`,
      );
    });
  });
});