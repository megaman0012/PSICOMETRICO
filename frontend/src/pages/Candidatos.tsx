import { useEffect, useState, type FormEvent, useRef } from 'react';
import { candidatosService, empresasService } from '../services/api';
import type { Candidato, Empresa } from '../types';

export default function Candidatos() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    cargoPostulado: '',
    fechaNacimiento: '',
    empresaId: '',
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
    empresasService.listar().then(setEmpresas).catch(() => {});
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
      await candidatosService.crear({
        ...form,
        empresaId: form.empresaId ? Number(form.empresaId) : undefined,
      });
      setExito('Candidato registrado correctamente');
      setForm({
        nombre: '',
        apellido: '',
        cedula: '',
        email: '',
        telefono: '',
        cargoPostulado: '',
        fechaNacimiento: '',
        empresaId: '',
      });
      setMostrarFormulario(false);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo registrar el candidato');
    }
  };

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    setSubiendo(true);
    setError('');
    setExito('');
    try {
      const resultado = await candidatosService.masivo(archivo);
      let mensaje = `Procesados: ${resultado.procesados} · Creados: ${resultado.creados} · Actualizados: ${resultado.actualizados}`;
      if (resultado.errores?.length > 0) {
        mensaje += ` · Errores: ${resultado.errores.length} (primeros: ${resultado.errores
          .slice(0, 3)
          .map((er: { fila: number; mensaje: string }) => `fila ${er.fila}: ${er.mensaje}`)
          .join('; ')})`;
      }
      setExito(mensaje);
      cargar();
    } catch (err: any) {
      setError(err?.message || 'No se pudo procesar el archivo');
    } finally {
      setSubiendo(false);
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => candidatosService.exportar().catch(() => setError('No se pudo exportar'))}
            className="bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Descargar data
          </button>
          <button
            onClick={() => candidatosService.plantilla().catch(() => setError('No se pudo descargar la plantilla'))}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-500 text-sm"
          >
            Plantilla
          </button>
          <button
            onClick={() => inputArchivo.current?.click()}
            disabled={subiendo}
            className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-600 text-sm"
          >
            {subiendo ? 'Subiendo...' : 'Subir grupo'}
          </button>
          <input ref={inputArchivo} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={subirArchivo} />
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            {mostrarFormulario ? 'Cancelar' : '+ Nuevo candidato'}
          </button>
        </div>
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={form.fechaNacimiento}
                onChange={(e) => setCampo('fechaNacimiento', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Empresa</label>
              <select
                value={form.empresaId}
                onChange={(e) => setCampo('empresaId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              >
                <option value="">Sin empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </div>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Edad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
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
                  <td className="px-4 py-3 text-sm text-gray-600">{c.edad ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.empresa?.nombre || '—'}</td>
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
