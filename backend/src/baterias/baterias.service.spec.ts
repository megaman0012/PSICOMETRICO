import { Test, TestingModule } from '@nestjs/testing';
import { BateriasService } from './baterias.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  bateria: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('BateriasService', () => {
  let service: BateriasService;
  let prismaService: PrismaService;

  const dto = {
    nombre: 'Básica',
    descripcion: 'Batería inicial',
    activa: true,
    pruebaIds: [1, 2],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BateriasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<BateriasService>(BateriasService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('should return baterias ordered by nombre with pruebas and empresa', async () => {
      const baterias = [{ id: 1, nombre: 'Básica' }];
      (prismaService.bateria.findMany as jest.Mock).mockResolvedValue(baterias);

      const result = await service.listar();

      expect(prismaService.bateria.findMany).toHaveBeenCalledWith({
        include: {
          empresa: true,
          pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } },
          _count: { select: { invitaciones: true } },
        },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toEqual(baterias);
    });
  });

  describe('listarActivas', () => {
    it('should return only active baterias', async () => {
      const baterias = [{ id: 1, nombre: 'Básica', activa: true }];
      (prismaService.bateria.findMany as jest.Mock).mockResolvedValue(baterias);

      const result = await service.listarActivas();

      expect(prismaService.bateria.findMany).toHaveBeenCalledWith({
        where: { activa: true },
        include: {
          empresa: true,
          pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } },
          _count: { select: { invitaciones: true } },
        },
        orderBy: { nombre: 'asc' },
      });
      expect(result).toEqual(baterias);
    });
  });

  describe('crear', () => {
    it('should create a bateria with its pruebas', async () => {
      const creada = { id: 1, nombre: 'Básica' };
      (prismaService.bateria.create as jest.Mock).mockResolvedValue(creada);

      const result = await service.crear(dto);

      expect(prismaService.bateria.create).toHaveBeenCalledWith({
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          activa: dto.activa,
          pruebas: {
            create: [
              { pruebaId: 1, orden: 0 },
              { pruebaId: 2, orden: 1 },
            ],
          },
        },
        include: {
          empresa: true,
          pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } },
          _count: { select: { invitaciones: true } },
        },
      });
      expect(result).toEqual(creada);
    });

    it('should create a bateria without pruebas when pruebaIds is undefined', async () => {
      const creada = { id: 2, nombre: 'Vacía' };
      (prismaService.bateria.create as jest.Mock).mockResolvedValue(creada);

      await service.crear({ nombre: 'Vacía' });

      expect(prismaService.bateria.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Vacía',
          descripcion: undefined,
          activa: undefined,
          pruebas: undefined,
        },
        include: {
          empresa: true,
          pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } },
          _count: { select: { invitaciones: true } },
        },
      });
    });
  });

  describe('actualizar', () => {
    it('should throw NotFoundException when bateria does not exist', async () => {
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.actualizar(99, dto)).rejects.toThrow(NotFoundException);
    });

    it('should replace pruebas when actualizando', async () => {
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      const actualizada = { id: 1, nombre: 'Básica' };
      (prismaService.bateria.update as jest.Mock).mockResolvedValue(actualizada);

      const result = await service.actualizar(1, dto);

      expect(prismaService.bateria.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          activa: dto.activa,
          pruebas: {
            deleteMany: {},
            create: [
              { pruebaId: 1, orden: 0 },
              { pruebaId: 2, orden: 1 },
            ],
          },
        },
        include: {
          empresa: true,
          pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } },
          _count: { select: { invitaciones: true } },
        },
      });
      expect(result).toEqual(actualizada);
    });
  });

  describe('eliminar', () => {
    it('should throw NotFoundException when bateria does not exist', async () => {
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.eliminar(99)).rejects.toThrow(NotFoundException);
    });

    it('should delete the bateria and return confirmation', async () => {
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prismaService.bateria.delete as jest.Mock).mockResolvedValue({ id: 1 });

      const result = await service.eliminar(1);

      expect(prismaService.bateria.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({ eliminada: true });
    });
  });
});
