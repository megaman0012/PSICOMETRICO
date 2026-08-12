import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Credenciales iniciales configurables (en producción vienen del .env del compose)
const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@psicometrico.com";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
const SEED_EVALUADOR_EMAIL = process.env.SEED_EVALUADOR_EMAIL || "evaluador@psicometrico.com";
const SEED_EVALUADOR_PASSWORD = process.env.SEED_EVALUADOR_PASSWORD || "Evaluador123!";

// ============================================================
// ÍTEMS REALES DE CADA PRUEBA (datos, no placeholders)
// ============================================================

// Big Five: ítems inspirados en el modelo IPIP (dominio público).
// 4 ítems por factor, escala Likert 1-5 (todas las claves positivas).
const BIG_FIVE: { factor: string; descripcion: string; items: string[] }[] = [
  {
    factor: "Apertura",
    descripcion: "Factor de personalidad: Apertura a la experiencia",
    items: [
      "Tengo una imaginación activa",
      "Disfruto explorar ideas y posibilidades nuevas",
      "Aprecio el arte, la música y la belleza",
      "Me interesa aprender sobre temas que desconozco",
    ],
  },
  {
    factor: "Responsabilidad",
    descripcion: "Factor de personalidad: Responsabilidad",
    items: [
      "Completo mis tareas hasta el final",
      "Soy ordenado y meticuloso en mi trabajo",
      "Cumplo mis compromisos de manera puntual",
      "Planifico mis actividades con anticipación",
    ],
  },
  {
    factor: "Extraversión",
    descripcion: "Factor de personalidad: Extraversión",
    items: [
      "Me siento cómodo iniciando conversaciones con desconocidos",
      "Disfruto estar en lugares con mucha gente",
      "Soy enérgico y entusiasta en mis actividades",
      "Disfruto ser el centro de atención en reuniones",
    ],
  },
  {
    factor: "Amabilidad",
    descripcion: "Factor de personalidad: Amabilidad",
    items: [
      "Me preocupo por el bienestar de las demás personas",
      "Trato a los demás con respeto y amabilidad",
      "Estoy dispuesto a ayudar a quien lo necesita",
      "Prefiero cooperar en lugar de competir",
    ],
  },
  {
    factor: "Neuroticismo",
    descripcion: "Factor de personalidad: Neuroticismo",
    items: [
      "Me estreso con facilidad ante situaciones difíciles",
      "Suelo sentirme preocupado por cosas pequeñas",
      "Mi estado de ánimo cambia con frecuencia",
      "Me cuesta recuperarme cuando algo me sale mal",
    ],
  },
];

