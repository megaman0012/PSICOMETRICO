import { useEffect, useState, type FormEvent } from 'react';
import { usuariosService } from '../services/api';
import type { Usuario } from '../types';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [form, setForm] = useState({ email: '', password: '', nombre: '', rol: 'EVALUADOR' });

  const cargar = () => {
    usuariosService
      .listar()
      .then(setUsuarios)
      .catch(() => setError('No se pudieron cargar los usuarios (¿permisos de administrador?)'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    try {
      await usuariosService.crear(form);
      setExito('Usuario creado correctamente');
      setForm({ email: '', password: '', nombre: '', rol: 'EVALUADOR' });
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear el usuario');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios del sistema</h1>
        <p className="text-gray-500">Administración de usuarios (solo administradores)</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      {exito && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{exito}</div>}

      <form onSubmit={crear} className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Crear usuario</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            required
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <input
            required
            type="password"
            placeholder="Contraseña (mín. 8, mayúscula, número y símbolo)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="EVALUADOR">EVALUADOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Crear usuario
        </button>
      </form>

      {cargando ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.rol === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(u.fechaCreacion).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && (
            <p className="p-4 text-gray-500 text-sm">No hay usuarios registrados.</p>
          )}
        </div>
      )}
    </div>
  );
}
