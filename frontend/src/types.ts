export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  fechaCreacion: string;
}

export interface Empresa {
  id: number;
  nombre: string;
  activa: boolean;
  fechaCreacion: string;
  certificadoTitulo?: string | null;
  certificadoTexto?: string | null;
  _count?: { candidatos: number };
}

export interface Candidato {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono?: string | null;
  cargoPostulado?: string | null;
  fechaNacimiento?: string | null;
  edad?: number | null;
  empresaId?: number | null;
  empresa?: Empresa | null;
  fechaCreacion: string;
}

export interface OpcionRespuesta {
  id: number;
  texto: string;
  valor: number;
  esCorrecta: boolean;
}

export interface Pregunta {
  id: number;
  enunciado: string;
  tipo: string;
  orden: number;
  opciones: OpcionRespuesta[];
}

export interface UmbralClasificacion {
  id: number;
  nombre: string;
  descripcion?: string | null;
  puntuacionMinima: number;
  puntuacionMaxima: number;
  interpretacion: string;
  dimensionId?: number | null;
}

export interface Dimension {
  id: number;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  tipoAgregacion: string;
  preguntas: Pregunta[];
  umbrales?: UmbralClasificacion[];
}

export interface Prueba {
  id: number;
  nombre: string;
  descripcion?: string | null;
  version: string;
  activa: boolean;
  fechaCreacion: string;
  dimensiones?: Dimension[];
  umbrales?: UmbralClasificacion[];
  _count?: { dimensiones: number; aplicaciones: number };
}

export interface PruebaOpcionInput {
  texto: string;
  valor: number;
  esCorrecta?: boolean;
}

export interface PruebaPreguntaInput {
  enunciado: string;
  tipo?: 'LIKERT' | 'OPCION_MULTIPLE';
  orden?: number;
  opciones: PruebaOpcionInput[];
}

export interface PruebaUmbralInput {
  nombre: string;
  descripcion?: string;
  puntuacionMinima: number;
  puntuacionMaxima: number;
  interpretacion: string;
}

export interface PruebaDimensionInput {
  nombre: string;
  descripcion?: string;
  orden?: number;
  tipoAgregacion?: 'SUMA' | 'PROMEDIO';
  preguntas?: PruebaPreguntaInput[];
  umbrales?: PruebaUmbralInput[];
}

export interface CrearPruebaDto {
  nombre: string;
  descripcion?: string;
  version?: string;
  activa?: boolean;
  dimensiones?: PruebaDimensionInput[];
  umbrales?: PruebaUmbralInput[];
}

export interface ResultadoDimension {
  id: number;
  dimensionId: number;
  puntuacion: number;
  porcentaje: number;
  clasificacion?: string | null;
  interpretacion?: string | null;
  dimension: Dimension;
}

export interface ResultadoGlobal {
  id: number;
  puntuacion: number;
  clasificacion?: string | null;
  interpretacion?: string | null;
  prueba?: Prueba;
}

export interface BateriaPrueba {
  id: number;
  bateriaId: number;
  pruebaId: number;
  orden: number;
  prueba: Prueba;
}

export interface Bateria {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activa: boolean;
  empresaId?: number | null;
  empresa?: Empresa | null;
  fechaCreacion: string;
  pruebas: BateriaPrueba[];
  _count?: { invitaciones: number };
}

export type EstadoInvitacion = 'PENDIENTE' | 'COMPLETADA' | 'EXPIRADA' | 'REVOCADA';

export interface Invitacion {
  id: number;
  token: string;
  candidatoId: number;
  candidato?: Candidato;
  bateriaId: number;
  bateria?: Bateria;
  estado: EstadoInvitacion;
  fechaCreacion: string;
  fechaExpiracion: string;
  fechaCompletada?: string | null;
  intentos: number;
  link?: string;
  correoEnviado?: boolean;
  aplicaciones?: Aplicacion[];
  _count?: { aplicaciones: number };
}

export interface PreguntaExamen {
  id: number;
  enunciado: string;
  tipo: string;
  dimensionId?: number | null;
  opciones: { id: number; texto: string }[];
}

export interface PruebaExamen {
  aplicacionId: number | null;
  pruebaId: number;
  nombre: string;
  descripcion?: string | null;
  preguntas: PreguntaExamen[];
}

export interface ExamenPublico {
  token: string;
  estado: EstadoInvitacion;
  fechaExpiracion: string;
  candidato: { nombre: string; apellido: string };
  bateria: { nombre: string };
  pruebas: PruebaExamen[];
}

export interface Aplicacion {
  id: number;
  candidatoId: number;
  pruebaId: number;
  usuarioId?: number | null;
  fechaInicio: string;
  fechaFin?: string | null;
  numeroIntento: number;
  completada: boolean;
  candidato?: Candidato;
  prueba?: Prueba;
  resultadosDimension?: ResultadoDimension[];
  resultadosGlobales?: ResultadoGlobal[];
}