// Integridad: 4 categorías éticas x 5 situaciones reales.
// Cada situación tiene 3 opciones con 2 / 1 / 0 puntos.
const INTEGRIDAD: {
  categoria: string;
  descripcion: string;
  situaciones: { situacion: string; opciones: { texto: string; valor: number }[] }[];
}[] = [
  {
    categoria: "Honestidad",
    descripcion: "Categoría ética: Honestidad",
    situaciones: [
      {
        situacion: "Encuentra una billetera con dinero en el área de descanso. ¿Qué hace?",
        opciones: [
          { texto: "Entregarla de inmediato a su supervisor", valor: 2 },
          { texto: "Llevarla a objetos perdidos al final del turno", valor: 1 },
          { texto: "Guardarla para quedarse con ella", valor: 0 },
        ],
      },
      {
        situacion: "Un compañero le pide que declare que él estaba presente cuando no lo estaba. ¿Qué hace?",
        opciones: [
          { texto: "Negarse y reportar la situación a su supervisor", valor: 2 },
          { texto: "Negarse sin reportar el incidente", valor: 1 },
          { texto: "Aceptar para ayudarlo", valor: 0 },
        ],
      },
      {
        situacion: "Un proveedor le ofrece un descuento personal a cambio de preferir su empresa. ¿Qué hace?",
        opciones: [
          { texto: "Rechazarlo y reportar el ofrecimiento", valor: 2 },
          { texto: "Rechazarlo sin reportarlo", valor: 1 },
          { texto: "Aceptarlo en beneficio propio", valor: 0 },
        ],
      },
      {
        situacion: "Se da cuenta de que registró una incidencia de forma incorrecta. ¿Qué hace?",
        opciones: [
          { texto: "Corregir el registro y reportar el error", valor: 2 },
          { texto: "Corregirlo en silencio", valor: 1 },
          { texto: "Dejarlo como está para evitar problemas", valor: 0 },
        ],
      },
      {
        situacion: "Al entregar el turno, nota que falta material del inventario. ¿Qué hace?",
        opciones: [
          { texto: "Reportar la falta de inmediato", valor: 2 },
          { texto: "Esperar a ver si el siguiente turno lo nota", valor: 1 },
          { texto: "No hacer nada para no involucrarse", valor: 0 },
        ],
      },
    ],
  },
  {
    categoria: "Responsabilidad",
    descripcion: "Categoría ética: Responsabilidad",
    situaciones: [
      {
        situacion: "Debe entregar su puesto pero su relevo llega tarde. ¿Qué hace?",
        opciones: [
          { texto: "Permanecer hasta que llegue su relevo", valor: 2 },
          { texto: "Retirarse y avisar por teléfono", valor: 1 },
          { texto: "Retirarse sin avisar", valor: 0 },
        ],
      },
      {
        situacion: "Su superior le asigna una tarea fuera de su rutina habitual. ¿Qué hace?",
        opciones: [
          { texto: "Aceptarla y realizarla con compromiso", valor: 2 },
          { texto: "Aceptarla pero hacerla a regañadientes", valor: 1 },
          { texto: "Buscar excusas para no hacerla", valor: 0 },
        ],
      },
      {
        situacion: "Durante su ronda encuentra una puerta sin asegurar. ¿Qué hace?",
        opciones: [
          { texto: "Asegurarla y reportar la novedad", valor: 2 },
          { texto: "Asegurarla sin reportarla", valor: 1 },
          { texto: "Ignorarla porque no es su área", valor: 0 },
        ],
      },
      {
        situacion: "Se enferma el día que le corresponde trabajar. ¿Qué hace?",
        opciones: [
          { texto: "Avisar con anticipación y coordinar su relevo", valor: 2 },
          { texto: "Avisar en el último momento", valor: 1 },
          { texto: "No avisar a nadie", valor: 0 },
        ],
      },
      {
        situacion: "Nota que no completó un punto de su lista de verificación. ¿Qué hace?",
        opciones: [
          { texto: "Volver y verificar el punto pendiente", valor: 2 },
          { texto: "Asumir que todo estaba en orden", valor: 1 },
          { texto: "Omitirlo para terminar más rápido", valor: 0 },
        ],
      },
    ],
  },
  {
    categoria: "Lealtad",
    descripcion: "Categoría ética: Lealtad",
    situaciones: [
      {
        situacion: "Un desconocido le pide información sobre el personal o el sistema de seguridad. ¿Qué hace?",
        opciones: [
          { texto: "Negarse y reportar el intento", valor: 2 },
          { texto: "Negarse sin reportarlo", valor: 1 },
          { texto: "Compartir información general", valor: 0 },
        ],
      },
      {
        situacion: "Oye a un colega criticando a la empresa frente a un cliente. ¿Qué hace?",
        opciones: [
          { texto: "Intervenir con discreción y reportarlo", valor: 2 },
          { texto: "Ignorar la conversación", valor: 1 },
          { texto: "Unirse a la crítica", valor: 0 },
        ],
      },
      {
        situacion: "Un excompañero de trabajo le pide datos del acceso del nuevo turno. ¿Qué hace?",
        opciones: [
          { texto: "Negarse y reportar la solicitud", valor: 2 },
          { texto: "Negarse sin reportarla", valor: 1 },
          { texto: "Compartir los datos con él", valor: 0 },
        ],
      },
      {
        situacion: "Le piden cubrir un turno extra de emergencia. ¿Qué hace?",
        opciones: [
          { texto: "Aceptarlo si le es posible", valor: 2 },
          { texto: "Aceptar con desagrado", valor: 1 },
          { texto: "Negarse de inmediato", valor: 0 },
        ],
      },
      {
        situacion: "Descubre que un compañero cometió una falta grave. ¿Qué hace?",
        opciones: [
          { texto: "Reportarlo a su supervisor", valor: 2 },
          { texto: "Hablarlo solo con el compañero", valor: 1 },
          { texto: "Guardar silencio", valor: 0 },
        ],
      },
    ],
  },
  {
    categoria: "Cumplimiento de Normas",
    descripcion: "Categoría ética: Cumplimiento de Normas",
    situaciones: [
      {
        situacion: "Un visitante no quiere registrarse al ingresar. ¿Qué hace?",
        opciones: [
          { texto: "No permitir el ingreso sin registro", valor: 2 },
          { texto: "Permitirlo si parece confiable", valor: 1 },
          { texto: "Permitirlo para evitar conflictos", valor: 0 },
        ],
      },
      {
        situacion: "Su supervisor le pide omitir un control de seguridad. ¿Qué hace?",
        opciones: [
          { texto: "Negarse y explicar el procedimiento", valor: 2 },
          { texto: "Cumplirlo aunque tenga dudas", valor: 1 },
          { texto: "Omitirlo como le indican", valor: 0 },
        ],
      },
      {
        situacion: "Ve a un empleado saliendo con material sin autorización. ¿Qué hace?",
        opciones: [
          { texto: "Detenerlo y seguir el procedimiento", valor: 2 },
          { texto: "Tomar nota y no actuar", valor: 1 },
          { texto: "Ignorarlo", valor: 0 },
        ],
      },
      {
        situacion: "Debe portar su identificación siempre, pero se le olvidó en casa. ¿Qué hace?",
        opciones: [
          { texto: "Reportarlo y usar un pase temporal", valor: 2 },
          { texto: "Ingresar sin identificarse", valor: 1 },
          { texto: "Omitir el reporte", valor: 0 },
        ],
      },
      {
        situacion: "Una norma le parece innecesaria. ¿Qué hace?",
        opciones: [
          { texto: "Cumplirla y sugerir mejoras por el canal adecuado", valor: 2 },
          { texto: "Cumplirla a regañadientes", valor: 1 },
          { texto: "No cumplirla", valor: 0 },
        ],
      },
    ],
  },
];

