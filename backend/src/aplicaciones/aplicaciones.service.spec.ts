import { Test, TestingModule } from '@nestjs/testing';
import { AplicacionesService } from './aplicaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalificacionService } from '../calificacion/calificacion.service';

const mockPrismaService = {
  prueba: { findUnique: jest.fn() },
  candidato: { findUnique: jest.fn() },
  usuario: { findUnique: jest.fn() },
  aplicacion: {
    aggregate: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  respuesta: { createMany: jest.fn() },
};

const mockCalificacionService = {
  finalizarAplicacion: jest.fn(),
};

describe('AplicacionesService', () => {
  let service: AplicacionesService;
  let prismaService: PrismaService;
  let calificacionService: CalificacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AplicacionesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CalificacionService, useValue: mockCalificacionService },
      ],
    }).compile();

    service = module.get<AplicacionesService>(AplicacionesService);
    prismaService = module.get<PrismaService>(PrismaService);
    calificacionService = module.get<CalificacionService>(CalificacionService);

    (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prismaService.usuario.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    (prismaService.aplicacion.aggregate as jest.Mock).mockResolvedValue({
      _max: { numeroIntento: 0 },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crear', () => {
    it('should create an application with intento 1 and the evaluador id', async () => {
      (prismaService.aplicacion.create as jest.Mock).mockResolvedValue({ id: 10 });

      const result = await service.crear({
        pruebaId: 1,
        candidatoId: 1,
        evaluadorId: 1,
      });

      expect(prismaService.aplicacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            pruebaId: 1,
            candidatoId: 1,
            usuarioId: 1,
            numeroIntento: 1,
          },
        }),
      );
      expect(result).toEqual({ id: 10 });
    });

    it('should increment numeroIntento when there are previous attempts', async () => {
      (prismaService.aplicacion.aggregate as jest.Mock).mockResolvedValue({
        _max: { numeroIntento: 2 },
      });

      await service.crear({ pruebaId: 1, candidatoId: 1, evaluadorId: 1 });

      expect(prismaService.aplicacion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ numeroIntento: 3 }),
        }),
      );
    });

    it('should throw when the prueba does not exist', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.crear({ pruebaId: 1, candidatoId: 1, evaluadorId: 1 }),
      ).rejects.toThrow('Prueba con ID 1 no encontrada');
    });

    it('should throw when the candidato does not exist', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.crear({ pruebaId: 1, candidatoId: 1, evaluadorId: 1 }),
      ).rejects.toThrow('Candidato con ID 1 no encontrado');
    });

    it('should throw when the evaluador does not exist', async () => {
      (prismaService.usuario.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.crear({ pruebaId: 1, candidatoId: 1, evaluadorId: 1 }),
      ).rejects.toThrow('Evaluador con ID 1 no encontrado');
    });
  });

  describe('encontrarTodas', () => {
    it('should return aplicaciones with related data ordered by fechaInicio desc', async () => {
      (prismaService.aplicacion.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

      const result = await service.encontrarTodas();

      expect(prismaService.aplicacion.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { fechaInicio: 'desc' },
      });
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('encontrarPorId', () => {
    it('should return the aplicacion or null', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await service.encontrarPorId(1);

      expect(prismaService.aplicacion.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('guardarRespuestas', () => {
    it('should save the responses for a pending aplicacion', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        completada: false,
      });

      await service.guardarRespuestas(1, {
        respuestas: [{ preguntaId: 2, opcionId: 3 }],
      });

      expect(prismaService.respuesta.createMany).toHaveBeenCalledWith({
        data: [{ aplicacionId: 1, preguntaId: 2, opcionRespuestaId: 3 }],
        skipDuplicates: true,
      });
    });

    it('should throw when the aplicacion does not exist', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.guardarRespuestas(99, { respuestas: [] }),
      ).rejects.toThrow('Aplicación con ID 99 no encontrada');
    });

    it('should throw when the aplicacion is already completed', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        completada: true,
      });

      await expect(
        service.guardarRespuestas(1, { respuestas: [] }),
      ).rejects.toThrow('La aplicación 1 ya está completada');
    });
  });

  describe('finalizar', () => {
    it('should delegate to the qualification engine', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        completada: false,
      });
      (calificacionService.finalizarAplicacion as jest.Mock).mockResolvedValue(undefined);

      await service.finalizar(1);

      expect(calificacionService.finalizarAplicacion).toHaveBeenCalledWith(1);
    });

    it('should throw when the aplicacion does not exist', async () => {
      (prismaService.aplicacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.finalizar(99)).rejects.toThrow(
        'Aplicación con ID 99 no encontrada',
      );
    });
  });
});
