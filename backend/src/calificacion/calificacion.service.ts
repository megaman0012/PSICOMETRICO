import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TipoAgregacion } from '@prisma/client';

@Injectable()
export class CalificacionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula el puntaje de una dimensión específica para una aplicación
   * @param aplicacionId ID de la aplicación
   * @param dimensionId ID de la dimensión
   * @returns Objeto con la puntuación calculada y otra información relevante
   */
  async calcularPuntuacionDimension(
    aplicacionId: number,
    dimensionId: number,
  ): Promise<{
    puntuacion: number;
    tipoAgregacion: TipoAgregacion;
    totalPreguntas: number;
    totalRespuestas: number;
  }> {
    // Obtener la dimensión para saber su tipo de agregación
    const dimension = await this.prisma.dimension.findUnique({
      where: { id: dimensionId },
      include: {
        prueba: true,
      },
    });

    if (!dimension) {
      throw new Error(`Dimensión con ID ${dimensionId} no encontrada`);
    }

    // Obtener todas las preguntas de esta dimensión
    const preguntas = await this.prisma.pregunta.findMany({
      where: { dimensionId },
      include: {
        opciones: true,
      },
    });

    if (preguntas.length === 0) {
      throw new Error(`No se encontraron preguntas para la dimensión ${dimensionId}`);
    }

    // Obtener todas las respuestas dadas por el candidato para esta aplicación
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
      include: {
        candidato: true,
        prueba: true,
      },
    });

    if (!aplicacion) {
      throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    const respuestas = await this.prisma.respuesta.findMany({
      where: {
        aplicacionId,
        preguntaId: {
          in: preguntas.map((p) => p.id),
        },
      },
      include: {
        opcionRespuesta: true,
      },
    });

    // Calcular la puntuación según el tipo de agregación
    let puntuacionBruta = 0;
    let sumaParaPromedio = 0;
    let countParaPromedio = 0;

    for (const pregunta of preguntas) {
      // Encontrar la respuesta dada para esta pregunta
      const respuesta = respuestas.find((r) => r.preguntaId === pregunta.id);
      
      if (respuesta && respuesta.opcionRespuesta) {
        const valorRespuesta = respuesta.opcionRespuesta.valor;
        
        // Para preguntas LIKERT, el valor suele estar en un rango (ej: 1-5)
        // Para preguntas de opción múltiple, el valor son los puntos asignados (ej: 0, 1, 2)
        puntuacionBruta += Number(valorRespuesta);
        
        // Para el promedio, sumamos los valores y contamos cuántas respuestas válidas tuvimos
        sumaParaPromedio += Number(valorRespuesta);
        countParaPromedio++;
      }
      // Si no hay respuesta, no sumamos nada (asumimos 0 o no contamos según requerimientos)
    }

    let puntuacionFinal: number;
    
    if (dimension.tipoAgregacion === TipoAgregacion.SUMA) {
      puntuacionFinal = puntuacionBruta;
    } else if (dimension.tipoAgregacion === TipoAgregacion.PROMEDIO) {
      puntuacionFinal = countParaPromedio > 0 ? sumaParaPromedio / countParaPromedio : 0;
    } else {
      throw new Error(`Tipo de agregación no soportado: ${dimension.tipoAgregacion}`);
    }

    return {
      puntuacion: puntuacionFinal,
      tipoAgregacion: dimension.tipoAgregacion,
      totalPreguntas: preguntas.length,
      totalRespuestas: respuestas.length,
    };
  }

  /**
   * Obtiene la clasificación e interpretación basada en la puntuación y los umbrales
   * @param puntuacion Puntuación calculada
   * @param pruebaId ID de la prueba (para filtrar umbrales globales)
   * @param dimensionId ID de la dimensión (para filtrar umbrales por dimensión, puede ser null para globales)
   * @returns Objeto con nombre, descripción e interpretación de la clasificación
   */
  async obtenerClasificacion(
    puntuacion: number,
    pruebaId: number,
    dimensionId: number | null = null,
  ): Promise<{
    nombre: string;
    descripcion: string;
    interpretacion: string;
  }> {
    let umbrales;

    if (dimensionId !== null) {
      // Buscar umbrales específicos de la dimensión
      umbrales = await this.prisma.umbralClasificacion.findMany({
        where: {
          pruebaId,
          dimensionId,
        },
      });
    } else {
      // Buscar umbrales globales de la prueba
      umbrales = await this.prisma.umbralClasificacion.findMany({
        where: {
          pruebaId,
          dimensionId: null,
        },
      });
    }

    if (umbrales.length === 0) {
      // Si no hay umbrales definidos, retornar una clasificación por defecto
      return {
        nombre: 'Sin clasificar',
        descripcion: 'No se han definido umbrales de clasificación',
        interpretacion: 'No se puede determinar el nivel de desempeño',
      };
    }

    // Buscar el umbral donde la puntuación esté dentro del rango
    const umbralAplicado = umbrales.find(
      (u) =>
        puntuacion >= Number(u.puntuacionMinima) &&
        puntuacion <= Number(u.puntuacionMaxima),
    );

    if (umbralAplicado) {
      return {
        nombre: umbralAplicado.nombre,
        descripcion: umbralAplicado.descripcion || '',
        interpretacion: umbralAplicado.interpretacion || '',
      };
    }

    // Si no se encuentra ningún umbral que coincida, tomar el más cercano o el último
    // Ordenamos por puntuacionMinima descendente y tomamos el primero que sea <= puntuacion
    const umbralMasCercano = umbrales
      .filter((u) => puntuacion >= Number(u.puntuacionMinima))
      .sort(
        (a, b) => Number(b.puntuacionMinima) - Number(a.puntuacionMinima),
      )[0];

    if (umbralMasCercano) {
      return {
        nombre: umbralMasCercano.nombre,
        descripcion: umbralMasCercano.descripcion || '',
        interpretacion: umbralMasCercano.interpretacion || '',
      };
    }

    // Si aún así no encontramos nada, tomar el umbral con la puntuación mínima más baja
    const umbralPredeterminado = umbrales.reduce((prev, current) =>
      Number(prev.puntuacionMinima) < Number(current.puntuacionMinima)
        ? prev
        : current,
    );

    return {
      nombre: umbralPredeterminado.nombre,
      descripcion: umbralPredeterminado.descripcion || '',
      interpretacion: umbralPredeterminado.interpretacion || '',
    };
  }

  /**
   * Calcula y guarda el resultado de una dimensión específica
   * @param aplicacionId ID de la aplicación
   * @param dimensionId ID de la dimensión
   * @returns El resultado de dimensión creado
   */
  async calcularYGuardarResultadoDimension(
    aplicacionId: number,
    dimensionId: number,
  ) {
    // Calcular la puntuación de la dimensión
    const resultadoCalculo = await this.calcularPuntuacionDimension(
      aplicacionId,
      dimensionId,
    );

    // Obtener la dimensión para obtener su ID de prueba
    const dimension = await this.prisma.dimension.findUnique({
      where: { id: dimensionId },
      select: { pruebaId: true },
    });

    if (!dimension) {
      throw new Error(`Dimensión con ID ${dimensionId} no encontrada`);
    }

    // Obtener la clasificación e interpretación
    const clasificacion = await this.obtenerClasificacion(
      resultadoCalculo.puntuacion,
      dimension.pruebaId,
      dimensionId,
    );

    // Calcular el porcentaje (asumiendo una escala máxima conocida o calculándola)
    // Para simplificar, vamos a asumir que podemos calcular un porcentaje basado en el rango posible
    // En una implementación real, esto dependería de la escala específica de cada prueba/dimensión
    let porcentaje = 0;
    if (resultadoCalculo.tipoAgregacion === TipoAgregacion.SUMA) {
      // Para SUMA, necesitaríamos saber el máximo posible
      // Por ahora, dejaremos el porcentaje como 0 y lo calcularemos después si es necesario
      porcentaje = 0;
    } else if (resultadoCalculo.tipoAgregacion === TipoAgregacion.PROMEDIO) {
      // Para PROMEDIO en una escala Likert 1-5, el máximo sería 5
      porcentaje = (resultadoCalculo.puntuacion / 5) * 100;
    }

    // Guardar el resultado de dimensión
    return this.prisma.resultadoDimension.create({
      data: {
        aplicacionId,
        dimensionId,
        puntuacion: resultadoCalculo.puntuacion,
        porcentaje,
        clasificacion: clasificacion.nombre,
        interpretacion: clasificacion.interpretacion,
      },
    });
  }

  /**
   * Calcula y guarda el resultado global de una prueba
   * @param aplicacionId ID de la aplicación
   * @returns El resultado global creado
   */
  async calcularYGuardarResultadoGlobal(aplicacionId: number) {
    // Obtener la aplicación para saber qué prueba es
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
      include: {
        prueba: true,
      },
    });

    if (!aplicacion) {
      throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    // Para el resultado global, vamos a calcular el promedio de todas las dimensiones
    // O podríamos calcularlo basado en todas las preguntas directamente
    // Vamos a hacerlo basado en todas las preguntas para ser más preciso

    // Obtener todas las preguntas de la prueba
    const preguntas = await this.prisma.pregunta.findMany({
      where: { pruebaId: aplicacion.pruebaId },
      include: {
        opciones: true,
      },
    });

    if (preguntas.length === 0) {
      throw new Error(`No se encontraron preguntas para la prueba ${aplicacion.pruebaId}`);
    }

    // Enfoque: Calcular el promedio de las puntuaciones normalizadas de cada dimensión
    const dimensiones = await this.prisma.dimension.findMany({
      where: { pruebaId: aplicacion.pruebaId },
      include: {
        preguntas: {
          include: {
            opciones: { select: { valor: true } },
          },
        },
      },
    });

    let sumaPonderada = 0;
    let totalPeso = 0;

    for (const dimension of dimensiones) {
      try {
        const resultadoDim = await this.calcularPuntuacionDimension(
          aplicacionId,
          dimension.id,
        );

        // Normalizar la puntuación a una escala 0-100 independientemente del tipo de agregación
        let puntuacionNormalizada = 0;
        const preguntasDim = dimension.preguntas || [];

        if (dimension.tipoAgregacion === TipoAgregacion.SUMA) {
          // Para SUMA: máximo posible = suma de los valores máximos de cada opción
          const maxPosible = preguntasDim.reduce((acc, p) => {
            const maxOpcion = p.opciones.reduce((m, o) => Math.max(m, Number(o.valor)), 0);
            return acc + maxOpcion;
          }, 0);
          puntuacionNormalizada =
            maxPosible > 0 ? (resultadoDim.puntuacion / maxPosible) * 100 : 0;
        } else {
          // Para PROMEDIO: escala Likert (valor máximo de las opciones, normalmente 5)
          const maxValorEscala = preguntasDim.reduce(
            (acc, p) =>
              Math.max(acc, ...p.opciones.map((o) => Number(o.valor))),
            0,
          );
          puntuacionNormalizada =
            maxValorEscala > 0 ? (resultadoDim.puntuacion / maxValorEscala) * 100 : 0;
        }

        // Ponderar por el número de preguntas en la dimensión
        const peso = preguntasDim.length || 1;
        sumaPonderada += puntuacionNormalizada * peso;
        totalPeso += peso;
      } catch (error) {
        // Si hay un error al calcular una dimensión, continuamos con las demás
        const mensaje = error instanceof Error ? error.message : String(error);
        console.warn(`Error al calcular dimensión ${dimension.id}:`, mensaje);
      }
    }

    const puntuacionGlobal = totalPeso > 0 ? sumaPonderada / totalPeso : 0;

    // Obtener la clasificación e interpretación para el resultado global
    const clasificacion = await this.obtenerClasificacion(
      puntuacionGlobal,
      aplicacion.pruebaId,
      null, // null indica que queremos umbrales globales
    );

    // Guardar el resultado global
    return this.prisma.resultadoGlobal.create({
      data: {
        aplicacionId,
        pruebaId: aplicacion.pruebaId,
        puntuacion: puntuacionGlobal,
        clasificacion: clasificacion.nombre,
        interpretacion: clasificacion.interpretacion,
      },
    });
  }

  /**
   * Función principal que orquesta todo el proceso de calificación
   * @param aplicacionId ID de la aplicación a finalizar
   */
  async finalizarAplicacion(aplicacionId: number): Promise<void> {
    // Verificar que la aplicación existe y está en estado PENDIENTE
    const aplicacion = await this.prisma.aplicacion.findUnique({
      where: { id: aplicacionId },
    });

    if (!aplicacion) {
      throw new Error(`Aplicación con ID ${aplicacionId} no encontrada`);
    }

    if (aplicacion.completada) {
      throw new Error(`La aplicación ${aplicacionId} ya está completada`);
    }

    // Obtener todas las dimensiones de la prueba
    const dimensiones = await this.prisma.dimension.findMany({
      where: { pruebaId: aplicacion.pruebaId },
    });

    // Calificar cada dimensión
    const resultadosDimensionPromises = dimensiones.map((dimension) =>
      this.calcularYGuardarResultadoDimension(aplicacionId, dimension.id),
    );

    // Esperar a que se calculen todos los resultados de dimensión
    await Promise.all(resultadosDimensionPromises);

    // Calificar globalmente
    await this.calcularYGuardarResultadoGlobal(aplicacionId);

    // Marcar la aplicación como completada
    await this.prisma.aplicacion.update({
      where: { id: aplicacionId },
      data: {
        completada: true,
        fechaFin: new Date(),
      },
    });
  }
}