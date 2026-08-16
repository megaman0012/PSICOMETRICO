import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CalificacionService } from '../calificacion/calificacion.service';
import { MailService } from '../mail/mail.service';
import { CrearInvitacionDto } from './dto/crear-invitacion.dto';
import { GuardarRespuestasDto } from './dto/guardar-respuestas.dto';

export const MAX_INTENTOS = 2;
export const HORAS_EXPIRACION_DEFAULT = 48;

@Injectable()
export class InvitacionesService {
  constructor(
    private prisma: PrismaService,
    private calificacionService: CalificacionService,
    private mailService: MailService,
  ) {}

  private frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  private linkExamen(token: string): string {
    return `${this.frontendUrl()}/examen/${token}`;
  }

  private async obtenerBateriaConPruebas(bateriaId: number) {
    const bateria = await this.prisma.bateria.findUnique({
      where: { id: bateriaId },
      include: {
        pruebas: {
          include: { prueba: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
    if (!bateria) {
      throw new NotFoundException(`Batería con ID ${bateriaId} no encontrada`);
    }
    if (!bateria.activa) {
      throw new BadRequestException('La batería está inactiva');
    }
    if (bateria.pruebas.length === 0) {
      throw new BadRequestException('La batería no tiene pruebas asignadas');
    }
    return bateria;
  }

  async crear(dto: CrearInvitacionDto) {
    const [candidato, bateria] = await Promise.all([
      this.prisma.candidato.findUnique({ where: { id: dto.candidatoId } }),
      this.obtenerBateriaConPruebas(dto.bateriaId),
    ]);

    if (!candidato) {
      throw new NotFoundException(`Candidato con ID ${dto.candidatoId} no encontrado`);
    }

    const token = randomBytes(32).toString('hex');
    const horas = dto.horasExpiracion || HORAS_EXPIRACION_DEFAULT;
    const fechaExpiracion = new Date(Date.now() + horas * 3600 * 1000);

    const invitacion = await this.prisma.invitacion.create({
      data: {
        token,
        candidatoId: candidato.id,
        bateriaId: bateria.id,
        fechaExpiracion,
        intentos: 1,
        aplicaciones: {
          create: bateria.pruebas.map((bp) => ({
            pruebaId: bp.pruebaId,
            candidatoId: candidato.id,
            numeroIntento: 1,
          })),
        },
      },
      include: {
        aplicaciones: { include: { prueba: true } },
        candidato: true,
        bateria: true,
      },
    });

    const link = this.linkExamen(token);
    let correoEnviado = false;

    if (dto.enviarCorreo && candidato.email) {
      const nombrePruebas = invitacion.aplicaciones
        .map((a) => a.prueba.nombre)
        .join(', ');
      correoEnviado = await this.mailService.enviarCorreo(
        candidato.email,
        'Invitación a evaluación psicométrica',
        `<h2>Hola ${candidato.nombre} ${candidato.apellido}</h2>
         <p>Has sido invitado a completar tus evaluaciones psicométricas para la empresa.</p>
         <p>Pruebas incluidas: <strong>${nombrePruebas}</strong></p>
         <p>El enlace expira en ${horas} horas.</p>
         <p><a href="${link}">Comenzar evaluación</a></p>`,
      );
    }

    return { ...invitacion, link, correoEnviado };
  }

  async listar() {
    return this.prisma.invitacion.findMany({
      include: {
        candidato: { include: { empresa: true } },
        bateria: { include: { pruebas: { include: { prueba: true } } } },
        _count: { select: { aplicaciones: true } },
      },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  async detalle(id: number) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { id },
      include: {
        candidato: { include: { empresa: true } },
        bateria: { include: { pruebas: { include: { prueba: true } } } },
        aplicaciones: {
          include: { prueba: true, resultadosGlobales: true },
        },
      },
    });
    if (!invitacion) {
      throw new NotFoundException(`Invitación con ID ${id} no encontrada`);
    }
    return { ...invitacion, link: this.linkExamen(invitacion.token) };
  }

  async reintentar(id: number) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { id },
      include: { aplicaciones: true },
    });
    if (!invitacion) {
      throw new NotFoundException(`Invitación con ID ${id} no encontrada`);
    }
    if (invitacion.intentos >= MAX_INTENTOS) {
      throw new BadRequestException(
        `La invitación ya alcanzó el máximo de ${MAX_INTENTOS} intentos`,
      );
    }
    if (invitacion.estado === 'REVOCADA') {
      throw new BadRequestException('No se puede reintentar una invitación revocada');
    }

    const aplicacionIds = invitacion.aplicaciones.map((a) => a.id);
    await this.prisma.resultadoDimension.deleteMany({
      where: { aplicacionId: { in: aplicacionIds } },
    });
    await this.prisma.resultadoGlobal.deleteMany({
      where: { aplicacionId: { in: aplicacionIds } },
    });
    await this.prisma.respuesta.deleteMany({
      where: { aplicacionId: { in: aplicacionIds } },
    });
    await this.prisma.aplicacion.deleteMany({
      where: { id: { in: aplicacionIds } },
    });

    const bateria = await this.obtenerBateriaConPruebas(invitacion.bateriaId);
    const nuevoIntento = invitacion.intentos + 1;

    const actualizada = await this.prisma.invitacion.update({
      where: { id },
      data: {
        intentos: nuevoIntento,
        estado: 'PENDIENTE',
        fechaExpiracion: new Date(Date.now() + HORAS_EXPIRACION_DEFAULT * 3600 * 1000),
        fechaCompletada: null,
        aplicaciones: {
          create: bateria.pruebas.map((bp) => ({
            pruebaId: bp.pruebaId,
            candidatoId: invitacion.candidatoId,
            numeroIntento: nuevoIntento,
          })),
        },
      },
      include: {
        aplicaciones: true,
      },
    });

    return { ...actualizada, link: this.linkExamen(actualizada.token) };
  }

  async cancelar(id: number) {
    const invitacion = await this.prisma.invitacion.findUnique({ where: { id } });
    if (!invitacion) {
      throw new NotFoundException(`Invitación con ID ${id} no encontrada`);
    }
    return this.prisma.invitacion.update({
      where: { id },
      data: { estado: 'REVOCADA' },
    });
  }

  // ============================================================
  // FLUJO PÚBLICO (sin autenticación)
  // ============================================================

  private async validarToken(token: string) {
    const invitacion = await this.prisma.invitacion.findUnique({
      where: { token },
      include: {
        candidato: true,
        bateria: { include: { pruebas: { include: { prueba: true }, orderBy: { orden: 'asc' } } } },
        aplicaciones: true,
      },
    });
    if (!invitacion) {
      throw new NotFoundException('Enlace de examen no válido');
    }
    if (invitacion.estado === 'REVOCADA') {
      throw new BadRequestException('Este enlace fue revocado por el administrador');
    }
    if (invitacion.estado === 'COMPLETADA') {
      throw new BadRequestException('Este examen ya fue completado');
    }
    if (new Date() > new Date(invitacion.fechaExpiracion)) {
      throw new BadRequestException('Este enlace ha expirado. Contacte al administrador.');
    }
    return invitacion;
  }

  async obtenerExamen(token: string) {
    const invitacion = await this.validarToken(token);

    const pruebas = await Promise.all(
      invitacion.bateria.pruebas.map(async (bp) => {
        const aplicacion = invitacion.aplicaciones.find((a) => a.pruebaId === bp.pruebaId);
        const preguntas = await this.prisma.pregunta.findMany({
          where: { pruebaId: bp.pruebaId },
          include: {
            opciones: { select: { id: true, texto: true } },
            dimension: { select: { id: true } },
          },
          orderBy: { orden: 'asc' },
        });
        return {
          aplicacionId: aplicacion?.id ?? null,
          pruebaId: bp.pruebaId,
          nombre: bp.prueba.nombre,
          descripcion: bp.prueba.descripcion,
          preguntas: preguntas.map((p) => ({
            id: p.id,
            enunciado: p.enunciado,
            tipo: p.tipo,
            dimensionId: p.dimension?.id ?? null,
            opciones: p.opciones,
          })),
        };
      }),
    );

    return {
      token,
      estado: invitacion.estado,
      fechaExpiracion: invitacion.fechaExpiracion,
      candidato: {
        nombre: invitacion.candidato.nombre,
        apellido: invitacion.candidato.apellido,
      },
      bateria: { nombre: invitacion.bateria.nombre },
      pruebas,
    };
  }

  async guardarRespuestas(token: string, dto: GuardarRespuestasDto): Promise<void> {
    const invitacion = await this.validarToken(token);
    const aplicacionIds = invitacion.aplicaciones.map((a) => a.id);

    for (const respuesta of dto.respuestas) {
      if (!aplicacionIds.includes(respuesta.aplicacionId)) {
        throw new BadRequestException(
          `La aplicación ${respuesta.aplicacionId} no pertenece a este examen`,
        );
      }
    }

    const data = dto.respuestas.map((r) => ({
      aplicacionId: r.aplicacionId,
      preguntaId: r.preguntaId,
      opcionRespuestaId: r.opcionId,
    }));

    await this.prisma.respuesta.createMany({ data, skipDuplicates: true });
  }

  async finalizar(token: string, dto: GuardarRespuestasDto): Promise<{ completada: boolean }> {
    const invitacion = await this.validarToken(token);
    const aplicacionIds = invitacion.aplicaciones.map((a) => a.id);

    const respuestasPorAplicacion = new Map<number, { preguntaId: number; opcionId: number }[]>();
    for (const r of dto.respuestas) {
      if (!aplicacionIds.includes(r.aplicacionId)) {
        throw new BadRequestException(
          `La aplicación ${r.aplicacionId} no pertenece a este examen`,
        );
      }
      if (!respuestasPorAplicacion.has(r.aplicacionId)) {
        respuestasPorAplicacion.set(r.aplicacionId, []);
      }
      respuestasPorAplicacion.get(r.aplicacionId)!.push({ preguntaId: r.preguntaId, opcionId: r.opcionId });
    }

    const data = dto.respuestas.map((r) => ({
      aplicacionId: r.aplicacionId,
      preguntaId: r.preguntaId,
      opcionRespuestaId: r.opcionId,
    }));
    await this.prisma.respuesta.createMany({ data, skipDuplicates: true });

    for (const aplicacionId of aplicacionIds) {
      await this.calificacionService.finalizarAplicacion(aplicacionId);
    }

    await this.prisma.invitacion.update({
      where: { id: invitacion.id },
      data: {
        estado: 'COMPLETADA',
        fechaCompletada: new Date(),
      },
    });

    return { completada: true };
  }
}