// Aptitudes cognitivas: 10 preguntas reales distribuidas en 4 competencias.
const APTITUDES: { competencia: string; descripcion: string; preguntas: { enunciado: string; opciones: { texto: string; valor: number }[] }[] }[] = [
  {
    competencia: "Análisis Numérico",
    descripcion: "Competencia cognitiva: Análisis Numérico",
    preguntas: [
      {
        enunciado: "Si una garita requiere 2 guardias y hay 8 guardias disponibles, ¿cuántas garitas pueden cubrirse al mismo tiempo?",
        opciones: [
          { texto: "2", valor: 0 },
          { texto: "4", valor: 1 },
          { texto: "6", valor: 0 },
          { texto: "8", valor: 0 },
        ],
      },
      {
        enunciado: "Un turno dura 8 horas y el guardia recorre 3 puntos de control cada hora. ¿Cuántos puntos recorre en total?",
        opciones: [
          { texto: "8", valor: 0 },
          { texto: "16", valor: 0 },
          { texto: "24", valor: 1 },
          { texto: "32", valor: 0 },
        ],
      },
      {
        enunciado: "Un paquete pesa 12 kg y debe dividirse en cajas de 3 kg. ¿Cuántas cajas se necesitan?",
        opciones: [
          { texto: "2", valor: 0 },
          { texto: "3", valor: 0 },
          { texto: "4", valor: 1 },
          { texto: "6", valor: 0 },
        ],
      },
    ],
  },
  {
    competencia: "Comprensión",
    descripcion: "Competencia cognitiva: Comprensión lectora",
    preguntas: [
      {
        enunciado: "La norma indica: 'Todo visitante debe presentar identificación en recepción antes del ingreso'. ¿Qué se requiere para ingresar?",
        opciones: [
          { texto: "Solo avisar su llegada", valor: 0 },
          { texto: "Presentar identificación en recepción", valor: 1 },
          { texto: "Llamar por teléfono antes", valor: 0 },
          { texto: "No se requiere nada", valor: 0 },
        ],
      },
      {
        enunciado: "La norma indica: 'El estacionamiento de empleados se cierra a las 10:00 p.m.'. ¿Qué significa?",
        opciones: [
          { texto: "Los empleados no pueden estacionar después de las 10:00 p.m.", valor: 1 },
          { texto: "Los visitantes estacionan gratis", valor: 0 },
          { texto: "El estacionamiento abre a las 10:00 p.m.", valor: 0 },
          { texto: "Solo se cierra los domingos", valor: 0 },
        ],
      },
      {
        enunciado: "En caso de alarma: 'Dirija a las personas hacia la salida de emergencia más cercana'. ¿Qué debe hacer?",
        opciones: [
          { texto: "Buscar la fuente de la alarma", valor: 0 },
          { texto: "Guiar a las personas a la salida más cercana", valor: 1 },
          { texto: "Esperar instrucciones sin moverse", valor: 0 },
          { texto: "Subir a los pisos superiores", valor: 0 },
        ],
      },
    ],
  },
  {
    competencia: "Lógica",
    descripcion: "Competencia cognitiva: Razonamiento lógico",
    preguntas: [
      {
        enunciado: "Todos los guardias usan uniforme. Pedro es guardia. ¿Qué se concluye?",
        opciones: [
          { texto: "Pedro puede no usar uniforme", valor: 0 },
          { texto: "Pedro usa uniforme", valor: 1 },
          { texto: "Pedro no usa uniforme", valor: 0 },
          { texto: "No se puede concluir nada", valor: 0 },
        ],
      },
      {
        enunciado: "Si A es mayor que B y B es mayor que C, entonces:",
        opciones: [
          { texto: "A es menor que C", valor: 0 },
          { texto: "A es igual a C", valor: 0 },
          { texto: "A es mayor que C", valor: 1 },
          { texto: "No se puede saber", valor: 0 },
        ],
      },
    ],
  },
  {
    competencia: "Atención",
    descripcion: "Competencia cognitiva: Atención y precisión",
    preguntas: [
      {
        enunciado: "Complete la serie numérica: 2, 4, 6, 8, ...",
        opciones: [
          { texto: "9", valor: 0 },
          { texto: "10", valor: 1 },
          { texto: "12", valor: 0 },
          { texto: "14", valor: 0 },
        ],
      },
      {
        enunciado: "Complete la secuencia de letras: A, C, E, G, ...",
        opciones: [
          { texto: "H", valor: 0 },
          { texto: "I", valor: 1 },
          { texto: "J", valor: 0 },
          { texto: "K", valor: 0 },
        ],
      },
    ],
  },
];

