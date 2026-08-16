import { useEffect, useState, type FormEvent } from 'react';
import { bateriasService, empresasService, pruebasService } from '../services/api';
import type { Bateria, Empresa, Prueba } from '../types';

export default function Baterias() {
  const [baterias, setBaterias] = useState<Bateria[]>([]);
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    empresaId: '',
    pruebaIds: [] as number[],
  });

  const cargar = () => {
    Promise.all([bateriasService.listar(), pruebasService.listarTodas(), empresasService.listar()])
      .then(([b, p, e]) => {
        setBaterias(b);
        setPruebas(p);
        setEmpresas(e);
      })
      .catch(() => setError('No se pudieron cargar los datos'));
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm({ nombre: '', descripcion: '', empresaId: '', pruebaIds: [] });
    setMostrarFormulario(true);
    setError('');
  };

  const abrirEditar = (b: Bateria) => {
    setEditandoId(b.id);
    setForm({
      nombre: b.nombre,
      descripcion: b.descripcion || '',
      empresaId: b.empresaId ? String(b.empresaId) : '',
      pruebaIds: b.pruebas.map((p) => p.pruebaId),
    });
    setMostrarFormulario(true);
    setError('');
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    const dto = {
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      empresaId: form.empresaId ? Number(form.empresaId) : undefined,
      pruebaIds: form.pruebaIds,
    };
    try {
      if (editandoId) {
        await bateriasService.actualizar(editandoId, dto);
        setExito('Batería actualizada correctamente');
      } else {
        await bateriasService.crear(dto);
        setExito('Batería creada correctamente');
      }
      setMostrarFormulario(false);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo guardar la batería');
    }
  };

  const eliminar = async (b: Bateria) => {
    if (!window.confirm(`¿Eliminar la batería "${b.nombre}"?`)) return;
    try {
      await bateriasService.eliminar(b.id);
      setExito('Batería eliminada');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la batería');
    }
  };

  const togglePrueba = (pruebaId: number) => {
    setForm((f) => ({
      ...f,
      pruebaIds: f.pruebaIds.includes(pruebaId)
        ? f.pruebaIds.filter((id) => id !== pruebaId)
        : [...f.pruebaIds, pruebaId],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Baterías de pruebas</h1>
          <p className="text-gray-500">
            Agrupe varias pruebas en un preset. Ej: 'Perfil Guardia' = Big Five + Integridad + Aptitudes
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          + Nueva batería
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
      )}
      {exito && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{exito}</div>
      )}

      {mostrarFormulario && (
        <form onSubmit={guardar} className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editandoId ? 'Editar batería' : 'Nueva batería'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Nombre (ej: Perfil Guardia)"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            />
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empresa (opcional)</label>
              <select
                value={form.empresaId}
                onChange={(e) => setForm({ ...form, empresaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas / General</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Descripción</label>
              <input
                placeholder="Descripción de la batería"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pruebas incluidas (en orden de selección)
              </label>
              <div className="space-y-2">
                {pruebas.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.pruebaIds.includes(p.id)}
                      onChange={() => togglePrueba(p.id)}
                      className="h-4 w-4 text-green-700"
                    />
                    <span className="text-sm text-gray-800">{p.nombre}</span>
                    {p.activa ? null : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        inactiva
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              disabled={form.pruebaIds.length === 0}
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              Guardar batería
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pruebas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invitaciones</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {baterias.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  {b.nombre}
                  {b.descripcion && <div className="text-xs text-gray-400">{b.descripcion}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <div className="flex flex-wrap gap-1">
                    {b.pruebas.map((bp) => (
                      <span
                        key={bp.id}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                      >
                        {bp.prueba.nombre}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{b.empresa?.nombre || 'General'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{b._count?.invitaciones ?? 0}</td>
                <td className="px-4 py-3 text-sm">
                  {b.activa ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Activa
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      Inactiva
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <button
                    onClick={() => abrirEditar(b)}
                    className="text-blue-700 hover:underline mr-3"
                  >
                    Editar
                  </button>
                  <button onClick={() => eliminar(b)} className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {baterias.length === 0 && (
          <p className="p-4 text-gray-500 text-sm">No hay baterías creadas.</p>
        )}
      </div>
    </div>
  );
}
