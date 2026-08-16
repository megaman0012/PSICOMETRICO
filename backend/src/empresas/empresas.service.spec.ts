import { Test, TestingModule } from '@nestjs/testing';
import { EmpresasService } from './empresas.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  empresa: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('EmpresasService', () => {
  let service: EmpresasService;
  let prismaService: PrismaService;

  const dto = {
    nombre: 'Omega Seguridad',
    activa: true,
    certificadoTitulo: 'Cert-001',
    ruc: '123456',
    direccion: 'Av. Principal 123',
    telefono: '0999999999',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmpresasService>(EmpresasService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listar', () => {
    it('should return empresas ordered by nombre with candidatos count', async () => {
      const empresas = [{ id: 1, nombre: 'Omega', _count: { candidatos: 3 } }];
      (prismaService.empresa.findMany as jest.Mock).mockResolvedValue(empresas);

      const result = await service.listar();

      expect(prismaService.empresa.findMany).toHaveBeenCalledWith({
        orderBy: { nombre: 'asc' },
        include: { _count: { select: { candidatos: true } } },
      });
      expect(result).toEqual(empresas);
    });
  });

  describe('crear', () => {
    it('should create an empresa', async () => {
      const creada = { id: 1, ...dto };
      (prismaService.empresa.create as jest.Mock).mockResolvedValue(creada);

      const result = await service.crear(dto);

      expect(prismaService.empresa.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(creada);
    });
  });

  describe('actualizar', () => {
    it('should update an empresa', async () => {
      const actualizada = { id: 1, ...dto, nombre: 'Omega 2' };
      (prismaService.empresa.update as jest.Mock).mockResolvedValue(actualizada);

      const result = await service.actualizar(1, { ...dto, nombre: 'Omega 2' });

      expect(prismaService.empresa.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { ...dto, nombre: 'Omega 2' },
      });
      expect(result).toEqual(actualizada);
    });
  });
});
