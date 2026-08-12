import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pruebasService } from '../services/api';
import type { Prueba } from '../types';

export default function PruebaDetalle() {
  const { id } = useParams();
  const [prueba, setPrueba] = useState<Prueba | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    pruebasService
      .detalle(Number(id))
      .then(setPrueba)
      .catch(() => setError('No se pudo cargar el detalle de la prueba'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="text-gray-500">Cargando detalle...</p>;
  if (error) return <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>;
  if (!prueba) return <p className="text-gray-500">Prueba no encontrada.</p>;

  const totalPreguntas = prueba.dimensiones?.reduce(
    (acc, d) => acc + (d.preguntas?.length || 0),
    0,
  );

  return (
    <div>
      <Link to="/pruebas" className="text-sm text-blue-700 hover:underline">
        ← Volver a pruebas
      </Link>
      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{prueba.nombre}</h1>
        <p className="text-gray-500 mt-1">{prueba.descripcion}</p>
        <div className="mt-2 text-sm text-gray-400">
          Versión {prueba.version} · {prueba.dimensiones?.length || 0} dimensiones ·{' '}
          {totalPreguntas ?? 0} preguntas
        </div>
      </div>

      <div className="space-y-6">
        {prueba.dimensiones?.map((dimension) => (
          <div key={dimension.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">{dimension.nombre}</h2>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {dimension.tipoAgregacion}
              </span>
            </div>
            {dimension.descripcion && (
              <p className="text-gray-500 text-sm mt-1">{dimension.descripcion}</p>
            )}
            <ul className="mt-4 divide-y divide-gray-100">
              {dimension.preguntas?.map((pregunta, idx) => (
                <li key={pregunta.id} className="py-2 text-sm">
                  <span className="text-gray-400 mr-2">{idx + 1}.</span>
                  {pregunta.enunciado}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {prueba.dimensiones?.length === 0 && (
        <p className="text-gray-500">Esta prueba no tiene dimensiones registradas.</p>
      )}
    </div>
  );
}
