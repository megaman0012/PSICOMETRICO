import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvitacionesService, MAX_INTENTOS } from './invitaciones.service';
import { PrismaService } from '../prisma/prisma.service';
import { CalificacionService } from '../calificacion/calificacion.service';
import { MailService } from '../mail/mail.service';

const mockPrismaService = {
  bateria: { findUnique: jest.fn() },
  candidato: { findUnique: jest.fn() },
  invitacion: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  resultadoDimension: { deleteMany: jest.fn() },
  resultadoGlobal: { deleteMany: jest.fn() },
  respuesta: { deleteMany: jest.fn(), createMany: jest.fn() },
  aplicacion: { deleteMany: jest.fn() },
  pregunta: { findMany: jest.fn() },
};

const mockCalificacionService = {
  finalizarAplicacion: jest.fn(),
};

const mockMailService = {
  enviarCorreo: jest.fn(),
};

const bateriaMock = {
  id: 1,
  nombre: 'Básica',
  activa: true,
  pruebas: [
    { id: 10, pruebaId: 5, orden: 0, prueba: { id: 5, nombre: 'Big Five' } },
  ],
};

const candidatoMock = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@test.com',
};

const invitacionMock = {
  id: 1,
  token: 'token-mock',
  estado: 'PENDIENTE',
  intentos: 1,
  candidatoId: 1,
  bateriaId: 1,
  fechaExpiracion: new Date(Date.now() + 48 * 3600 * 1000),
  candidato: candidatoMock,
  bateria: bateriaMock,
  aplicaciones: [
    { id: 100, pruebaId: 5, numeroIntento: 1, prueba: { id: 5, nombre: 'Big Five' } },
  ],
};

