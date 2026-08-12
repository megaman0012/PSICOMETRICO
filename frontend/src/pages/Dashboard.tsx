import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { aplicacionesService, candidatosService, pruebasService } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Stats {
  pruebas: number;
  candidatos: number;
  aplicaciones: number;
  completadas: number;
  pendientes: number;
}

export default function Dashboard() {
  const { usuario } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recientes, setRecientes] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([pruebasService.listar(), candidatosService.listar(), aplicacionesService.listar()])
      .then(([pruebas, candidatos, aplicaciones]) => {
        setStats({
          pruebas: pruebas.length,
          candidatos: candidatos.length,
          aplicaciones: aplicaciones.length,
          completadas: aplicaciones.filter((a) => a.completada).length,
          pendientes: aplicaciones.filter((a) => !a.completada).length,
        });
        setRecientes(aplicaciones.slice(0, 5));
      })
      .catch(() => setError('No se pudieron cargar las estadísticas'));
  }, []);

  const cards = [
    { label: 'Pruebas activas', valor: stats?.pruebas, color: 'bg-blue-800' },
    { label: 'Candidatos', valor: stats?.candidatos, color: 'bg-green-700' },
    { label: 'Aplicaciones totales', valor: stats?.aplicaciones, color: 'bg-purple-700' },
    { label: 'Completadas', valor: stats?.completadas, color: 'bg-teal-700' },
    { label: 'Pendientes', valor: stats?.pendientes, color: 'bg-amber-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {usuario?.nombre}
        </h1>
        <p className="text-gray-500">Resumen general del sistema</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className={`${card.color} text-white rounded-lg shadow p-4`}>
            <div className="text-3xl font-bold">{card.valor ?? '—'}</div>
            <div className="text-sm mt-1 opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Aplicaciones recientes</h2>
          {recientes.length === 0 ? (
            <p className="text-gray-500 text-sm">Aún no hay aplicaciones registradas.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recientes.map((a) => (
                <li key={a.id} className="py-2 flex justify-between">
                  <div>
                    <span className="font-medium">{a.prueba?.nombre}</span>
                    <span className="text-gray-500 text-sm ml-2">
                      {a.candidato?.nombre} {a.candidato?.apellido}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      a.completada ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {a.completada ? 'Completada' : 'Pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones rápidas</h2>
          <div className="space-y-3">
            <Link
              to="/aplicar"
              className="block w-full text-center py-2.5 bg-blue-800 text-white rounded-md hover:bg-blue-700"
            >
              Aplicar una nueva prueba
            </Link>
            <Link
              to="/candidatos"
              className="block w-full text-center py-2.5 bg-green-700 text-white rounded-md hover:bg-green-600"
            >
              Registrar candidato
            </Link>
            <Link
              to="/pruebas"
              className="block w-full text-center py-2.5 bg-purple-700 text-white rounded-md hover:bg-purple-600"
            >
              Ver pruebas disponibles
            </Link>
            <Link
              to="/resultados"
              className="block w-full text-center py-2.5 bg-teal-700 text-white rounded-md hover:bg-teal-600"
            >
              Ver resultados
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
