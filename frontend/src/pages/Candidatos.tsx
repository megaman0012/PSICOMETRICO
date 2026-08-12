import { useEffect, useState, type FormEvent } from 'react';
import { candidatosService } from '../services/api';
import type { Candidato } from '../types';

export default function Candidatos() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(true);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    cargoPostulado: '',
  });

  const cargar = () => {
    candidatosService
      .listar()
      .then(setCandidatos)
      .catch(() => setError('No se pudieron cargar los candidatos'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const buscar = async () => {
    if (!busqueda.trim()) {
      cargar();
      return;
    }
    try {
      const candidato = await candidatosService.buscarPorCedula(busqueda.trim());
      setCandidatos(candidato ? [candidato] : []);
      setError('');
    } catch {
      setCandidatos([]);
      setError('No se encontró un candidato con esa cédula');
    }
  };

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    try {
      await candidatosService.crear(form);
      setExito('Candidato registrado correctamente');
      setForm({ nombre: '', apellido: '', cedula: '', email: '', telefono: '', cargoPostulado: '' });
      setMostrarFormulario(false);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo registrar el candidato');
    }
  };

  const setCampo = (campo: string, valor: string) => setForm({ ...form, [campo]: valor });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Candidatos</h1>
          <p className="text-gray-500">Registro de aspirantes a guardia de seguridad</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo candidato'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}
      {exito && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{exito}</div>
      )}

      {mostrarFormulario && (
        <form onSubmit={crear} className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Registrar candidato</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setCampo('nombre', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              required
              placeholder="Apellido"
              value={form.apellido}
              onChange={(e) => setCampo('apellido', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              required
              placeholder="Cédula"
              value={form.cedula}
              onChange={(e) => setCampo('cedula', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              required
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={(e) => setCampo('email', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Teléfono"
              value={form.telefono}
              onChange={(e) => setCampo('telefono', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <input
              placeholder="Cargo postulado"
              value={form.cargoPostulado}
              onChange={(e) => setCampo('cargoPostulado', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Guardar candidato
          </button>
        </form>
      )}

      <div className="flex items-center space-x-2 mb-4">
        <input
          placeholder="Buscar por cédula"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={buscar}
          className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Buscar
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidatos.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {c.nombre} {c.apellido}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.cedula}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.telefono || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.cargoPostulado || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {candidatos.length === 0 && (
            <p className="p-4 text-gray-500 text-sm">No se encontraron candidatos.</p>
          )}
        </div>
      )}
    </div>
  );
}
