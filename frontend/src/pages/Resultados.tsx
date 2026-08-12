import { useEffect, useState } from 'react';
import { aplicacionesService, reportesService } from '../services/api';
import type { Aplicacion } from '../types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function Resultados() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [seleccionada, setSeleccionada] = useState<Aplicacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [descargando, setDescargando] = useState(false);

  const redactarInforme = (aplicacion: Aplicacion): string[] => {
    const parrafos: string[] = [];
    const global = aplicacion.resultadosGlobales?.[0];
    const nombre = `${aplicacion.candidato?.nombre} ${aplicacion.candidato?.apellido}`;
    const prueba = aplicacion.prueba?.nombre;

    parrafos.push(
      `El candidato ${nombre} completó la evaluación "${prueba}" (intento ${aplicacion.numeroIntento}).`,
    );

    if (global) {
      const punt = Number(global.puntuacion).toFixed(1);
      const clasif = global.clasificacion || 'sin clasificar';
      parrafos.push(
        `En términos generales obtuvo una puntuación global de ${punt} sobre 100, lo que se clasifica como "${clasif}".`,
      );
    }

    if (aplicacion.resultadosDimension && aplicacion.resultadosDimension.length > 0) {
      const fortalezas = aplicacion.resultadosDimension.filter(
        (rd) => Number(rd.porcentaje) >= 70,
      );
      const debilidades = aplicacion.resultadosDimension.filter(
        (rd) => Number(rd.porcentaje) < 50,
      );

      if (fortalezas.length > 0) {
        parrafos.push(
          `Destaca en: ${fortalezas.map((rd) => rd.dimension?.nombre).join(', ')}.`,
        );
      }
      if (debilidades.length > 0) {
        parrafos.push(
          `Presenta áreas de oportunidad en: ${debilidades.map((rd) => rd.dimension?.nombre).join(', ')}.`,
        );
      }
    }

    if (global?.interpretacion) {
      parrafos.push(global.interpretacion);
    } else {
      parrafos.push(
        'Se recomienda complementar esta evaluación con una entrevista estructurada y verificación de referencias antes de la decisión final de contratación.',
      );
    }

    return parrafos;
  };

  const cargar = () => {
    aplicacionesService
      .listar()
      .then(setAplicaciones)
      .catch(() => setError('No se pudieron cargar las aplicaciones'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const verDetalle = async (id: number) => {
    try {
      const detalle = await aplicacionesService.detalle(id);
      setSeleccionada(detalle);
      setError('');
    } catch {
      setError('No se pudo cargar el detalle de la aplicación');
    }
  };

  const grafica = seleccionada?.resultadosDimension?.map((rd) => ({
    dimension: rd.dimension?.nombre || `Dimensión ${rd.dimensionId}`,
    puntuacion: Number(rd.puntuacion),
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Resultados de aplicaciones</h1>
        <p className="text-gray-500">Consultar resultados psicométricos por candidato</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          {cargando ? (
            <p className="p-4 text-gray-500 text-sm">Cargando...</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {aplicaciones.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => verDetalle(a.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 ${
                      seleccionada?.id === a.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-800">
                      {a.candidato?.nombre} {a.candidato?.apellido}
                    </div>
                    <div className="text-xs text-gray-500">{a.prueba?.nombre}</div>
                    <div className="mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          a.completada
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {a.completada ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {aplicaciones.length === 0 && !cargando && (
            <p className="p-4 text-gray-500 text-sm">No hay aplicaciones registradas.</p>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          {seleccionada ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {seleccionada.candidato?.nombre} {seleccionada.candidato?.apellido}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {seleccionada.prueba?.nombre} · Iniciada el{' '}
                      {new Date(seleccionada.fechaInicio).toLocaleDateString()}
                      {seleccionada.fechaFin &&
                        ` · Finalizada el ${new Date(seleccionada.fechaFin).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setDescargando(true);
                        setError('');
                        reportesService
                          .descargarAplicacion(seleccionada.id)
                          .catch(() => setError('No se pudo descargar el CSV'))
                          .finally(() => setDescargando(false));
                      }}
                      disabled={descargando}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {descargando ? 'Descargando...' : 'Descargar CSV'}
                    </button>
                    <button
                      onClick={() => {
                        setDescargando(true);
                        setError('');
                        reportesService
                          .descargarAplicacionPdf(seleccionada.id)
                          .catch(() => setError('No se pudo descargar el PDF'))
                          .finally(() => setDescargando(false));
                      }}
                      disabled={descargando}
                      className="text-sm bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                    >
                      {descargando ? 'Descargando...' : 'Descargar PDF'}
                    </button>
                  </div>
                </div>
                {seleccionada.resultadosGlobales?.map((rg) => (
                  <div key={rg.id} className="mt-4 flex items-center space-x-4">
                    <div className="text-4xl font-bold text-gray-800">
                      {Number(rg.puntuacion).toFixed(1)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        {rg.clasificacion || 'Sin clasificar'}
                      </div>
                      {rg.interpretacion && (
                        <div className="text-xs text-gray-500">{rg.interpretacion}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {grafica && grafica.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Puntuación por dimensión
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={grafica}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="puntuacion" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Detalle por dimensión
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {seleccionada.resultadosDimension?.map((rd) => (
                    <div key={rd.id} className="border border-gray-100 rounded-md p-4">
                      <div className="font-medium text-gray-800">{rd.dimension?.nombre}</div>
                      <div className="mt-1 flex items-baseline space-x-2">
                        <span className="text-xl font-bold text-blue-800">
                          {Number(rd.puntuacion).toFixed(2)}
                        </span>
                        {Number(rd.porcentaje) > 0 && (
                          <span className="text-xs text-gray-400">
                            {Number(rd.porcentaje).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {rd.clasificacion || 'Sin clasificar'}
                      </span>
                      {rd.interpretacion && (
                        <p className="text-gray-500 text-xs mt-2">{rd.interpretacion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Informe psicométrico
                </h3>
                {seleccionada.completada ? (
                  <div className="space-y-3">
                    {redactarInforme(seleccionada).map((parrafo, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {parrafo}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    El informe se genera cuando la aplicación se finaliza y califica.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Seleccione una aplicación para ver sus resultados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
