import { useEffect, useState } from 'react';
import { candidatosService, reportesService } from '../services/api';
import type { Candidato } from '../types';
import type { HistorialCandidato } from '../services/api';

const colorClasificacion = (clasificacion?: string | null) =>
  clasificacion === 'Alta' || clasificacion === 'Aprobado' || clasificacion === 'Muy Apto'
    ? 'bg-green-100 text-green-700'
    : clasificacion === 'Media' || clasificacion === 'Apto'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-700';

export default function Historial() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidatoId, setCandidatoId] = useState<number>(0);
  const [historial, setHistorial] = useState<HistorialCandidato | null>(null);
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    candidatosService
      .listar()
      .then(setCandidatos)
      .catch(() => setError('No se pudieron cargar los candidatos'));
  }, []);

  const consultar = async () => {
    setError('');
    if (!candidatoId) {
      setError('Seleccione un candidato');
      return;
    }
    setCargando(true);
    try {
      const datos = await candidatosService.historial(candidatoId);
      setHistorial(datos);
    } catch {
      setError('No se pudo consultar el historial');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Historial por candidato</h1>
        <p className="text-gray-500">Todas las aplicaciones y resultados del candidato en el tiempo</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="flex items-end space-x-2 mb-6">
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Candidato</label>
          <select
            value={candidatoId}
            onChange={(e) => setCandidatoId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>— Seleccione un candidato —</option>
            {candidatos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido} ({c.cedula})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={consultar}
          disabled={cargando}
          className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
        {historial && (
          <button
            onClick={() => {
              setDescargando(true);
              setError('');
              reportesService
                .descargarHistorialCandidato(historial.id)
                .catch(() => setError('No se pudo descargar el historial'))
                .finally(() => setDescargando(false));
            }}
            disabled={descargando}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md disabled:opacity-50"
          >
            {descargando ? 'Descargando...' : 'Descargar CSV del historial'}
          </button>
        )}
      </div>

      {historial && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {historial.nombre} {historial.apellido}
            </h2>
            <p className="text-sm text-gray-500">
              Cédula: {historial.cedula} · {historial.email} · Cargo postulado:{' '}
              {historial.cargoPostulado || '—'}
            </p>
          </div>

          {historial.aplicaciones.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Este candidato no tiene aplicaciones registradas.
            </div>
          ) : (
            <ol className="relative border-l border-gray-200 ml-3 space-y-6">
              {historial.aplicaciones.map((a) => (
                <li key={a.id} className="ml-6">
                  <span
                    className={`absolute -left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                      a.completada ? 'bg-green-600' : 'bg-amber-500'
                    }`}
                  >
                    {a.numeroIntento}
                  </span>
                  <div className="bg-white rounded-lg shadow p-5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-gray-800">{a.prueba?.nombre}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          a.completada
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {a.completada ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Iniciada el {new Date(a.fechaInicio).toLocaleString()} · Intento{' '}
                      {a.numeroIntento}
                      {a.fechaFin && ` · Finalizada el ${new Date(a.fechaFin).toLocaleString()}`}
                    </p>

                    {a.resultadosGlobales?.[0] && (
                      <div className="mt-3 flex items-center space-x-3">
                        <span className="text-2xl font-bold text-gray-800">
                          {Number(a.resultadosGlobales[0].puntuacion).toFixed(1)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            colorClasificacion(a.resultadosGlobales[0].clasificacion) ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {a.resultadosGlobales[0].clasificacion || 'Sin clasificar'}
                        </span>
                      </div>
                    )}

                    {a.resultadosDimension && a.resultadosDimension.length > 0 && (
                      <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {a.resultadosDimension.map((rd) => (
                          <div key={rd.id} className="border border-gray-100 rounded-md p-3">
                            <div className="text-xs font-medium text-gray-600">
                              {rd.dimension?.nombre}
                            </div>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-lg font-bold text-blue-800">
                                {Number(rd.puntuacion).toFixed(2)}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${
                                  colorClasificacion(rd.clasificacion) || 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {rd.clasificacion || '—'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
