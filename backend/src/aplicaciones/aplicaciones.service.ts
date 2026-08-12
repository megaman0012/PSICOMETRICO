import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Aplicacion } from '@prisma/client';
import { CrearAplicacionDto } from './dto/crear-aplicacion.dto';
import { GuardarRespuestasDto } from './dto/guardar-respuestas.dto';
import { CalificacionService } from '../calificacion/calificacion.service';

@Injectable()
export class AplicacionesService {
  constructor(
    private prisma: PrismaService,
    private calificacionService: CalificacionService,
  ) {}

  async crear(dto: CrearAplicacionDto): Promise<Aplicacion> {
    // Verificar que la prueba, candidato y evaluador existen
    const [prueba, candidato, evaluador] = await Promise.all([
      this.prisma.prueba.findUnique({ where: { id: dto.pruebaId } }),
      this.prisma.candidato.findUnique({ where: { id: dto.candidatoId } }),
      this.prisma.usuario.findUnique({ where: { id: dto.evaluadorId } }),
    ]);

    if (!prueba) {
      throw new Error(`Prueba con ID ${dto.pruebaId} no encontrada`);
    }
    if (!candidato) {
      throw new Error(`Candidato con ID ${dto.candidatoId} no encontrado`);
    }
    if (!evaluador) {
      throw new Error(`Evaluador con ID ${dto.evaluadorId} no encontrado`);
    }

    // Calcular el número de intento: máximo existente para este candidato+prueba + 1
    const intentosPrevios = await this.prisma.aplicacion.aggregate({
      where: { candidatoId: dto.candidatoId, pruebaId: dto.pruebaId },
      _max: { numeroIntento: true },
    });
    const numeroIntento = (intentosPrevios._max.numeroIntento || 0) + 1;

    return this.prisma.aplicacion.create({
      data: {
        pruebaId: dto.pruebaId,
        candidatoId: dto.candidatoId,
        usuarioId: dto.evaluadorId,
        numeroIntento,
      },
      include: {
        prueba: {
          include: {
            dimensiones: {
              include: {
                preguntas: {
                  include: {
                    opciones: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async encontrarTodas(): Promise<Aplicacion[]> {
    return this.prisma.aplicacion.findMany({
      include: {
        candidato: true,
        prueba: true,
        resultadosGlobales: true,
        resultadosDimension: {
          include: {
            dimension: true,
          },
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async encontrarPorId(id: number): Promise<Aplicacion | null> {
    return this.prisma.aplicacion.findUnique({
      where: { id },
      include: {
        prueba: {
          include: {
            dimensiones: {
              include: {
                preguntas: {
                  include: {
                    opciones: true,
                  },
                },
              },
            },
          },
        },
        candidato: true,
        resultadosDimension: {
          include: {
            dimension: true,
          },
        },
        resultadosGlobales: {
          include: {
            prueba: true,
          },
        },
      },
    });
  }

  async guardarRespuestas(
    aplicacionId: number,
    dto: GuardarRespuestasDto,
  ): Promise<void> {
    // Verificar que la aplicación existe y está en estado PENDIENTE
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
    });

    if (!aplicacion) {
      throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    if (aplicacion.completada) {
      throw new Error(`La aplicación ${aplicacionId} ya está completada`);
    }

    // Guardar cada respuesta
    const respuestasData = dto.respuestas.map((respuesta) => ({
      aplicacionId,
      preguntaId: respuesta.preguntaId,
      opcionRespuestaId: respuesta.opcionId,
    }));

    await this.prisma.respuesta.createMany({
      data: respuestasData,
      skipDuplicates: true, // Evita errores si se envían respuestas duplicadas
    });
  }

  async finalizar(aplicacionId: number): Promise<void> {
    // Verificar que la aplicación existe
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
    });

    if (!aplicacion) {
      throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    if (aplicacion.completada) {
      throw new Error(`La aplicación ${aplicacionId} ya está completada`);
    }

    // Llamar al motor de calificación
    await this.calificacionService.finalizarAplicacion(aplicacionId);
  }
}