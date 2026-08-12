import { Test, TestingModule } from '@nestjs/testing';
import { CandidatosService } from './candidatos.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  candidato: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
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

      expect(prismaService.candidato.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(candidato);
    });
  });

  describe('encontrarTodos', () => {
    it('should return candidatos ordered by nombre', async () => {
      const candidatos = [{ id: 1, nombre: 'Juan' }];
      (prismaService.candidato.findMany as jest.Mock).mockResolvedValue(candidatos);

      const result = await service.encontrarTodos();

      expect(prismaService.candidato.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: 'asc' },
      });
      expect(result).toEqual(candidatos);
    });
  });

  describe('buscarPorCedula', () => {
    it('should find a candidato by cedula', async () => {
      const candidato = { id: 1, cedula: '12345678' };
      (prismaService.candidato.findFirst as jest.Mock).mockResolvedValue(candidato);

      const result = await service.buscarPorCedula('12345678');

      expect(prismaService.candidato.findFirst).toHaveBeenCalledWith({
        where: { cedula: '12345678' },
      });
      expect(result).toEqual(candidato);
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
          aplicaciones: {
            include: expect.any(Object),
            orderBy: { fechaInicio: 'desc' },
          },
        },
      });
      expect(result).toEqual(historial);
    });
  });
});
