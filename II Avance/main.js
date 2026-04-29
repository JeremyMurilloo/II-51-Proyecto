/**
 *  TARIFAS VIGENTES
 *  ─────────────────────────────────────────────────────────
 *  Tarifa base          : $8.50 por kilogramo
 *  Mínimo por envío     : $12.00
 *  Seguro opcional      : 2% del valor declarado
 *                         (aplica solo si el valor ≥ $100)
 *
 *  FÓRMULA DE PESO VOLUMÉTRICO
 *  ─────────────────────────────────────────────────────────
 *  Peso volumétrico (kg) = (Largo × Ancho × Alto) / 5000
 *  Se cobra el MAYOR entre el peso real y el volumétrico.
 * ============================================================
 */

// ─── Constantes de tarifas ────────────────────────────────
const TARIFA_POR_KG        = 8.50;   // Dólares por kilogramo
const MINIMO_ENVIO         = 12.00;  // Costo mínimo por envío
const DIVISOR_VOLUMETRICO  = 5000;   // Factor estándar para peso volumétrico
const UMBRAL_SEGURO        = 100;    // Valor mínimo para aplicar seguro
const PORCENTAJE_SEGURO    = 0.02;   // 2% del valor declarado


// ─── Inicialización al cargar el DOM ─────────────────────
document.addEventListener("DOMContentLoaded", function () {

  const form = document.querySelector(".form-estimator");

  if (!form) return; // El formulario no existe en esta página, salir

  form.addEventListener("submit", manejarEstimacion);
});


/**
 * Maneja el evento de envío del formulario.
 * Lee los campos, ejecuta los cálculos y muestra el resultado.
 *
 * @param {Event} e - Evento de submit del formulario
 */
function manejarEstimacion(e) {
  e.preventDefault();

  // 1. Leer y validar los valores del formulario
  const datos = leerFormulario();

  if (!datosValidos(datos)) {
    mostrarError("Por favor ingresa al menos el peso y el valor declarado.");
    return;
  }

  // 2. Realizar los cálculos
  const resultado = calcularCostoEnvio(datos);

  // 3. Mostrar el resultado al usuario
  mostrarResultado(resultado);
}


/**
 * Lee y parsea todos los campos del formulario estimador.
 *
 * @returns {{ peso, valor, largo, ancho, alto }} Objeto con los valores numéricos
 */
function leerFormulario() {
  return {
    peso  : parseFloat(document.getElementById("peso").value)  || 0,
    valor : parseFloat(document.getElementById("valor").value) || 0,
    largo : parseFloat(document.getElementById("largo").value) || 0,
    ancho : parseFloat(document.getElementById("ancho").value) || 0,
    alto  : parseFloat(document.getElementById("alto").value)  || 0,
  };
}


/**
 * Valida que los campos mínimos obligatorios estén presentes.
 *
 * @param {{ peso: number, valor: number }} datos
 * @returns {boolean} true si los datos son válidos
 */
function datosValidos({ peso, valor }) {
  return peso > 0 && valor > 0;
}


/**
 * Ejecuta todos los cálculos necesarios para estimar el costo de envío.
 *
 * Pasos:
 *   1. Calcular el peso volumétrico a partir de las dimensiones.
 *   2. Determinar el peso a cobrar (el mayor entre real y volumétrico).
 *   3. Calcular el costo base de envío aplicando la tarifa por kg.
 *   4. Aplicar el costo mínimo si corresponde.
 *   5. Calcular el seguro opcional si el valor declarado supera el umbral.
 *   6. Sumar el total final.
 *
 * @param {{ peso: number, valor: number, largo: number, ancho: number, alto: number }} datos
 * @returns {{ pesoReal, pesoVolumetrico, pesoCobrado, costoEnvio, seguro, total }}
 */
function calcularCostoEnvio({ peso, valor, largo, ancho, alto }) {

  // Paso 1 — Peso volumétrico
  const pesoVolumetrico = (largo * ancho * alto) / DIVISOR_VOLUMETRICO;

  // Paso 2 — Se cobra el mayor entre peso real y volumétrico
  const pesoCobrado = Math.max(peso, pesoVolumetrico);

  // Paso 3 — Costo base según tarifa por kg
  let costoEnvio = pesoCobrado * TARIFA_POR_KG;

  // Paso 4 — Aplicar el mínimo por envío
  if (costoEnvio < MINIMO_ENVIO) {
    costoEnvio = MINIMO_ENVIO;
  }

  // Paso 5 — Seguro opcional (solo si valor declarado ≥ $100)
  const seguro = valor >= UMBRAL_SEGURO ? valor * PORCENTAJE_SEGURO : 0;

  // Paso 6 — Total final
  const total = costoEnvio + seguro;

  return { pesoReal: peso, pesoVolumetrico, pesoCobrado, costoEnvio, seguro, total };
}


/**
 * Construye y muestra el desglose del resultado en el DOM.
 *
 * @param {{ pesoReal, pesoVolumetrico, pesoCobrado, costoEnvio, seguro, total }} resultado
 */
function mostrarResultado({ pesoReal, pesoVolumetrico, pesoCobrado, costoEnvio, seguro, total }) {

  const seguroHTML = seguro > 0
    ? `<p>Seguro (2%): <strong>$${seguro.toFixed(2)}</strong></p>`
    : `<p class="text-muted">Seguro: No aplica (valor declarado menor a $${UMBRAL_SEGURO})</p>`;

  const usaVolumetrico = pesoVolumetrico > pesoReal;

  document.getElementById("estimador-resultado").innerHTML = `
    <div class="desglose-resultado">
      <h5 class="fw-bold mb-3">Desglose del costo</h5>
      <p>Peso real: <strong>${pesoReal.toFixed(2)} kg</strong></p>
      <p>Peso volumétrico: <strong>${pesoVolumetrico.toFixed(2)} kg</strong></p>
      <p>Peso cobrado: <strong>${pesoCobrado.toFixed(2)} kg</strong>
         ${usaVolumetrico ? "<span class='badge bg-warning text-dark ms-1'>Se usa el volumétrico</span>" : ""}
      </p>
      <hr>
      <p>Costo de envío: <strong>$${costoEnvio.toFixed(2)}</strong></p>
      ${seguroHTML}
      <hr>
      <p class="fs-5"><strong>Total estimado: $${total.toFixed(2)}</strong></p>
    </div>
  `;
}


/**
 * Muestra un mensaje de error en el contenedor de resultados.
 *
 * @param {string} mensaje - Texto del error a mostrar
 */
function mostrarError(mensaje) {
  document.getElementById("estimador-resultado").innerHTML = `
    <div class="alert alert-warning mt-3">⚠️ ${mensaje}</div>
  `;
}
