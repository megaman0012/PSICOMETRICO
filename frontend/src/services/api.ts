import axios from 'axios';
import type { Aplicacion, Candidato, CrearPruebaDto, Prueba, Usuario } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3021';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const healthService = {
  checkHealth: () => api.get('/health').then((res) => res.data),
};

export const authService = {
  login: (email: string, password: string) =>
    api
      .post('/auth/login', { email, password })
      .then((res) => res.data as { access_token: string }),
  me: () => api.get('/auth/me').then((res) => res.data as Usuario),
};

export const pruebasService = {
  listar: () => api.get('/pruebas').then((res) => res.data as Prueba[]),
  detalle: (id: number) => api.get(`/pruebas/${id}`).then((res) => res.data as Prueba),
  listarTodas: () => api.get('/pruebas/todas').then((res) => res.data as Prueba[]),
  crear: (dto: CrearPruebaDto) => api.post('/pruebas', dto).then((res) => res.data as Prueba),
  actualizar: (id: number, dto: CrearPruebaDto) =>
    api.put(`/pruebas/${id}`, dto).then((res) => res.data as Prueba),
  eliminar: (id: number) => api.delete(`/pruebas/${id}`).then((res) => res.data),
  cambiarEstado: (id: number, activa: boolean) =>
    api.patch(`/pruebas/${id}/estado`, { activa }).then((res) => res.data as Prueba),
};

export interface ResumenReporte {
  totalCandidatos: number;
  totalAplicaciones: number;
  completadas: number;
  pendientes: number;
  promedioGlobal: number;
  porClasificacion: Record<string, number>;
}

export interface HistorialCandidato extends Candidato {
  aplicaciones: Aplicacion[];
}

export const candidatosService = {
  listar: () => api.get('/candidatos').then((res) => res.data as Candidato[]),
  crear: (dto: Omit<Candidato, 'id' | 'fechaCreacion'>) =>
    api.post('/candidatos', dto).then((res) => res.data as Candidato),
  buscarPorCedula: (cedula: string) =>
    api.get(`/candidatos/buscar/${cedula}`).then((res) => res.data as Candidato),
  historial: (id: number) =>
    api.get(`/candidatos/${id}/historial`).then((res) => res.data as HistorialCandidato),
};

async function descargarArchivo(url: string, nombreArchivo: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Error al descargar (${res.status})`);
  }
  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

export const reportesService = {
  resumen: () => api.get('/reportes/resumen').then((res) => res.data as ResumenReporte),
  descargarAplicaciones: () =>
    descargarArchivo('/reportes/aplicaciones/csv', `aplicaciones_${new Date().toISOString().slice(0, 10)}.csv`),
  descargarAplicacion: (id: number) =>
    descargarArchivo(`/reportes/aplicaciones/${id}/csv`, `aplicacion_${id}.csv`),
  descargarAplicacionPdf: (id: number) =>
    descargarArchivo(`/reportes/aplicaciones/${id}/pdf`, `informe_psicometrico_${id}.pdf`),
  descargarHistorialCandidato: (id: number) =>
    descargarArchivo(`/reportes/candidatos/${id}/historial-csv`, `historial_candidato_${id}.csv`),
};

export const aplicacionesService = {
  listar: () => api.get('/aplicaciones').then((res) => res.data as Aplicacion[]),
  crear: (pruebaId: number, candidatoId: number, evaluadorId: number) =>
    api.post('/aplicaciones', { pruebaId, candidatoId, evaluadorId }).then((res) => res.data as Aplicacion),
  detalle: (id: number) => api.get(`/aplicaciones/${id}`).then((res) => res.data as Aplicacion),
  guardarRespuestas: (id: number, respuestas: { preguntaId: number; opcionId: number }[]) =>
    api.post(`/aplicaciones/${id}/respuestas`, { respuestas }).then((res) => res.data),
  finalizar: (id: number) => api.post(`/aplicaciones/${id}/finalizar`).then((res) => res.data),
};

export const usuariosService = {
  listar: () => api.get('/usuarios').then((res) => res.data as Usuario[]),
  crear: (dto: { email: string; password: string; nombre: string; rol?: string }) =>
    api.post('/usuarios', dto).then((res) => res.data as Usuario),
};

export default api;
