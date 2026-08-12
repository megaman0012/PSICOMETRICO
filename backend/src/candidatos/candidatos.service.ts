import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Candidato } from '@prisma/client';
import { CrearCandidatoDto } from './dto/crear-candidato.dto';

@Injectable()
export class CandidatosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearCandidatoDto): Promise<Candidato> {
    return this.prisma.candidato.create({
      data: dto,
    });
  }

  async encontrarTodos(): Promise<Candidato[]> {
    return this.prisma.candidato.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async buscarPorCedula(cedula: string): Promise<Candidato | null> {
    return this.prisma.candidato.findFirst({
      where: { cedula },
    });
  }

  async historial(candidatoId: number): Promise<Candidato | null> {
    return this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        aplicaciones: {
          include: {
            prueba: true,
            resultadosGlobales: true,
            resultadosDimension: {
              include: { dimension: true },
            },
          },
          orderBy: { fechaInicio: 'desc' },
        },
      },
    });
  }
}