// ============================================================
// SEED PRINCIPAL
// ============================================================
async function main() {
  console.log("Iniciando proceso de seed con datos reales de las 3 pruebas...");

  // Limpiar datos existentes
  await prisma.resultadoDimension.deleteMany();
  await prisma.resultadoGlobal.deleteMany();
  await prisma.respuesta.deleteMany();
  await prisma.aplicacion.deleteMany();
  await prisma.umbralClasificacion.deleteMany();
  await prisma.opcionRespuesta.deleteMany();
  await prisma.pregunta.deleteMany();
  await prisma.dimension.deleteMany();
  await prisma.prueba.deleteMany();
  await prisma.candidato.deleteMany();
  await prisma.usuario.deleteMany();

  console.log("Datos existentes eliminados");

  // =============================================
  // 0. USUARIOS DEL SISTEMA
  // =============================================
  console.log("Creando usuarios del sistema...");

  const adminPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  const evaluadorPassword = await bcrypt.hash(SEED_EVALUADOR_PASSWORD, 10);

  const admin = await prisma.usuario.create({
    data: {
      email: SEED_ADMIN_EMAIL,
      password: adminPassword,
      nombre: "Administrador",
      rol: "ADMIN",
    },
  });

  const evaluador = await prisma.usuario.create({
    data: {
      email: SEED_EVALUADOR_EMAIL,
      password: evaluadorPassword,
      nombre: "Evaluador Principal",
      rol: "EVALUADOR",
    },
  });

  console.log(`Usuarios creados: admin (id=${admin.id}), evaluador (id=${evaluador.id})`);

  // =============================================
  // 1. PRUEBA BIG FIVE (ítems reales IPIP)
  // =============================================
  console.log("Cargando prueba Big Five...");

  const bigFive = await prisma.prueba.create({
    data: {
      nombre: "Big Five Personality",
      descripcion: "Test de personalidad basado en el modelo de los Cinco Grandes",
      version: "1.0",
      activa: true,
    },
  });

  const factores: { id: number; nombre: string }[] = [];
  for (let f = 0; f < BIG_FIVE.length; f++) {
    const bloque = BIG_FIVE[f];
    const factor = await prisma.dimension.create({
      data: {
        nombre: bloque.factor,
        descripcion: bloque.descripcion,
        pruebaId: bigFive.id,
        orden: f,
        // Big Five usa escala Likert 1-5: el puntaje del factor es el PROMEDIO de sus respuestas
        tipoAgregacion: "PROMEDIO",
      },
    });
    factores.push({ id: factor.id, nombre: bloque.factor });

    for (let p = 0; p < bloque.items.length; p++) {
      const pregunta = await prisma.pregunta.create({
        data: {
          enunciado: bloque.items[p],
          tipo: "LIKERT",
          pruebaId: bigFive.id,
          dimensionId: factor.id,
          orden: p,
        },
      });
      for (let valor = 1; valor <= 5; valor++) {
        await prisma.opcionRespuesta.create({
          data: {
            texto: valor.toString(),
            valor,
            esCorrecta: false,
            preguntaId: pregunta.id,
          },
        });
      }
    }
  }

  // Umbrales de clasificación por factor (escala 1-5)
  for (const factor of factores) {
    await prisma.umbralClasificacion.create({
      data: {
        nombre: "Alta",
        descripcion: "Nivel alto en el factor",
        puntuacionMinima: 4.0,
        puntuacionMaxima: 5.0,
        interpretacion: "Demuestra un alto nivel en este factor de personalidad",
        pruebaId: bigFive.id,
        dimensionId: factor.id,
      },
    });
    await prisma.umbralClasificacion.create({
      data: {
        nombre: "Moderada",
        descripcion: "Nivel moderado en el factor",
        puntuacionMinima: 2.5,
        puntuacionMaxima: 3.99,
        interpretacion: "Demuestra un nivel moderado en este factor de personalidad",
        pruebaId: bigFive.id,
        dimensionId: factor.id,
      },
    });
    await prisma.umbralClasificacion.create({
      data: {
        nombre: "Baja",
        descripcion: "Nivel bajo en el factor",
        puntuacionMinima: 0.0,
        puntuacionMaxima: 2.49,
        interpretacion: "Demuestra un bajo nivel en este factor de personalidad",
        pruebaId: bigFive.id,
        dimensionId: factor.id,
      },
    });
  }

  // Umbrales GLOBALES para Big Five (escala normalizada 0-100)
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Alta",
      descripcion: "Nivel global alto en personalidad",
      puntuacionMinima: 80.0,
      puntuacionMaxima: 100.0,
      interpretacion: "Demuestra un perfil de personalidad favorable para el puesto",
      pruebaId: bigFive.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Moderada",
      descripcion: "Nivel global moderado en personalidad",
      puntuacionMinima: 50.0,
      puntuacionMaxima: 79.99,
      interpretacion: "Demuestra un perfil de personalidad aceptable con áreas de mejora",
      pruebaId: bigFive.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Baja",
      descripcion: "Nivel global bajo en personalidad",
      puntuacionMinima: 0.0,
      puntuacionMaxima: 49.99,
      interpretacion: "Demuestra un perfil de personalidad que requiere evaluación adicional",
      pruebaId: bigFive.id,
    },
  });

  const totalPreguntasBigFive = BIG_FIVE.reduce((acc, b) => acc + b.items.length, 0);
  console.log(`Big Five cargado: ${factores.length} factores, ${totalPreguntasBigFive} preguntas reales`);

  // =============================================
  // 2. PRUEBA DE INTEGRIDAD (situaciones reales)
  // =============================================
  console.log("Cargando prueba de Integridad...");

  const integridad = await prisma.prueba.create({
    data: {
      nombre: "Test de Integridad",
      descripcion: "Evaluación de integridad para candidatos a guardia de seguridad",
      version: "1.0",
      activa: true,
    },
  });

  const categorias: { id: number; nombre: string }[] = [];
  for (let c = 0; c < INTEGRIDAD.length; c++) {
    const bloque = INTEGRIDAD[c];
    const categoria = await prisma.dimension.create({
      data: {
        nombre: bloque.categoria,
        descripcion: bloque.descripcion,
        pruebaId: integridad.id,
        orden: c,
      },
    });
    categorias.push({ id: categoria.id, nombre: bloque.categoria });

    for (let s = 0; s < bloque.situaciones.length; s++) {
      const situacion = bloque.situaciones[s];
      const pregunta = await prisma.pregunta.create({
        data: {
          enunciado: situacion.situacion,
          tipo: "OPCION_MULTIPLE",
          pruebaId: integridad.id,
          dimensionId: categoria.id,
          orden: s,
        },
      });
      for (const opcion of situacion.opciones) {
        await prisma.opcionRespuesta.create({
          data: {
            texto: opcion.texto,
            valor: opcion.valor,
            esCorrecta: opcion.valor === 2,
            preguntaId: pregunta.id,
          },
        });
      }
    }
  }

  // Umbrales globales para Integridad (escala normalizada 0-100)
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Alta",
      descripcion: "Nivel alto de integridad",
      puntuacionMinima: 80.0,
      puntuacionMaxima: 100.0,
      interpretacion: "Demuestra un alto nivel de integridad ética",
      pruebaId: integridad.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Media",
      descripcion: "Nivel medio de integridad",
      puntuacionMinima: 50.0,
      puntuacionMaxima: 79.99,
      interpretacion: "Demuestra un nivel medio de integridad ética",
      pruebaId: integridad.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Baja",
      descripcion: "Nivel bajo de integridad",
      puntuacionMinima: 0.0,
      puntuacionMaxima: 49.99,
      interpretacion: "Demuestra un bajo nivel de integridad ética",
      pruebaId: integridad.id,
    },
  });

  const totalPreguntasIntegridad = INTEGRIDAD.reduce((acc, c) => acc + c.situaciones.length, 0);
  console.log(`Integridad cargado: ${categorias.length} categorías, ${totalPreguntasIntegridad} situaciones reales`);

  // =============================================
  // 3. PRUEBA DE APTITUDES COGNITIVAS (preguntas reales)
  // =============================================
  console.log("Cargando prueba de Aptitudes Cognitivas...");

  const aptitudes = await prisma.prueba.create({
    data: {
      nombre: "Test de Aptitudes Cognitivas",
      descripcion: "Evaluación de aptitudes cognitivas para candidatos a guardia de seguridad",
      version: "1.0",
      activa: true,
    },
  });

  const competencias: { id: number; nombre: string }[] = [];
  let totalPreguntasAptitudes = 0;
  for (let i = 0; i < APTITUDES.length; i++) {
    const bloque = APTITUDES[i];
    const competencia = await prisma.dimension.create({
      data: {
        nombre: bloque.competencia,
        descripcion: bloque.descripcion,
        pruebaId: aptitudes.id,
        orden: i,
      },
    });
    competencias.push({ id: competencia.id, nombre: bloque.competencia });

    for (let p = 0; p < bloque.preguntas.length; p++) {
      const item = bloque.preguntas[p];
      const pregunta = await prisma.pregunta.create({
        data: {
          enunciado: item.enunciado,
          tipo: "OPCION_MULTIPLE",
          pruebaId: aptitudes.id,
          dimensionId: competencia.id,
          orden: p,
        },
      });
      for (let o = 0; o < item.opciones.length; o++) {
        const opcion = item.opciones[o];
        await prisma.opcionRespuesta.create({
          data: {
            texto: opcion.texto,
            valor: opcion.valor,
            esCorrecta: opcion.valor === 1,
            preguntaId: pregunta.id,
          },
        });
      }
      totalPreguntasAptitudes++;
    }
  }

  // Umbrales de clasificación globales (escala normalizada 0-100)
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Muy Apto",
      descripcion: "Nivel muy alto de aptitud cognitiva",
      puntuacionMinima: 80.0,
      puntuacionMaxima: 100.0,
      interpretacion: "Demuestra un nivel muy alto de aptitud cognitiva",
      pruebaId: aptitudes.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "Apto",
      descripcion: "Nivel adecuado de aptitud cognitiva",
      puntuacionMinima: 50.0,
      puntuacionMaxima: 79.99,
      interpretacion: "Demuestra un nivel adecuado de aptitud cognitiva",
      pruebaId: aptitudes.id,
    },
  });
  await prisma.umbralClasificacion.create({
    data: {
      nombre: "No Apto",
      descripcion: "Nivel insuficiente de aptitud cognitiva",
      puntuacionMinima: 0.0,
      puntuacionMaxima: 49.99,
      interpretacion: "Demuestra un nivel insuficiente de aptitud cognitiva",
      pruebaId: aptitudes.id,
    },
  });

  console.log(`Aptitudes Cognitivas cargado: ${competencias.length} competencias, ${totalPreguntasAptitudes} preguntas reales`);

  // =============================================
  // 4. CANDIDATO DE EJEMPLO
  // =============================================
  console.log("Creando candidato de ejemplo...");

  const candidatoEjemplo = await prisma.candidato.create({
    data: {
      nombre: "Juan",
      apellido: "Pérez",
      cedula: "V-12345678",
      email: "juan.perez@example.com",
      telefono: "+58 412-0000000",
      cargoPostulado: "Guardia de Seguridad",
    },
  });

  console.log(`Candidato de ejemplo creado (id=${candidatoEjemplo.id})`);

  console.log("Proceso de seed completado exitosamente");
  console.log("=============================================");
  console.log("CREDENCIALES DE ACCESO:");
  console.log(`  Admin:     ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`  Evaluador: ${SEED_EVALUADOR_EMAIL} / ${SEED_EVALUADOR_PASSWORD}`);
  console.log("=============================================");
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
