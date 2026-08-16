import { Test, TestingModule } from '@nestjs/testing';
import { CandidatosService } from './candidatos.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  candidato: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  empresa: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('CandidatosService', () => {
  let service: CandidatosService;
  let prismaService: PrismaService;

  const dto = {
    nombre: 'Juan',
    apellido: 'Pérez',
    cedula: '12345678',
    email: 'juan@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatosService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CandidatosService>(CandidatosService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crear', () => {
    it('should create a candidato', async () => {
      const candidato = { id: 1, ...dto };
      (prismaService.candidato.create as jest.Mock).mockResolvedValue(candidato);

      const result = await service.crear(dto);

      expect(prismaService.candidato.create).toHaveBeenCalledWith({
        data: {
          nombre: dto.nombre,
          apellido: dto.apellido,
          cedula: dto.cedula,
          email: dto.email,
          telefono: undefined,
          cargoPostulado: undefined,
          fechaNacimiento: null,
          empresaId: undefined,
        },
      });
      expect(result).toEqual(candidato);
    });
  });

  describe('encontrarTodos', () => {
    it('should return candidatos with empresa and edad', async () => {
      const candidato = {
        id: 1,
        nombre: 'Juan',
        fechaNacimiento: new Date('1990-05-15'),
        empresa: { nombre: 'Omega' },
      };
      (prismaService.candidato.findMany as jest.Mock).mockResolvedValue([candidato]);

      const result = await service.encontrarTodos();

      expect(prismaService.candidato.findMany).toHaveBeenCalledWith({
        include: { empresa: true },
        orderBy: { nombre: 'asc' },
      });
      expect((result as any)[0].edad).toEqual(expect.any(Number));
    });
  });

  describe('buscarPorCedula', () => {
    it('should find a candidato by cedula', async () => {
      const candidato = { id: 1, cedula: '12345678' };
      (prismaService.candidato.findFirst as jest.Mock).mockResolvedValue(candidato);

      const result = await service.buscarPorCedula('12345678');

      expect(prismaService.candidato.findFirst).toHaveBeenCalledWith({
        where: { cedula: '12345678' },
        include: { empresa: true },
      });
      expect(result).toEqual({ ...candidato, edad: null });
    });

    it('should return null when not found', async () => {
      (prismaService.candidato.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.buscarPorCedula('000');

      expect(result).toBeNull();
    });
  });

  describe('historial', () => {
    it('should return the candidato with its aplicaciones and resultados', async () => {
      const historial = {
        id: 1,
        nombre: 'Juan',
        aplicaciones: [
          {
            id: 5,
            numeroIntento: 2,
            prueba: { nombre: 'Big Five' },
            resultadosGlobales: [{ clasificacion: 'Alta' }],
            resultadosDimension: [],
          },
        ],
      };
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(historial);

      const result = await service.historial(1);

      expect(prismaService.candidato.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          empresa: true,
          aplicaciones: {
            include: expect.any(Object),
            orderBy: { fechaInicio: 'desc' },
          },
        },
      });
      expect(result).toEqual({ ...historial, edad: null });
    });
  });

  describe('importarMasivo', () => {
    it('should reject unsupported formats', async () => {
      await expect(
        service.importarMasivo({ originalname: 'datos.txt', buffer: Buffer.from('') } as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject empty files', async () => {
      await expect(
        service.importarMasivo({ originalname: 'datos.csv', buffer: Buffer.from('') } as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