describe('InvitacionesService', () => {
  let service: InvitacionesService;
  let prismaService: PrismaService;
  let calificacionService: CalificacionService;
  let mailService: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitacionesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CalificacionService, useValue: mockCalificacionService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<InvitacionesService>(InvitacionesService);
    prismaService = module.get<PrismaService>(PrismaService);
    calificacionService = module.get<CalificacionService>(CalificacionService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('crear', () => {
    it('should create an invitacion with aplicaciones and return the link', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(candidatoMock);
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue(bateriaMock);
      (prismaService.invitacion.create as jest.Mock).mockResolvedValue(invitacionMock);

      const result = await service.crear({ candidatoId: 1, bateriaId: 1 });

      expect(prismaService.invitacion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          token: expect.any(String),
          candidatoId: 1,
          bateriaId: 1,
          intentos: 1,
          aplicaciones: {
            create: [{ pruebaId: 5, candidatoId: 1, numeroIntento: 1 }],
          },
        }),
        include: {
          aplicaciones: { include: { prueba: true } },
          candidato: true,
          bateria: true,
        },
      });
      expect(result.link).toContain('/examen/');
      expect(result.correoEnviado).toBe(false);
    });

    it('should throw NotFoundException when candidato does not exist', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.crear({ candidatoId: 99, bateriaId: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when bateria is inactive', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(candidatoMock);
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue({
        ...bateriaMock,
        activa: false,
      });

      await expect(service.crear({ candidatoId: 1, bateriaId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when bateria has no pruebas', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(candidatoMock);
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue({
        ...bateriaMock,
        pruebas: [],
      });

      await expect(service.crear({ candidatoId: 1, bateriaId: 1 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should send email when enviarCorreo is true and candidato has email', async () => {
      (prismaService.candidato.findUnique as jest.Mock).mockResolvedValue(candidatoMock);
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue(bateriaMock);
      (prismaService.invitacion.create as jest.Mock).mockResolvedValue(invitacionMock);
      (mailService.enviarCorreo as jest.Mock).mockResolvedValue(true);

      const result = await service.crear({
        candidatoId: 1,
        bateriaId: 1,
        enviarCorreo: true,
      });

      expect(mailService.enviarCorreo).toHaveBeenCalledWith(
        candidatoMock.email,
        expect.any(String),
        expect.stringContaining('/examen/'),
      );
      expect(result.correoEnviado).toBe(true);
    });
  });

  describe('listar', () => {
    it('should return invitaciones with relaciones', async () => {
      (prismaService.invitacion.findMany as jest.Mock).mockResolvedValue([invitacionMock]);

      const result = await service.listar();

      expect(prismaService.invitacion.findMany).toHaveBeenCalledWith({
        include: {
          candidato: { include: { empresa: true } },
          bateria: { include: { pruebas: { include: { prueba: true } } } },
          _count: { select: { aplicaciones: true } },
        },
        orderBy: { fechaCreacion: 'desc' },
      });
      expect(result).toEqual([invitacionMock]);
    });
  });

  describe('detalle', () => {
    it('should return detalle with link when found', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);

      const result = await service.detalle(1);

      expect(result.link).toContain('/examen/');
    });

    it('should throw NotFoundException when not found', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.detalle(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reintentar', () => {
    it('should throw NotFoundException when invitacion does not exist', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.reintentar(99)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when max intentos reached', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        intentos: MAX_INTENTOS,
      });

      await expect(service.reintentar(1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when revocada', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        estado: 'REVOCADA',
      });

      await expect(service.reintentar(1)).rejects.toThrow(BadRequestException);
    });

    it('should reset respuestas y crear nuevas aplicaciones', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);
      (prismaService.bateria.findUnique as jest.Mock).mockResolvedValue(bateriaMock);
      (prismaService.resultadoDimension.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.resultadoGlobal.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.respuesta.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.aplicacion.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prismaService.invitacion.update as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        intentos: 2,
      });

      const result = await service.reintentar(1);

      expect(prismaService.resultadoDimension.deleteMany).toHaveBeenCalledWith({
        where: { aplicacionId: { in: [100] } },
      });
      expect(prismaService.aplicacion.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [100] } },
      });
      expect(prismaService.invitacion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          intentos: 2,
          estado: 'PENDIENTE',
          fechaCompletada: null,
          aplicaciones: {
            create: [{ pruebaId: 5, candidatoId: 1, numeroIntento: 2 }],
          },
        }),
        include: { aplicaciones: true },
      });
      expect(result.link).toContain('/examen/');
    });
  });

  describe('cancelar', () => {
    it('should throw NotFoundException when invitacion does not exist', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.cancelar(99)).rejects.toThrow(NotFoundException);
    });

    it('should mark invitacion as REVOCADA', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);
      (prismaService.invitacion.update as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        estado: 'REVOCADA',
      });

      const result = await service.cancelar(1);

      expect(prismaService.invitacion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'REVOCADA' },
      });
      expect(result.estado).toBe('REVOCADA');
    });
  });

  describe('obtenerExamen', () => {
    it('should return the public examen structure', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);
      (prismaService.pregunta.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          enunciado: 'Me considero tranquilo',
          tipo: 'LIKERT',
          orden: 0,
          dimensionId: 3,
          dimension: { id: 3 },
          opciones: [{ id: 1, texto: 'Totalmente en desacuerdo' }],
        },
      ]);

      const result = await service.obtenerExamen('token-mock');

      expect(prismaService.pregunta.findMany).toHaveBeenCalledWith({
        where: { pruebaId: 5 },
        include: {
          opciones: { select: { id: true, texto: true } },
          dimension: { select: { id: true } },
        },
        orderBy: { orden: 'asc' },
      });
      expect(result.candidato).toEqual({ nombre: 'Juan', apellido: 'Pérez' });
      expect(result.pruebas).toHaveLength(1);
      expect(result.pruebas[0]).toMatchObject({
        aplicacionId: 100,
        pruebaId: 5,
        nombre: 'Big Five',
        preguntas: [
          {
            id: 1,
            enunciado: 'Me considero tranquilo',
            tipo: 'LIKERT',
            dimensionId: 3,
            opciones: [{ id: 1, texto: 'Totalmente en desacuerdo' }],
          },
        ],
      });
    });

    it('should throw when token is invalid', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.obtenerExamen('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('should throw when invitacion is revocada', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        estado: 'REVOCADA',
      });

      await expect(service.obtenerExamen('token-mock')).rejects.toThrow(BadRequestException);
    });

    it('should throw when invitacion is completada', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        estado: 'COMPLETADA',
      });

      await expect(service.obtenerExamen('token-mock')).rejects.toThrow(BadRequestException);
    });

    it('should throw when invitacion has expired', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        fechaExpiracion: new Date(Date.now() - 3600 * 1000),
      });

      await expect(service.obtenerExamen('token-mock')).rejects.toThrow(BadRequestException);
    });
  });

  describe('guardarRespuestas', () => {
    it('should save respuestas con skipDuplicates', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);
      (prismaService.respuesta.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.guardarRespuestas('token-mock', {
        respuestas: [{ aplicacionId: 100, preguntaId: 1, opcionId: 2 }],
      });

      expect(prismaService.respuesta.createMany).toHaveBeenCalledWith({
        data: [{ aplicacionId: 100, preguntaId: 1, opcionRespuestaId: 2 }],
        skipDuplicates: true,
      });
    });

    it('should reject respuestas de aplicaciones ajenas al examen', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);

      await expect(
        service.guardarRespuestas('token-mock', {
          respuestas: [{ aplicacionId: 999, preguntaId: 1, opcionId: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('finalizar', () => {
    it('should save respuestas, calificar cada aplicacion y marcar COMPLETADA', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);
      (prismaService.respuesta.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prismaService.invitacion.update as jest.Mock).mockResolvedValue({
        ...invitacionMock,
        estado: 'COMPLETADA',
      });
      (calificacionService.finalizarAplicacion as jest.Mock).mockResolvedValue(undefined);

      const result = await service.finalizar('token-mock', {
        respuestas: [{ aplicacionId: 100, preguntaId: 1, opcionId: 2 }],
      });

      expect(prismaService.respuesta.createMany).toHaveBeenCalledWith({
        data: [{ aplicacionId: 100, preguntaId: 1, opcionRespuestaId: 2 }],
        skipDuplicates: true,
      });
      expect(calificacionService.finalizarAplicacion).toHaveBeenCalledWith(100);
      expect(prismaService.invitacion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'COMPLETADA', fechaCompletada: expect.any(Date) },
      });
      expect(result).toEqual({ completada: true });
    });

    it('should reject respuestas de aplicaciones ajenas al examen', async () => {
      (prismaService.invitacion.findUnique as jest.Mock).mockResolvedValue(invitacionMock);

      await expect(
        service.finalizar('token-mock', {
          respuestas: [{ aplicacionId: 999, preguntaId: 1, opcionId: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(calificacionService.finalizarAplicacion).not.toHaveBeenCalled();
    });
  });
});
