import { useEffect, useState, type FormEvent } from 'react';
import { bateriasService, candidatosService, invitacionesService } from '../services/api';
import type { Bateria, Candidato, Invitacion } from '../types';

const ESTADO_ESTILOS: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  COMPLETADA: 'bg-green-100 text-green-700',
  EXPIRADA: 'bg-gray-200 text-gray-600',
  REVOCADA: 'bg-red-100 text-red-700',
};

export default function Invitaciones() {
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [baterias, setBaterias] = useState<Bateria[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [form, setForm] = useState({
    candidatoId: '',
    bateriaId: '',
    horas: '72',
    enviarCorreo: false,
  });

  const [nuevaInvitacion, setNuevaInvitacion] = useState<Invitacion | null>(null);

  const cargar = () => {
    Promise.all([
      invitacionesService.listar(),
      candidatosService.listar(),
      bateriasService.listarActivas(),
    ])
      .then(([i, c, b]) => {
        setInvitaciones(i);
        setCandidatos(c);
        setBaterias(b);
      })
      .catch(() => setError('No se pudieron cargar los datos'));
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setError('');
    setExito('');
    setNuevaInvitacion(null);
    try {
      const inv = await invitacionesService.crear({
        candidatoId: Number(form.candidatoId),
        bateriaId: Number(form.bateriaId),
        horasExpiracion: Number(form.horas),
        enviarCorreo: form.enviarCorreo,
      });
      setNuevaInvitacion(inv);
      setMostrarFormulario(false);
      setExito('Invitación creada correctamente');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear la invitación');
    } finally {
      setCreando(false);
    }
  };

  const copiar = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setExito('Enlace copiado al portapapeles');
    } catch {
      setError('No se pudo copiar el enlace');
    }
  };

  const reintentar = async (id: number) => {
    setError('');
    setExito('');
    try {
      await invitacionesService.reintentar(id);
      setExito('Invitación renovada. El enlace se puede volver a usar.');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo renovar la invitación');
    }
  };

  const cancelar = async (inv: Invitacion) => {
    if (!window.confirm('¿Cancelar (revocar) esta invitación?')) return;
    setError('');
    setExito('');
    try {
      await invitacionesService.cancelar(inv.id);
      setExito('Invitación revocada');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo revocar la invitación');
    }
  };

  const formatearFecha = (f: string) => new Date(f).toLocaleDateString('es-ES');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invitaciones a exámenes</h1>
          <p className="text-gray-500">
            Envíe un enlace a un candidato para que rinda su batería en línea
          </p>
        </div>
        <button
          onClick={() => {
            setForm({ candidatoId: '', bateriaId: '', horas: '72', enviarCorreo: false });
            setMostrarFormulario(true);
            setNuevaInvitacion(null);
          }}
          className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          + Nueva invitación
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      {exito && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{exito}</div>}

      {nuevaInvitacion && (
        <div className="mb-6 bg-green-50 border border-green-300 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">
            Invitación lista. Comparta este enlace con el candidato:
          </p>
          <div className="flex items-center space-x-2">
            <code className="flex-1 text-xs bg-white border border-green-300 rounded px-3 py-2 break-all">
              {nuevaInvitacion.link}
            </code>
            <button
              onClick={() => copiar(nuevaInvitacion.link || '')}
              className="bg-green-700 text-white px-3 py-2 rounded-md text-sm hover:bg-green-600"
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <form onSubmit={crear} className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Nueva invitación</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Candidato</label>
              <select
                required
                value={form.candidatoId}
                onChange={(e) => setForm({ ...form, candidatoId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un candidato</option>
                {candidatos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido} - {c.cedula}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Batería de pruebas</label>
              <select
                required
                value={form.bateriaId}
                onChange={(e) => setForm({ ...form, bateriaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione una batería</option>
                {baterias.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.pruebas.length} pruebas)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Expira en (horas)</label>
              <input
                type="number"
                min={1}
                value={form.horas}
                onChange={(e) => setForm({ ...form, horas: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-end pb-2 space-x-2">
              <input
                type="checkbox"
                checked={form.enviarCorreo}
                onChange={(e) => setForm({ ...form, enviarCorreo: e.target.checked })}
                className="h-4 w-4 text-blue-700"
              />
              <span className="text-sm text-gray-700">
                Enviar el enlace por correo al candidato
              </span>
            </label>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              disabled={creando || !form.candidatoId || !form.bateriaId}
              className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {creando ? 'Creando...' : 'Crear invitación'}
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Candidato
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Batería
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Expira
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Avance
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invitaciones.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  {inv.candidato?.nombre} {inv.candidato?.apellido}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{inv.bateria?.nombre}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ESTADO_ESTILOS[inv.estado] || 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {inv.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {inv.estado === 'EXPIRADA'
                    ? 'Expirada'
                    : formatearFecha(inv.fechaExpiracion)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {inv.aplicaciones ? (
                    `${inv.aplicaciones.filter((a) => a.completada).length}/${
                      inv.aplicaciones.length
                    } pruebas`
                  ) : (
                    <span className="text-xs text-gray-400">Sin iniciar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                  {(inv.estado === 'PENDIENTE' || inv.estado === 'EXPIRADA') && (
                    <button
                      onClick={() => reintentar(inv.id)}
                      className="text-blue-700 hover:underline mr-3"
                    >
                      Reintentar
                    </button>
                  )}
                  {inv.estado === 'PENDIENTE' && (
                    <button onClick={() => cancelar(inv)} className="text-red-600 hover:underline">
                      Revocar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invitaciones.length === 0 && (
          <p className="p-4 text-gray-500 text-sm">No hay invitaciones todavía.</p>
        )}
      </div>
    </div>
  );
}
