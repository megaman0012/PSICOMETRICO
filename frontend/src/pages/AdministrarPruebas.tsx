import { useEffect, useState } from 'react';
import { pruebasService } from '../services/api';
import type { CrearPruebaDto, Prueba } from '../types';

type TipoAgregacion = 'SUMA' | 'PROMEDIO';
type TipoPregunta = 'LIKERT' | 'OPCION_MULTIPLE';

interface FormOpcion {
  texto: string;
  valor: number;
  esCorrecta: boolean;
}

interface FormPregunta {
  enunciado: string;
  tipo: TipoPregunta;
  orden: number;
  opciones: FormOpcion[];
}

interface FormUmbral {
  nombre: string;
  descripcion: string;
  puntuacionMinima: number;
  puntuacionMaxima: number;
  interpretacion: string;
}

interface FormDimension {
  nombre: string;
  descripcion: string;
  orden: number;
  tipoAgregacion: TipoAgregacion;
  preguntas: FormPregunta[];
  umbrales: FormUmbral[];
}

interface FormPrueba {
  nombre: string;
  descripcion: string;
  version: string;
  activa: boolean;
  dimensiones: FormDimension[];
  umbrales: FormUmbral[];
}

const inputClase =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500';
const etiquetaClase = 'block text-sm font-medium text-gray-700 mb-1';

const nuevaOpcion = (): FormOpcion => ({ texto: '', valor: 0, esCorrecta: false });
const nuevaPregunta = (): FormPregunta => ({
  enunciado: '',
  tipo: 'LIKERT',
  orden: 0,
  opciones: [],
});
const nuevoUmbral = (): FormUmbral => ({
  nombre: '',
  descripcion: '',
  puntuacionMinima: 0,
  puntuacionMaxima: 100,
  interpretacion: '',
});
const nuevaDimension = (): FormDimension => ({
  nombre: '',
  descripcion: '',
  orden: 0,
  tipoAgregacion: 'SUMA',
  preguntas: [],
  umbrales: [],
});
const formVacio = (): FormPrueba => ({
  nombre: '',
  descripcion: '',
  version: '1.0',
  activa: true,
  dimensiones: [],
  umbrales: [],
});

function pruebaToForm(p: Prueba): FormPrueba {
  return {
    nombre: p.nombre,
    descripcion: p.descripcion || '',
    version: p.version,
    activa: p.activa,
    umbrales: (p.umbrales || [])
      .filter((u) => !u.dimensionId)
      .map((u) => ({
        nombre: u.nombre,
        descripcion: u.descripcion || '',
        puntuacionMinima: Number(u.puntuacionMinima),
        puntuacionMaxima: Number(u.puntuacionMaxima),
        interpretacion: u.interpretacion,
      })),
    dimensiones: (p.dimensiones || []).map((d) => ({
      nombre: d.nombre,
      descripcion: d.descripcion || '',
      orden: d.orden,
      tipoAgregacion: d.tipoAgregacion === 'PROMEDIO' ? 'PROMEDIO' : 'SUMA',
      umbrales: (d.umbrales || []).map((u) => ({
        nombre: u.nombre,
        descripcion: u.descripcion || '',
        puntuacionMinima: Number(u.puntuacionMinima),
        puntuacionMaxima: Number(u.puntuacionMaxima),
        interpretacion: u.interpretacion,
      })),
      preguntas: (d.preguntas || []).map((preg) => ({
        enunciado: preg.enunciado,
        tipo: preg.tipo === 'OPCION_MULTIPLE' ? 'OPCION_MULTIPLE' : 'LIKERT',
        orden: preg.orden,
        opciones: preg.opciones.map((o) => ({
          texto: o.texto,
          valor: Number(o.valor),
          esCorrecta: o.esCorrecta,
        })),
      })),
    })),
  };
}

