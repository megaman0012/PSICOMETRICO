import { useEffect, useState } from 'react';
import { aplicacionesService, reportesService } from '../services/api';
import type { Aplicacion } from '../types';
import type { ResumenReporte } from '../services/api';

const coloresClasificacion: Record<string, string> = {
  Alta: 'bg-green-100 text-green-700',
  Aprobado: 'bg-green-100 text-green-700',
  'Muy Apto': 'bg-green-100 text-green-700',
  Media: 'bg-amber-100 text-amber-700',
  Apto: 'bg-amber-100 text-amber-700',
  Baja: 'bg-red-100 text-red-700',
  'No Apto': 'bg-red-100 text-red-700',
};

export default function Reportes() {
  const [resumen, setResumen] = useState<ResumenReporte | null>(null);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState('');
  const [error, setError] = useState('');

  const cargar = () => {
    setCargando(true);
    Promise.all([reportesService.resumen(), aplicacionesService.listar()])
      .then(([r, a]) => {
        setResumen(r);
        setAplicaciones(a);
        setError('');
      })
      .catch(() => setError('No se pudieron cargar los reportes'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const descargar = async (tipo: string, accion: () => Promise<void>) => {
    setError('');
    setDescargando(tipo);
    try {
      await accion();
    } catch {
      setError('No se pudo descargar el archivo');
    } finally {
      setDescargando('');
    }
  };

  const cards = [
    { label: 'Candidatos', valor: resumen?.totalCandidatos, color: 'bg-blue-800' },
    { label: 'Aplicaciones', valor: resumen?.totalAplicaciones, color: 'bg-purple-700' },
    { label: 'Completadas', valor: resumen?.completadas, color: 'bg-green-700' },
    { label: 'Pendientes', valor: resumen?.pendientes, color: 'bg-amber-600' },
    { label: 'Promedio global', valor: resumen?.promedioGlobal?.toFixed(1), color: 'bg-teal-700' },
  ];

  const clasificaciones = Object.entries(resumen?.porClasificacion || {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-500">Resumen estadístico y exportación de datos</p>
        </div>
        <button
          onClick={() => descargar('aplicaciones', reportesService.descargarAplicaciones)}
          disabled={descargando === 'aplicaciones'}
          className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {descargando === 'aplicaciones' ? 'Descargando...' : 'Exportar CSV (todas las aplicaciones)'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {cards.map((card) => (
              <div key={card.label} className={`${card.color} text-white rounded-lg shadow p-4`}>
                <div className="text-3xl font-bold">{card.valor ?? '—'}</div>
                <div className="text-sm mt-1 opacity-90">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Distribución por clasificación
              </h2>
              {clasificaciones.length === 0 ? (
                <p className="text-gray-500 text-sm">Aún no hay resultados clasificados.</p>
              ) : (
                <ul className="space-y-3">
                  {clasificaciones.map(([clave, cantidad]) => (
                    <li key={clave} className="flex items-center justify-between">
                      <span
                        className={`text-sm px-2 py-1 rounded-full ${
                          coloresClasificacion[clave] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {clave}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{cantidad}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="md:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Exportar por aplicación</h2>
              </div>
              {aplicaciones.length === 0 ? (
                <p className="p-6 text-gray-500 text-sm">No hay aplicaciones registradas.</p>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                  {aplicaciones.map((a) => (
                    <li key={a.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {a.candidato?.nombre} {a.candidato?.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          {a.prueba?.nombre} · Intento {a.numeroIntento} ·{' '}
                          {a.resultadosGlobales?.[0]?.clasificacion || 'Sin calificar'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            descargar(String(a.id), () => reportesService.descargarAplicacion(a.id))
                          }
                          disabled={descargando === String(a.id)}
                          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md disabled:opacity-50"
                        >
                          {descargando === String(a.id) ? 'Descargando...' : 'CSV'}
                        </button>
                        <button
                          onClick={() =>
                            descargar(
                              `pdf-${a.id}`,
                              () => reportesService.descargarAplicacionPdf(a.id),
                            )
                          }
                          disabled={descargando === `pdf-${a.id}`}
                          className="text-sm bg-blue-800 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
                        >
                          {descargando === `pdf-${a.id}` ? 'Descargando...' : 'PDF'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
