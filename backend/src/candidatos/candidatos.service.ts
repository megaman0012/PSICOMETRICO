import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Candidato } from '@prisma/client';
import { CrearCandidatoDto } from './dto/crear-candidato.dto';
import { calcularEdad } from '../utils/edad';
import * as XLSX from 'xlsx';

function escaparCsv(valor: unknown): string {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  if (/[",\n;]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function formatearFechaCsv(fecha: Date | string | null | undefined): string {
  if (!fecha) return '';
  return new Date(fecha).toISOString().slice(0, 10);
}

function normalizarFechaExcel(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null;
  if (typeof valor === 'number') {
    const ms = (valor - 25569) * 86400 * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  }
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return valor.toISOString().slice(0, 10);
  }
  const texto = String(valor).trim();
  if (!texto) return null;
  const d = new Date(texto);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizarTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto || null;
}

@Injectable()
export class CandidatosService {
  constructor(private prisma: PrismaService) {}

  async crear(dto: CrearCandidatoDto): Promise<Candidato> {
    return this.prisma.candidato.create({
      data: {
        nombre: dto.nombre,
        apellido: dto.apellido,
        cedula: dto.cedula,
        email: dto.email,
        telefono: dto.telefono,
        cargoPostulado: dto.cargoPostulado,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : null,
        empresaId: dto.empresaId,
      },
    });
  }

  async encontrarTodos(): Promise<Candidato[]> {
    const candidatos = await this.prisma.candidato.findMany({
      include: { empresa: true },
      orderBy: { nombre: 'asc' },
    });
    return candidatos.map((c) => ({
      ...c,
      edad: calcularEdad(c.fechaNacimiento),
    })) as Candidato[];
  }

  async buscarPorCedula(cedula: string): Promise<Candidato | null> {
    const candidato = await this.prisma.candidato.findFirst({
      where: { cedula },
      include: { empresa: true },
    });
    if (!candidato) return null;
    return { ...candidato, edad: calcularEdad(candidato.fechaNacimiento) } as Candidato;
  }

  async historial(candidatoId: number): Promise<Candidato | null> {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id: candidatoId },
      include: {
        empresa: true,
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
    if (!candidato) return null;
    return { ...candidato, edad: calcularEdad(candidato.fechaNacimiento) } as Candidato;
  }

  async exportarCsv(): Promise<string> {
    const candidatos = await this.prisma.candidato.findMany({
      include: { empresa: true },
      orderBy: { nombre: 'asc' },
    });

    const encabezado = [
      'ID',
      'Nombre',
      'Apellido',
      'Cedula',
      'Email',
      'Telefono',
      'CargoPostulado',
      'FechaNacimiento',
      'Edad',
      'Empresa',
      'FechaRegistro',
    ];

    const filas = candidatos.map((c) => [
      c.id,
      c.nombre,
      c.apellido,
      c.cedula,
      c.email,
      c.telefono || '',
      c.cargoPostulado || '',
      formatearFechaCsv(c.fechaNacimiento),
      calcularEdad(c.fechaNacimiento) ?? '',
      c.empresa?.nombre || '',
      formatearFechaCsv(c.fechaCreacion),
    ]);

    return [encabezado, ...filas].map((f) => f.map(escaparCsv).join(',')).join('\n');
  }

  plantillaCsv(): string {
    const encabezado = [
      'nombre',
      'apellido',
      'cedula',
      'email',
      'telefono',
      'cargoPostulado',
      'fechaNacimiento',
      'empresa',
    ];
    const ejemplo = [
      'Juan',
      'Pérez',
      'V-12345678',
      'juan.perez@example.com',
      '+58 412-0000000',
      'Guardia de Seguridad',
      '1990-05-15',
      'Seguridad Omega',
    ];
    return [encabezado, ejemplo].map((f) => f.map(escaparCsv).join(',')).join('\n');
  }

  async importarMasivo(
    archivo: Express.Multer.File,
  ): Promise<{ procesados: number; creados: number; actualizados: number; errores: { fila: number; mensaje: string }[] }> {
    if (!archivo) {
      throw new BadRequestException('Debe enviar un archivo');
    }
    if (!/\.(xlsx|xls|csv)$/i.test(archivo.originalname)) {
      throw new BadRequestException('Formato no soportado. Use .xlsx, .xls o .csv');
    }

    const workbook = XLSX.read(archivo.buffer, { type: 'buffer' });
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: null });

    if (filas.length === 0) {
      throw new BadRequestException('El archivo no contiene datos');
    }

    const empresas = await this.prisma.empresa.findMany();
    const errores: { fila: number; mensaje: string }[] = [];
    let creados = 0;
    let actualizados = 0;

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numFila = i + 2;
      try {
        const nombre = normalizarTexto(fila['nombre']);
        const apellido = normalizarTexto(fila['apellido']);
        const cedula = normalizarTexto(fila['cedula']);
        const email = normalizarTexto(fila['email']);

        if (!nombre || !apellido || !cedula || !email) {
          throw new Error('Faltan campos obligatorios (nombre, apellido, cedula, email)');
        }

        let empresaId: number | null = null;
        const nombreEmpresa = normalizarTexto(fila['empresa']);
        if (nombreEmpresa) {
          let empresa = empresas.find((e) => e.nombre.toLowerCase() === nombreEmpresa.toLowerCase());
          if (!empresa) {
            empresa = await this.prisma.empresa.create({ data: { nombre: nombreEmpresa } });
            empresas.push(empresa);
          }
          empresaId = empresa.id;
        }

        const data = {
          nombre,
          apellido,
          cedula,
          email,
          telefono: normalizarTexto(fila['telefono']),
          cargoPostulado: normalizarTexto(fila['cargoPostulado']),
          fechaNacimiento: normalizarFechaExcel(fila['fechaNacimiento']),
          empresaId,
        };

        const existente = await this.prisma.candidato.findUnique({ where: { cedula } });
        if (existente) {
          await this.prisma.candidato.update({ where: { cedula }, data });
          actualizados++;
        } else {
          await this.prisma.candidato.create({ data });
          creados++;
        }
      } catch (err) {
        errores.push({ fila: numFila, mensaje: err instanceof Error ? err.message : 'Error desconocido' });
      }
    }

    return { procesados: filas.length, creados, actualizados, errores };
  }
}
