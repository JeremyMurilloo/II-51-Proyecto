document.addEventListener("DOMContentLoaded", function () {

  const form = document.querySelector(".form-estimator");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // --- 1. Leer inputs del formulario ---
    let peso  = parseFloat(document.getElementById("peso").value);
    let valor = parseFloat(document.getElementById("valor").value);
    let largo = parseFloat(document.getElementById("largo").value);
    let ancho = parseFloat(document.getElementById("ancho").value);
    let alto  = parseFloat(document.getElementById("alto").value);

    // Las dimensiones son opcionales; si no se ingresan se tratan como 0
    if (isNaN(largo)) largo = 0;
    if (isNaN(ancho)) ancho = 0;
    if (isNaN(alto))  alto  = 0;

    // --- 2. Calcular el peso volumétrico ---
    // Estándar del sector: divide el volumen (cm³) entre 5000 para obtener kg equivalentes
    let volumetrico = (largo * ancho * alto) / 5000;

    // --- 3. Determinar el peso a cobrar ---
    // Se utiliza el mayor entre el peso físico y el volumétrico
    let pesoCobrar = peso > volumetrico ? peso : volumetrico;

    // --- 4. Calcular el costo de envío base ---
    // Tarifa: $8.50 por kg. Se aplica un mínimo de $12.00
    let costo = pesoCobrar * 8.5;
    if (costo < 12) costo = 12;

    // --- 5. Calcular el seguro (opcional) ---
    // Solo aplica cuando el valor declarado es $100 o más → 2% del valor
    let seguro = 0;
    if (valor >= 100) {
      seguro = valor * 0.02;
    }

    // --- 6. Calcular el total y mostrarlo ---
    let total = costo + seguro;

    document.getElementById("estimador-resultado").innerHTML =
      "<strong>Total: $" + total.toFixed(2) + "</strong>";
  });

});