function UmbralesEditor({
  titulo,
  umbrales,
  onChange,
  onAdd,
  onRemove,
}: {
  titulo: string;
  umbrales: FormUmbral[];
  onChange: (i: number, u: FormUmbral) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">{titulo}</h4>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md hover:bg-blue-200"
        >
          + Agregar umbral
        </button>
      </div>
      {umbrales.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">Sin umbrales definidos.</p>
      )}
      <div className="space-y-2 mt-2">
        {umbrales.map((u, i) => (
          <div key={i} className="border border-gray-200 rounded-md p-3 space-y-2">
            <div className="flex gap-2">
              <input
                className={inputClase}
                placeholder="Nombre (ej: Alta)"
                value={u.nombre}
                onChange={(e) => onChange(i, { ...u, nombre: e.target.value })}
              />
              <input
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                type="number"
                placeholder="Mínimo"
                value={u.puntuacionMinima}
                onChange={(e) => onChange(i, { ...u, puntuacionMinima: Number(e.target.value) })}
              />
              <input
                className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
                type="number"
                placeholder="Máximo"
                value={u.puntuacionMaxima}
                onChange={(e) => onChange(i, { ...u, puntuacionMaxima: Number(e.target.value) })}
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-red-600 hover:text-red-800 text-sm px-2"
                title="Quitar umbral"
              >
                ✕
              </button>
            </div>
            <input
              className={inputClase}
              placeholder="Interpretación (ej: Nivel alto en este factor)"
              value={u.interpretacion}
              onChange={(e) => onChange(i, { ...u, interpretacion: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function DimensionEditor({
  index,
  dim,
  onChange,
  onRemove,
}: {
  index: number;
  dim: FormDimension;
  onChange: (nueva: FormDimension) => void;
  onRemove: () => void;
}) {
  const setPregunta = (pi: number, p: FormPregunta) =>
    onChange({ ...dim, preguntas: dim.preguntas.map((x, i) => (i === pi ? p : x)) });

  const setOpcion = (pi: number, oi: number, o: FormOpcion) =>
    setPregunta(pi, {
      ...dim.preguntas[pi],
      opciones: dim.preguntas[pi].opciones.map((x, i) => (i === oi ? o : x)),
    });

  const setUmbral = (ui: number, u: FormUmbral) =>
    onChange({ ...dim, umbrales: dim.umbrales.map((x, i) => (i === ui ? u : x)) });

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder={`Nombre de la dimensión ${index + 1}`}
          value={dim.nombre}
          onChange={(e) => onChange({ ...dim, nombre: e.target.value })}
        />
        <input
          className="w-16 px-3 py-2 border border-gray-300 rounded-md text-sm"
          type="number"
          placeholder="Orden"
          value={dim.orden}
          onChange={(e) => onChange({ ...dim, orden: Number(e.target.value) })}
        />
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
          value={dim.tipoAgregacion}
          onChange={(e) =>
            onChange({ ...dim, tipoAgregacion: e.target.value as TipoAgregacion })
          }
        >
          <option value="SUMA">Suma</option>
          <option value="PROMEDIO">Promedio (Likert)</option>
        </select>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 text-sm px-2"
          title="Eliminar dimensión"
        >
          Eliminar
        </button>
      </div>
      <input
        className={`${inputClase} mt-2`}
        placeholder="Descripción de la dimensión"
        value={dim.descripcion}
        onChange={(e) => onChange({ ...dim, descripcion: e.target.value })}
      />

      <UmbralesEditor
        titulo="Umbrales de la dimensión"
        umbrales={dim.umbrales}
        onChange={setUmbral}
        onAdd={() => onChange({ ...dim, umbrales: [...dim.umbrales, nuevoUmbral()] })}
        onRemove={(i) =>
          onChange({ ...dim, umbrales: dim.umbrales.filter((_, x) => x !== i) })
        }
      />

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">
            Preguntas ({dim.preguntas.length})
          </h4>
          <button
            type="button"
            onClick={() => onChange({ ...dim, preguntas: [...dim.preguntas, nuevaPregunta()] })}
            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-md hover:bg-blue-200"
          >
            + Agregar pregunta
          </button>
        </div>
        {dim.preguntas.length === 0 && (
          <p className="text-xs text-gray-400 mt-1">Sin preguntas en esta dimensión.</p>
        )}
        <div className="space-y-3 mt-2">
          {dim.preguntas.map((p, pi) => (
            <div key={pi} className="border border-gray-200 rounded-md p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder={`Pregunta ${pi + 1}`}
                  value={p.enunciado}
                  onChange={(e) => setPregunta(pi, { ...p, enunciado: e.target.value })}
                />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                  value={p.tipo}
                  onChange={(e) => setPregunta(pi, { ...p, tipo: e.target.value as TipoPregunta })}
                >
                  <option value="LIKERT">Likert (1-5)</option>
                  <option value="OPCION_MULTIPLE">Opción múltiple</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    onChange({ ...dim, preguntas: dim.preguntas.filter((_, x) => x !== pi) })
                  }
                  className="text-red-600 hover:text-red-800 text-sm px-2"
                  title="Eliminar pregunta"
                >
                  ✕
                </button>
              </div>

              {p.tipo === 'LIKERT' && p.opciones.length !== 5 && (
                <button
                  type="button"
                  onClick={() =>
                    setPregunta(pi, {
                      ...p,
                      opciones: [1, 2, 3, 4, 5].map((v) => ({
                        texto: String(v),
                        valor: v,
                        esCorrecta: false,
                      })),
                    })
                  }
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-100"
                >
                  Generar opciones Likert (1-5)
                </button>
              )}

              <div className="space-y-2">
                {p.opciones.map((o, oi) => (
                  <div key={oi} className="flex gap-2 items-center">
                    <input
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder={`Opción ${oi + 1}`}
                      value={o.texto}
                      onChange={(e) => setOpcion(pi, oi, { ...o, texto: e.target.value })}
                    />
                    <input
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      type="number"
                      placeholder="Valor"
                      value={o.valor}
                      onChange={(e) => setOpcion(pi, oi, { ...o, valor: Number(e.target.value) })}
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={o.esCorrecta}
                        onChange={(e) => setOpcion(pi, oi, { ...o, esCorrecta: e.target.checked })}
                      />
                      Correcta
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPregunta(pi, {
                          ...p,
                          opciones: p.opciones.filter((_, x) => x !== oi),
                        })
                      }
                      className="text-red-600 hover:text-red-800 text-sm px-1"
                      title="Quitar opción"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPregunta(pi, { ...p, opciones: [...p.opciones, nuevaOpcion()] })}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200"
                >
                  + Agregar opción
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdministrarPruebas() {
  const [vista, setVista] = useState<'lista' | 'editor'>('lista');
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [aplicacionesEditando, setAplicacionesEditando] = useState(0);
  const [form, setForm] = useState<FormPrueba>(formVacio);

  const cargar = async () => {
    setCargando(true);
    try {
      setPruebas(await pruebasService.listarTodas());
    } catch {
      setError('No se pudieron cargar las pruebas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNueva = () => {
    setEditandoId(null);
    setAplicacionesEditando(0);
    setForm(formVacio());
    setError('');
    setMensaje('');
    setVista('editor');
  };

  const abrirEditar = async (prueba: Prueba) => {
    setError('');
    setMensaje('');
    setEditandoId(prueba.id);
    setAplicacionesEditando(prueba._count?.aplicaciones || 0);
    setVista('editor');
    setCargandoDetalle(true);
    try {
      const detalle = await pruebasService.detalle(prueba.id);
      setForm(pruebaToForm(detalle));
    } catch {
      setError('No se pudo cargar el detalle de la prueba');
      setVista('lista');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const alternarEstado = async (p: Prueba) => {
    setError('');
    setMensaje('');
    try {
      await pruebasService.cambiarEstado(p.id, !p.activa);
      setMensaje(`Prueba "${p.nombre}" ${p.activa ? 'desactivada' : 'activada'} correctamente`);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo cambiar el estado de la prueba');
    }
  };

  const eliminar = async (p: Prueba) => {
    if (!window.confirm(`¿Eliminar la prueba "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError('');
    setMensaje('');
    try {
      await pruebasService.eliminar(p.id);
      setMensaje(`Prueba "${p.nombre}" eliminada correctamente`);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo eliminar la prueba');
    }
  };

  const guardar = async () => {
    setError('');
    if (!form.nombre.trim()) {
      setError('El nombre de la prueba es obligatorio');
      return;
    }
    setGuardando(true);
    try {
      const dto: CrearPruebaDto = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        version: form.version.trim() || '1.0',
        activa: form.activa,
        umbrales: form.umbrales.filter((u) => u.nombre.trim() !== ''),
        dimensiones: form.dimensiones.map((d) => ({
          nombre: d.nombre,
          descripcion: d.descripcion.trim() || undefined,
          orden: d.orden,
          tipoAgregacion: d.tipoAgregacion,
          umbrales: d.umbrales.filter((u) => u.nombre.trim() !== ''),
          preguntas: d.preguntas.map((p) => ({
            enunciado: p.enunciado,
            tipo: p.tipo,
            orden: p.orden,
            opciones: p.opciones.filter((o) => o.texto.trim() !== ''),
          })),
        })),
      };

      if (editandoId) {
        await pruebasService.actualizar(editandoId, dto);
        setMensaje('Prueba actualizada correctamente');
      } else {
        await pruebasService.crear(dto);
        setMensaje('Prueba creada correctamente');
      }
      setVista('lista');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo guardar la prueba');
    } finally {
      setGuardando(false);
    }
  };

  if (vista === 'lista') {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Administración de pruebas</h1>
            <p className="text-gray-500">
              Crear, editar, activar o desactivar las pruebas psicométricas
            </p>
          </div>
          <button
            onClick={abrirNueva}
            className="px-4 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            + Nueva prueba
          </button>
        </div>

        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{mensaje}</div>
        )}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        {cargando ? (
          <p className="text-gray-500">Cargando pruebas...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Prueba</th>
                  <th className="px-4 py-3">Dimensiones</th>
                  <th className="px-4 py-3">Aplicaciones</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pruebas.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{p.nombre}</div>
                      <div className="text-xs text-gray-400">v{p.version}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p._count?.dimensiones ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">{p._count?.aplicaciones ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.activa
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {p.activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => abrirEditar(p)}
                        className="text-sm bg-blue-800 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarEstado(p)}
                        className={`text-sm px-3 py-1 rounded-md ${
                          p.activa
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {p.activa ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => eliminar(p)}
                        className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pruebas.length === 0 && <p className="p-6 text-gray-500">No hay pruebas registradas.</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setVista('lista')}
          className="text-sm text-blue-700 hover:underline"
        >
          ← Volver al listado
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">
          {editandoId ? `Editar: ${form.nombre || 'Prueba'}` : 'Nueva prueba'}
        </h1>
      </div>

      {mensaje && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{mensaje}</div>
      )}
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      {aplicacionesEditando > 0 && (
        <div className="mb-4 p-3 bg-amber-100 text-amber-800 rounded-md text-sm">
          Esta prueba tiene <strong>{aplicacionesEditando}</strong> aplicación(es) registrada(s).
          Al guardar los cambios, la estructura (preguntas, opciones y umbrales) se reconstruirá y se
          perderán las respuestas y resultados asociados. Considere desactivarla en lugar de editarla.
        </div>
      )}

      {cargandoDetalle ? (
        <p className="text-gray-500">Cargando detalle de la prueba...</p>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de la prueba</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={etiquetaClase}>Nombre *</label>
                <input
                  className={inputClase}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className={etiquetaClase}>Versión</label>
                <input
                  className={inputClase}
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className={etiquetaClase}>Descripción</label>
              <textarea
                className={inputClase}
                rows={2}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.activa}
                onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              />
              Prueba activa (disponible para aplicación)
            </label>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Umbrales globales</h3>
            <p className="text-gray-500 text-sm mb-2">
              Clasificación global de la prueba (escala normalizada 0-100)
            </p>
            <UmbralesEditor
              titulo="Umbrales"
              umbrales={form.umbrales}
              onChange={(i, u) =>
                setForm((f) => ({
                  ...f,
                  umbrales: f.umbrales.map((x, idx) => (idx === i ? u : x)),
                }))
              }
              onAdd={() => setForm((f) => ({ ...f, umbrales: [...f.umbrales, nuevoUmbral()] }))}
              onRemove={(i) =>
                setForm((f) => ({ ...f, umbrales: f.umbrales.filter((_, idx) => idx !== i) }))
              }
            />
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Dimensiones</h3>
              <button
                onClick={() =>
                  setForm((f) => ({ ...f, dimensiones: [...f.dimensiones, nuevaDimension()] }))
                }
                className="px-3 py-2 bg-blue-800 text-white rounded-md hover:bg-blue-700"
              >
                + Agregar dimensión
              </button>
            </div>
            <div className="space-y-6">
              {form.dimensiones.map((d, i) => (
                <DimensionEditor
                  key={i}
                  index={i}
                  dim={d}
                  onChange={(nueva) =>
                    setForm((f) => ({
                      ...f,
                      dimensiones: f.dimensiones.map((x, idx) => (idx === i ? nueva : x)),
                    }))
                  }
                  onRemove={() =>
                    setForm((f) => ({
                      ...f,
                      dimensiones: f.dimensiones.filter((_, idx) => idx !== i),
                    }))
                  }
                />
              ))}
            </div>
            {form.dimensiones.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">
                Sin dimensiones. Agregue al menos una dimensión para incluir preguntas.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setVista('lista')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={guardando}
              className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear prueba'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
