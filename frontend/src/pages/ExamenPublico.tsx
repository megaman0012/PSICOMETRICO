import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { examenPublicoService } from '../services/api';
import type { ExamenPublico, PreguntaExamen, PruebaExamen } from '../types';
import { mezclarArray } from '../utils/mezclar';

const LIKERT_ETIQUETAS = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutro',
  'De acuerdo',
  'Totalmente de acuerdo',
];

type Respuesta = { aplicacionId: number; preguntaId: number; opcionId: number };

export default function ExamenPublico() {
  const { token = '' } = useParams();
  const [examen, setExamen] = useState<ExamenPublico | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pruebaActual, setPruebaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    examenPublicoService
      .obtener(token)
      .then((e) => {
        setExamen(e);
        const iniciales: Respuesta[] = [];
        for (const p of e.pruebas) {
          if (p.aplicacionId) {
            for (const q of p.preguntas) iniciales.push({ aplicacionId: p.aplicacionId, preguntaId: q.id, opcionId: 0 });
          }
        }
        setRespuestas(iniciales);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'El enlace de examen no es válido o ya expiró');
      })
      .finally(() => setCargando(false));
  }, [token]);

  const prueba = examen?.pruebas[pruebaActual] as PruebaExamen | undefined;

  const opcionesMezcladas = useMemo(() => {
    if (!prueba) return null;
    const mapa = new Map<number, { id: number; texto: string }[]>();
    for (const pregunta of prueba.preguntas) {
      mapa.set(pregunta.id, mezclarArray(pregunta.opciones));
    }
    return mapa;
  }, [prueba]);

  const responder = (aplicacionId: number, preguntaId: number, opcionId: number) => {
    setRespuestas((prev) =>
      prev.map((r) => (r.preguntaId === preguntaId ? { ...r, opcionId, aplicacionId } : r))
    );
  };

  const respuestaDe = (preguntaId: number) =>
    respuestas.find((r) => r.preguntaId === preguntaId)?.opcionId || 0;

  const guardar = async () => {
    if (!examen) return;
    await examenPublicoService.guardarRespuestas(
      token,
      respuestas.filter((r) => r.opcionId !== 0)
    );
  };

  const siguiente = async () => {
    setError('');
    try {
      await guardar();
      setPruebaActual((i) => i + 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudieron guardar las respuestas');
    }
  };

  const finalizar = async () => {
    if (!examen) return;
    setEnviando(true);
    setError('');
    try {
      await examenPublicoService.finalizar(token, respuestas);
      setFinalizado(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No se pudo entregar el examen');
    } finally {
      setEnviando(false);
    }
  };

  const totalPreguntas = examen?.pruebas.reduce((acc, p) => acc + p.preguntas.length, 0) || 0;
  const preguntasPrevias = examen?.pruebas
    .slice(0, pruebaActual)
    .reduce((acc, p) => acc + p.preguntas.length, 0) || 0;
  const respondidas = respuestas.filter((r) => r.opcionId !== 0).length;

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !examen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (finalizado || !examen || !prueba) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">¡Examen entregado!</h1>
          <p className="text-gray-600">
            Gracias{examen ? `, ${examen.candidato.nombre}` : ''}, sus respuestas fueron registradas
            correctamente. Puede cerrar esta ventana.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Evaluación psicométrica</h1>
              <p className="text-sm text-blue-100">
                {examen.bateria.nombre} · {examen.candidato.nombre} {examen.candidato.apellido}
              </p>
            </div>
            <div className="text-sm text-blue-100">
              Prueba {pruebaActual + 1} de {examen.pruebas.length}
            </div>
          </div>
          <div className="mt-3 h-2 bg-blue-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 transition-all"
              style={{ width: `${(respondidas / totalPreguntas) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">{prueba.nombre}</h2>
          <span className="text-xs text-gray-500">
            {respondidas}/{totalPreguntas} respondidas
          </span>
        </div>
        {prueba.descripcion && <p className="text-sm text-gray-500 mb-4">{prueba.descripcion}</p>}

        <div className="space-y-6">
          {prueba.preguntas.map((pregunta, idx) => (
            <PreguntaCard
              key={pregunta.id}
              pregunta={pregunta}
              indice={preguntasPrevias + idx + 1}
              opciones={opcionesMezcladas?.get(pregunta.id) || pregunta.opciones}
              seleccionada={respuestaDe(pregunta.id)}
              onChange={(opcionId) => responder(prueba.aplicacionId || 0, pregunta.id, opcionId)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          {pruebaActual < examen.pruebas.length - 1 ? (
            <button
              onClick={siguiente}
              className="bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              Guardar y siguiente prueba
            </button>
          ) : (
            <button
              onClick={finalizar}
              disabled={enviando}
              className="bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-600 disabled:opacity-50"
            >
              {enviando ? 'Entregando...' : 'Finalizar y entregar examen'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function PreguntaCard({
  pregunta,
  indice,
  opciones,
  seleccionada,
  onChange,
}: {
  pregunta: PreguntaExamen;
  indice: number;
  opciones: { id: number; texto: string }[];
  seleccionada: number;
  onChange: (opcionId: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="font-semibold text-gray-800 mb-4">
        <span className="text-gray-400 mr-2">{indice}.</span>
        {pregunta.enunciado}
      </p>

      {pregunta.tipo === 'LIKERT' ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-5 divide-x divide-gray-200">
            {LIKERT_ETIQUETAS.map((etiqueta, index) => {
              const opcion = opciones[index];
              if (!opcion) return null;
              const activa = seleccionada === opcion.id;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => onChange(opcion.id)}
                  className={`py-3 text-sm font-medium transition ${
                    activa
                      ? 'bg-blue-700 text-white'
                      : 'bg-white text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  {index + 1}
                  <span className="hidden md:block text-[10px] font-normal mt-0.5">
                    {etiqueta}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {opciones.map((opcion) => {
            const activa = seleccionada === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => onChange(opcion.id)}
                className={`w-full text-left px-4 py-3 border rounded-md transition ${
                  activa
                    ? 'border-blue-700 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opcion.texto}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
