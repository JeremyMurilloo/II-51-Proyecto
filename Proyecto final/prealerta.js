import { supabase } from "./supabase.js";

// ──────────────────────────────────────────
// PROTECCIÓN DE PÁGINA
// Si el usuario no ha iniciado sesión, lo manda al login
// ──────────────────────────────────────────
const usuario = JSON.parse(localStorage.getItem("usuario"));
if (!usuario) {
  window.location.href = "login.html";
}

// ──────────────────────────────────────────
// CERRAR SESIÓN
// Borra los datos del usuario guardados y regresa al login
// ──────────────────────────────────────────
document.getElementById("btnCerrarSesion").addEventListener("click", function () {
  localStorage.removeItem("usuario");
  window.location.href = "login.html";
});

// ──────────────────────────────────────────
// FORMATO DE FECHA
// Convierte un timestamp a formato legible en español (ej: "15 abr 2025, 10:30")
// ──────────────────────────────────────────
function formatearFecha(timestamp) {
  if (!timestamp) return "—"; // Si no hay fecha, muestra un guión
  const fecha = new Date(timestamp);
  return fecha.toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

// ──────────────────────────────────────────
// BADGE DE ESTADO
// Muestra un indicador visual según si la pre-alerta fue validada o no
// ──────────────────────────────────────────
function badgeValidacion(validada) {
  return validada
    ? "<span class='badge bg-success px-2 py-1'>✅ Validada</span>"
    : "<span class='badge bg-warning text-dark px-2 py-1'>⏳ Pendiente</span>";
}

// ──────────────────────────────────────────
// CARGAR HISTORIAL
// Trae de Supabase todas las pre-alertas del usuario y las muestra en pantalla
// ──────────────────────────────────────────
async function cargarHistorial() {
  // Muestra el spinner mientras carga
  document.getElementById("spinnerHistorial").style.display = "block";
  document.getElementById("historialPrealertas").innerHTML = "";

  // Consulta a la base de datos: pre-alertas del usuario, ordenadas por más reciente
  const { data, error } = await supabase
    .from("prealertas")
    .select("*")
    .eq("id_usuario", usuario.id_usuario)
    .order("id_prealerta", { ascending: false });

  // Oculta el spinner al terminar la carga
  document.getElementById("spinnerHistorial").style.display = "none";

  // Si hay error o no hay datos, muestra mensaje vacío
  if (error || !data || data.length === 0) {
    document.getElementById("historialPrealertas").innerHTML = `
      <div class="text-center py-4">
        <span style="font-size:2.5rem">📭</span>
        <p class="fw-bold mt-2 mb-1">Sin pre-alertas registradas</p>
        <p class="text-muted small">Usa el formulario para notificarnos sobre tu próximo paquete.</p>
      </div>
    `;
    return;
  }

  // Construye una tarjeta HTML por cada pre-alerta y la inserta en el DOM
  const filas = data.map(p => `
    <div class="prealerta-item" id="item-${p.id_prealerta}">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div>
          <p class="fw-bold mb-0" style="color:var(--color-primary-dark)">${p.descripcion_producto}</p>
          <p class="text-muted small mb-0">${p.proveedor_tienda} · Tracking: <code>${p.numero_tracking}</code></p>
        </div>
        ${badgeValidacion(p.validacion_prealerta)}
      </div>
      <div class="d-flex gap-4 flex-wrap mb-2">
        <div>
          <p class="text-muted small mb-0">Valor declarado</p>
          <p class="fw-semibold mb-0">$${parseFloat(p.valor_declarado).toFixed(2)}</p>
        </div>
        <div>
          <p class="text-muted small mb-0">Fecha de registro</p>
          <p class="fw-semibold mb-0">${formatearFecha(p.fecha_creacion)}</p>
        </div>
      </div>
      <!-- Botones de acción: editar y eliminar -->
      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-sm btn-outline-primary" onclick="editarPrealerta(${p.id_prealerta}, '${p.numero_tracking}', '${p.descripcion_producto}', '${p.proveedor_tienda}', ${p.valor_declarado})">✏️ Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarPrealerta(${p.id_prealerta})">🗑️ Eliminar</button>
      </div>
    </div>
  `).join("");

  document.getElementById("historialPrealertas").innerHTML = filas;
}

// ──────────────────────────────────────────
// ELIMINAR PRE-ALERTA
// Pide confirmación y luego borra el registro de la base de datos
// ──────────────────────────────────────────
window.eliminarPrealerta = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar esta pre-alerta?")) return;

  const { error } = await supabase
    .from("prealertas")
    .delete()
    .eq("id_prealerta", id)
    .eq("id_usuario", usuario.id_usuario); // Seguridad: solo borra si le pertenece al usuario

  if (error) {
    alert("Error al eliminar: " + error.message);
    return;
  }

  cargarHistorial(); // Refresca la lista tras eliminar
};

