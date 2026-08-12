import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pruebasService } from '../services/api';
import type { Prueba } from '../types';

export default function Pruebas() {
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    pruebasService
      .listar()
      .then(setPruebas)
      .catch(() => setError('No se pudieron cargar las pruebas'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <p className="text-gray-500">Cargando pruebas...</p>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pruebas psicométricas</h1>
        <p className="text-gray-500">Pruebas disponibles para la evaluación de candidatos</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {pruebas.map((prueba) => (
          <div key={prueba.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800">{prueba.nombre}</h2>
            <p className="text-gray-500 text-sm mt-1">{prueba.descripcion}</p>
            <div className="mt-3 flex justify-between text-sm text-gray-400">
              <span>Versión {prueba.version}</span>
              <span>{prueba.activa ? 'Activa' : 'Inactiva'}</span>
            </div>
            <Link
              to={`/pruebas/${prueba.id}`}
              className="mt-4 inline-block text-sm bg-blue-800 text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
            >
              Ver detalle
            </Link>
          </div>
        ))}
      </div>

      {pruebas.length === 0 && !error && (
        <p className="text-gray-500">No hay pruebas registradas.</p>
      )}
    </div>
  );
}
