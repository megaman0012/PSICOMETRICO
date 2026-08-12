import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PruebasService } from './pruebas.service';
import { PrismaService } from '../prisma/prisma.service';

const ejecutarTransaccion = async (cb: (tx: any) => Promise<any>) => cb(mockTx);

const mockTx = {
  prueba: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  umbralClasificacion: { create: jest.fn(), deleteMany: jest.fn() },
  dimension: { create: jest.fn(), deleteMany: jest.fn() },
  pregunta: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
  opcionRespuesta: { create: jest.fn(), deleteMany: jest.fn() },
  respuesta: { deleteMany: jest.fn() },
  resultadoDimension: { deleteMany: jest.fn() },
  resultadoGlobal: { deleteMany: jest.fn() },
};

const mockPrismaService = {
  prueba: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((arg) => {
    if (typeof arg === 'function') return ejecutarTransaccion(arg);
    return Promise.resolve(arg);
  }),
};

const dtoValido = {
  nombre: 'Nueva Prueba',
  descripcion: 'Descripción',
  version: '1.0',
  activa: true,
  dimensiones: [
    {
      nombre: 'Dimensión 1',
      tipoAgregacion: 'SUMA' as const,
      preguntas: [
        {
          enunciado: '¿Pregunta 1?',
          tipo: 'LIKERT',
          opciones: [
            { texto: '1', valor: 1 },
            { texto: '2', valor: 2 },
          ],
        },
      ],
      umbrales: [
        {
          nombre: 'Alta',
          puntuacionMinima: 80,
          puntuacionMaxima: 100,
          interpretacion: 'Bien',
        },
      ],
    },
  ],
  umbrales: [
    {
      nombre: 'Global',
      puntuacionMinima: 80,
      puntuacionMaxima: 100,
      interpretacion: 'Muy bien',
    },
  ],
};

describe('PruebasService', () => {
  let service: PruebasService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PruebasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PruebasService>(PruebasService);
    prismaService = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('encontrarTodas', () => {
    it('should return all active pruebas', async () => {
      const pruebas = [{ id: 1, nombre: 'Big Five' }, { id: 2, nombre: 'Integridad' }];
      (prismaService.prueba.findMany as jest.Mock).mockResolvedValue(pruebas);

      const result = await service.encontrarTodas();

      expect(prismaService.prueba.findMany).toHaveBeenCalledWith({
        where: { activa: true },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toEqual(pruebas);
    });
  });

  describe('encontrarPorId', () => {
    it('should return a prueba with its full structure', async () => {
      const prueba = { id: 1, nombre: 'Big Five', dimensiones: [] };
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue(prueba);

      const result = await service.encontrarPorId(1);

      expect(prismaService.prueba.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
      expect(result).toEqual(prueba);
    });

    it('should return null when the prueba does not exist', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.encontrarPorId(999);

      expect(result).toBeNull();
    });
  });

  describe('crear', () => {
    it('should create a prueba with its structure inside a transaction', async () => {
      mockTx.prueba.findUnique.mockResolvedValueOnce(null);
      mockTx.prueba.create.mockResolvedValue({ id: 10, nombre: 'Nueva Prueba' });
      mockTx.dimension.create.mockResolvedValue({ id: 100 });
      mockTx.pregunta.create.mockResolvedValue({ id: 1000 });
      mockTx.prueba.findUnique.mockResolvedValue({ id: 10, nombre: 'Nueva Prueba' });

      const result = await service.crear(dtoValido);

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.dimension.create).toHaveBeenCalled();
      expect(mockTx.pregunta.create).toHaveBeenCalled();
      expect(mockTx.opcionRespuesta.create).toHaveBeenCalledTimes(2);
      expect(mockTx.umbralClasificacion.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: 10, nombre: 'Nueva Prueba' });
    });

    it('should throw ConflictException if the name already exists', async () => {
      mockTx.prueba.findUnique.mockResolvedValue({ id: 1, nombre: 'Nueva Prueba' });

      await expect(service.crear(dtoValido)).rejects.toThrow(ConflictException);
    });
  });

  describe('actualizar', () => {
    it('should rebuild the structure when updating', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({ id: 1, nombre: 'Vieja' });
      mockTx.prueba.findFirst.mockResolvedValue(null);
      mockTx.prueba.update.mockResolvedValue({ id: 1, nombre: 'Actualizada' });
      mockTx.prueba.findUnique.mockResolvedValue({ id: 1, nombre: 'Actualizada' });
      mockTx.pregunta.findMany.mockResolvedValue([{ id: 5 }]);
      mockTx.dimension.create.mockResolvedValue({ id: 200 });
      mockTx.pregunta.create.mockResolvedValue({ id: 2000 });
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({ id: 1, nombre: 'Actualizada' });

      const result = await service.actualizar(1, dtoValido);

      expect(mockTx.respuesta.deleteMany).toHaveBeenCalled();
      expect(mockTx.opcionRespuesta.deleteMany).toHaveBeenCalled();
      expect(mockTx.pregunta.deleteMany).toHaveBeenCalled();
      expect(mockTx.dimension.deleteMany).toHaveBeenCalled();
      expect(mockTx.umbralClasificacion.deleteMany).toHaveBeenCalled();
      expect(result).toEqual({ id: 1, nombre: 'Actualizada' });
    });

    it('should throw NotFoundException if the prueba does not exist', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.actualizar(999, dtoValido)).rejects.toThrow(NotFoundException);
    });
  });

  describe('eliminar', () => {
    it('should delete the prueba when it has no aplicaciones', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        nombre: 'Eliminar',
        _count: { aplicaciones: 0 },
      });

      const result = await service.eliminar(1);

      expect(mockTx.prueba.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result.mensaje).toContain('eliminada');
    });

    it('should throw BadRequestException when the prueba has aplicaciones', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        nombre: 'Con apps',
        _count: { aplicaciones: 3 },
      });

      await expect(service.eliminar(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cambiarEstado', () => {
    it('should toggle the activa flag without touching the structure', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        nombre: 'Big Five',
        activa: true,
      });
      (prismaService.prueba.update as jest.Mock).mockResolvedValue({
        id: 1,
        nombre: 'Big Five',
        activa: false,
      });

      const result = await service.cambiarEstado(1, false);

      expect(prismaService.prueba.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activa: false },
      });
      expect(result.activa).toBe(false);
    });

    it('should throw NotFoundException when the prueba does not exist', async () => {
      (prismaService.prueba.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cambiarEstado(999, true)).rejects.toThrow(NotFoundException);
    });
  });
});