// ──────────────────────────────────────────
// ABRIR MODAL DE EDICIÓN
// Rellena el formulario del modal con los datos actuales de la pre-alerta
// ──────────────────────────────────────────
window.editarPrealerta = async function (id, tracking, descripcion, proveedor, valor) {
  document.getElementById("edit_id_prealerta").value = id;
  document.getElementById("edit_numero_tracking").value = tracking;
  document.getElementById("edit_descripcion_producto").value = descripcion;
  document.getElementById("edit_proveedor_tienda").value = proveedor;
  document.getElementById("edit_valor_declarado").value = valor;
  document.getElementById("mensajeEditar").innerHTML = ""; // Limpia mensajes anteriores

  // Abre el modal de Bootstrap
  const modal = new bootstrap.Modal(document.getElementById("modalEditarPrealerta"));
  modal.show();
};

// ──────────────────────────────────────────
// GUARDAR EDICIÓN
// Valida los campos del modal y actualiza el registro en Supabase
// ──────────────────────────────────────────
document.getElementById("btnGuardarEdicion").addEventListener("click", async function () {
  // Lee los valores del formulario de edición
  const id              = document.getElementById("edit_id_prealerta").value;
  const numero_tracking = document.getElementById("edit_numero_tracking").value.trim();
  const descripcion     = document.getElementById("edit_descripcion_producto").value.trim();
  const proveedor       = document.getElementById("edit_proveedor_tienda").value.trim();
  const valor           = parseFloat(document.getElementById("edit_valor_declarado").value);

  // Verifica que todos los campos estén llenos
  if (!numero_tracking || !descripcion || !proveedor || isNaN(valor)) {
    document.getElementById("mensajeEditar").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos.</div>";
    return;
  }

  // Envía los cambios a Supabase
  const { error } = await supabase
    .from("prealertas")
    .update({
      numero_tracking:      numero_tracking,
      descripcion_producto: descripcion,
      proveedor_tienda:     proveedor,
      valor_declarado:      valor
    })
    .eq("id_prealerta", id)
    .eq("id_usuario", usuario.id_usuario); // Seguridad: solo edita si es del usuario

  if (error) {
    document.getElementById("mensajeEditar").innerHTML =
      "<div class='alert alert-danger'>Error al guardar: " + error.message + "</div>";
    return;
  }

  // Cierra el modal y actualiza la lista
  bootstrap.Modal.getInstance(document.getElementById("modalEditarPrealerta")).hide();
  cargarHistorial();
});

// ──────────────────────────────────────────
// REGISTRAR NUEVA PRE-ALERTA
// Valida el formulario y guarda un nuevo registro en Supabase
// ──────────────────────────────────────────
const form = document.getElementById("formPrealerta");

form.addEventListener("submit", async function (e) {
  e.preventDefault(); // Evita que la página se recargue al enviar

  document.getElementById("mensajePrealerta").innerHTML = ""; // Limpia mensajes anteriores

  // Lee los valores del formulario
  const numero_tracking      = document.getElementById("numero_tracking").value.trim();
  const proveedor_tienda     = document.getElementById("proveedor_tienda").value;
  const descripcion_producto = document.getElementById("descripcion_producto").value.trim();
  const valor_declarado      = parseFloat(document.getElementById("valor_declarado").value);

  // Verifica que todos los campos estén completos
  if (!numero_tracking || !proveedor_tienda || !descripcion_producto || isNaN(valor_declarado)) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-warning'>Por favor completa todos los campos obligatorios.</div>";
    return;
  }

  // Desactiva el botón para evitar envíos duplicados
  const btn = document.getElementById("btnPrealerta");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  // Inserta la nueva pre-alerta en la base de datos
  const { error } = await supabase
    .from("prealertas")
    .insert([{
      id_usuario:           usuario.id_usuario,
      numero_tracking:      numero_tracking,
      proveedor_tienda:     proveedor_tienda,
      descripcion_producto: descripcion_producto,
      valor_declarado:      valor_declarado,
      validacion_prealerta: false // Siempre empieza como pendiente
    }]);

  if (error) {
    document.getElementById("mensajePrealerta").innerHTML =
      "<div class='alert alert-danger'>Error al registrar la pre-alerta: " + error.message + "</div>";
    btn.disabled = false;
    btn.textContent = "Enviar pre-alerta";
    return;
  }

  // Muestra éxito, limpia el formulario y recarga el historial
  document.getElementById("mensajePrealerta").innerHTML =
    "<div class='alert alert-success'>✅ Pre-alerta registrada exitosamente. Te notificaremos cuando llegue a tu casillero.</div>";

  form.reset();
  btn.disabled = false;
  btn.textContent = "Enviar pre-alerta";

  cargarHistorial();
});

// ──────────────────────────────────────────
// INICIO
// Carga el historial automáticamente cuando se abre la página
// ──────────────────────────────────────────
cargarHistorial();