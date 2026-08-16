import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aplicacionesService, candidatosService, pruebasService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Aplicacion, Candidato, Prueba } from '../types';
import { mezclarArray } from '../utils/mezclar';

type Respuestas = Record<number, number>;

const LIKERT_ETIQUETAS = [
  '',
  'Muy en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Muy de acuerdo',
];

export default function AplicarPrueba() {
  const { usuario } = useAuth();
  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
  const [pruebas, setPruebas] = useState<Prueba[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [pruebaId, setPruebaId] = useState<number>(0);
  const [candidatoId, setCandidatoId] = useState<number>(0);
  const [aplicacion, setAplicacion] = useState<Aplicacion | null>(null);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const contenedoresPreguntas = useRef<(HTMLDivElement | null)[]>([]);

  const actualizarPreguntaVisible = useCallback(() => {
    const contenedores = contenedoresPreguntas.current;
    let indice = 0;
    for (let i = 0; i < contenedores.length; i++) {
      const el = contenedores[i];
      if (el && el.getBoundingClientRect().top <= 150) {
        indice = i;
      }
    }
    setPreguntaActual(indice);
  }, []);

  useEffect(() => {
    if (paso !== 2) return;
    window.addEventListener('scroll', actualizarPreguntaVisible, { passive: true });
    actualizarPreguntaVisible();
    return () => window.removeEventListener('scroll', actualizarPreguntaVisible);
  }, [paso, actualizarPreguntaVisible, aplicacion]);

  useEffect(() => {
    Promise.all([pruebasService.listar(), candidatosService.listar()])
      .then(([p, c]) => {
        setPruebas(p);
        setCandidatos(c);
      })
      .catch(() => setError('No se pudieron cargar los datos'));
  }, []);

  const preguntasPlanas = useMemo(() => {
    if (!aplicacion?.prueba?.dimensiones) return [];
    return aplicacion.prueba.dimensiones
      .flatMap((d) => d.preguntas || [])
      .map((pregunta) => ({
        ...pregunta,
        opciones:
          pregunta.tipo === 'LIKERT'
            ? pregunta.opciones
            : mezclarArray(pregunta.opciones),
      }));
  }, [aplicacion]);

  const totalPreguntas = preguntasPlanas.length;
  const respondidas = Object.keys(respuestas).length;
  const tieneLikert =
    aplicacion?.prueba?.dimensiones?.some((d) =>
      d.preguntas?.some((p) => p.tipo === 'LIKERT'),
    ) || false;

  const iniciar = async () => {
    setError('');
    if (!pruebaId || !candidatoId) {
      setError('Seleccione una prueba y un candidato');
      return;
    }
    try {
      const nueva = await aplicacionesService.crear(pruebaId, candidatoId, usuario?.id || 1);
      setAplicacion(nueva);
      setRespuestas({});
      setPaso(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo crear la aplicación');
    }
  };

  const guardarYFinalizar = async () => {
    setError('');
    setGuardando(true);
    setMensaje('');
    try {
      const payload = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
        preguntaId: Number(preguntaId),
        opcionId,
      }));
      await aplicacionesService.guardarRespuestas(aplicacion!.id, payload);
      setMensaje('Respuestas guardadas correctamente');
      setPaso(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudieron guardar las respuestas');
    } finally {
      setGuardando(false);
    }
  };

  const finalizar = async () => {
    setError('');
    setGuardando(true);
    try {
      await aplicacionesService.finalizar(aplicacion!.id);
      const actualizada = await aplicacionesService.detalle(aplicacion!.id);
      setAplicacion(actualizada);
      setPaso(4);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo finalizar la aplicación');
    } finally {
      setGuardando(false);
    }
  };

  if (paso === 1) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Aplicar prueba psicométrica</h1>
        <p className="text-gray-500 mb-6">Paso 1: Configuración de la aplicación</p>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prueba</label>
            <select
              value={pruebaId}
              onChange={(e) => setPruebaId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>— Seleccione una prueba —</option>
              {pruebas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Candidato</label>
            <select
              value={candidatoId}
              onChange={(e) => setCandidatoId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>— Seleccione un candidato —</option>
              {candidatos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido} ({c.cedula})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evaluador</label>
            <input
              value={usuario ? `${usuario.nombre} (${usuario.email})` : 'Usuario actual'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>
          <button
            onClick={iniciar}
            className="w-full py-2.5 bg-blue-800 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Iniciar aplicación
          </button>
        </div>
      </div>
    );
  }

  if (paso === 2) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          {aplicacion?.prueba?.nombre}
        </h1>
        <p className="text-gray-500 mb-4">Paso 2: Responder las preguntas</p>
        <div className="sticky top-0 z-10 mb-4 bg-white rounded-lg shadow px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-600">
              {totalPreguntas > 0 ? (
                <>
                  Pregunta <strong>{preguntaActual + 1}</strong> de{' '}
                  <strong>{totalPreguntas}</strong>
                </>
              ) : (
                'Cargando preguntas…'
              )}
            </span>
            <span className="text-sm text-gray-600">
              <strong>{respondidas}</strong>/{totalPreguntas} respondidas
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-800 h-2 rounded-full"
              style={{ width: `${totalPreguntas ? (respondidas / totalPreguntas) * 100 : 0}%` }}
            />
          </div>
        </div>

        {tieneLikert && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-xs text-blue-700">
            Escala Likert: <strong>1</strong> Muy en desacuerdo · <strong>2</strong> En
            desacuerdo · <strong>3</strong> Neutral · <strong>4</strong> De acuerdo ·{' '}
            <strong>5</strong> Muy de acuerdo
          </div>
        )}

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="space-y-6">
          {preguntasPlanas.map((pregunta, indice) => (
            <div
              key={pregunta.id}
              ref={(el) => {
                contenedoresPreguntas.current[indice] = el;
              }}
              className="bg-white rounded-lg shadow p-6"
            >
              <p className="text-sm font-medium text-gray-800 mb-3">
                {indice + 1}. {pregunta.enunciado}
              </p>
              <div className="flex flex-wrap gap-2">
                {pregunta.opciones?.map((opcion) => {
                  const etiqueta =
                    pregunta.tipo === 'LIKERT'
                      ? LIKERT_ETIQUETAS[Number(opcion.valor)] || opcion.texto
                      : opcion.texto;
                  return (
                    <button
                      key={opcion.id}
                      onClick={() =>
                        setRespuestas({ ...respuestas, [pregunta.id]: opcion.id })
                      }
                      className={`px-3 py-1.5 rounded-md text-sm border ${
                        respuestas[pregunta.id] === opcion.id
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                      }`}
                    >
                      {etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {preguntasPlanas.length === 0 && (
          <p className="text-gray-500">Esta prueba no tiene preguntas registradas.</p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={guardarYFinalizar}
            disabled={guardando || respondidas < totalPreguntas}
            className="py-2.5 px-6 bg-green-700 text-white font-medium rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar respuestas'}
          </button>
        </div>
        {respondidas < totalPreguntas && (
          <p className="text-right text-xs text-amber-600 mt-2">
            Responda todas las preguntas antes de guardar.
          </p>
        )}
      </div>
    );
  }

  if (paso === 3) {
    return (
      <div className="max-w-xl mx-auto text-center">
        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">{mensaje}</div>
        )}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Respuestas guardadas</h1>
          <p className="text-gray-500 mb-6">
            Las respuestas de <strong>{aplicacion?.prueba?.nombre}</strong> para{' '}
            <strong>
              {aplicacion?.candidato?.nombre} {aplicacion?.candidato?.apellido}
            </strong>{' '}
            se guardaron correctamente.
          </p>
          <button
            onClick={finalizar}
            disabled={guardando}
            className="py-2.5 px-6 bg-blue-800 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {guardando ? 'Calificando...' : 'Finalizar y calificar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Aplicación completada</h1>
        <p className="text-gray-500">
          {aplicacion?.prueba?.nombre} · {aplicacion?.candidato?.nombre}{' '}
          {aplicacion?.candidato?.apellido}
        </p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

      {aplicacion?.resultadosGlobales?.map((rg) => (
        <div key={rg.id} className="bg-white rounded-lg shadow p-6 mb-6 text-center">
          <h2 className="text-gray-500 text-sm uppercase">Puntuación global</h2>
          <div className="text-4xl font-bold text-gray-800 mt-2">
            {Number(rg.puntuacion).toFixed(1)}
          </div>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
              rg.clasificacion === 'Alta' || rg.clasificacion === 'Aprobado'
                ? 'bg-green-100 text-green-700'
                : rg.clasificacion === 'Media'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}
          >
            {rg.clasificacion || 'Sin clasificar'}
          </span>
          {rg.interpretacion && (
            <p className="text-gray-600 text-sm mt-3">{rg.interpretacion}</p>
          )}
        </div>
      ))}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aplicacion?.resultadosDimension?.map((rd) => (
          <div key={rd.id} className="bg-white rounded-lg shadow p-5">
            <h3 className="font-semibold text-gray-800">{rd.dimension?.nombre}</h3>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-blue-800">
                {Number(rd.puntuacion).toFixed(2)}
              </span>
              {Number(rd.porcentaje) > 0 && (
                <span className="text-sm text-gray-400">{Number(rd.porcentaje).toFixed(0)}%</span>
              )}
            </div>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {rd.clasificacion || 'Sin clasificar'}
            </span>
            {rd.interpretacion && (
              <p className="text-gray-500 text-xs mt-2">{rd.interpretacion}</p>
            )}
          </div>
        ))}
      </div>

      {aplicacion?.resultadosDimension?.length === 0 && (
        <p className="text-gray-500 text-center">No se generaron resultados por dimensión.</p>
      )}
    </div>
  );
}
