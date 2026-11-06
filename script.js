// Configuración por defecto
let passPanolero = "tecnica_pañol2026";

// Catálogo base de herramientas por defecto
const catalogoInicial = [
  { nombre: "Martillo de Peña", categoria: "Manuales", disponible: 15, prestados: 0, limiteHerramienta: 2 },
  { nombre: "Destornillador Philips", categoria: "Manuales", disponible: 20, prestados: 0, limiteHerramienta: 3 },
  { nombre: "Alicate de Corte", categoria: "Manuales", disponible: 12, prestados: 0, limiteHerramienta: 2 },
  { nombre: "Taladro de Mano", categoria: "Eléctricas", disponible: 5, prestados: 0, limiteHerramienta: 1 },
  { nombre: "Calibre Digital", categoria: "Medición", disponible: 8, prestados: 0, limiteHerramienta: 1 },
  { nombre: "Cinta Métrica 5m", categoria: "Medición", disponible: 12, prestados: 0, limiteHerramienta: 2 },
  { nombre: "Alargue 10mts", categoria: "Accesorios", disponible: 6, prestados: 0, limiteHerramienta: 1 }
];

// Carga o reinicialización segura del inventario
let inventarioGuardado = JSON.parse(localStorage.getItem('inventario_v7'));

let inventario = (inventarioGuardado && inventarioGuardado.length > 0) 
  ? inventarioGuardado 
  : catalogoInicial;

let pedidos = JSON.parse(localStorage.getItem('pedidos_v7')) || [];
let reservas = JSON.parse(localStorage.getItem('reservas_v7')) || [];
let carrito = [];
let categoriaActiva = "Todas";

document.addEventListener('DOMContentLoaded', () => {
  guardarDatos();
  renderizarCatalogo();
  renderizarMisPedidos();
  renderizarInventario();
  renderizarPedidos();
  renderizarTablaDevolucionesPanolero();
  renderizarReservas();
});

function guardarDatos() {
  localStorage.setItem('inventario_v7', JSON.stringify(inventario));
  localStorage.setItem('pedidos_v7', JSON.stringify(pedidos));
  localStorage.setItem('reservas_v7', JSON.stringify(reservas));
}

// Navegación entre pestañas
function mostrarSeccion(seccion) {
  document.getElementById('seccion-solicitud').classList.add('hidden');
  document.getElementById('seccion-mis-pedidos').classList.add('hidden');
  document.getElementById('seccion-login').classList.add('hidden');
  document.getElementById('seccion-panolero').classList.add('hidden');

  const btns = document.querySelectorAll('.btn-nav');
  btns.forEach(b => b.classList.remove('active'));

  if (seccion === 'solicitud') {
    document.getElementById('seccion-solicitud').classList.remove('hidden');
    btns[0].classList.add('active');
  } else if (seccion === 'mis-pedidos') {
    document.getElementById('seccion-mis-pedidos').classList.remove('hidden');
    btns[1].classList.add('active');
    renderizarMisPedidos();
  } else if (seccion === 'login') {
    document.getElementById('seccion-login').classList.remove('hidden');
    btns[2].classList.add('active');
  } else if (seccion === 'panolero') {
    document.getElementById('seccion-panolero').classList.remove('hidden');
  }
}

// Catálogo y Filtros
function filtrarCategoria(cat, event) {
  categoriaActiva = cat;
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  if (event) event.target.classList.add('active');
  renderizarCatalogo();
}

function renderizarCatalogo() {
  const cont = document.getElementById('catalogo-disponible');
  if (!cont) return;
  cont.innerHTML = '';

  const filtrados = categoriaActiva === "Todas" 
    ? inventario 
    : inventario.filter(i => i.categoria === categoriaActiva);

  filtrados.forEach((item) => {
    const originalIndex = inventario.findIndex(i => i.nombre === item.nombre);
    cont.innerHTML += `
      <div class="item-catalogo">
        <div class="item-catalogo-info">
          <h4>${item.nombre}</h4>
          <span>Categoría: ${item.categoria}</span>
          <span>Stock disponible: <strong>${item.disponible}</strong></span>
          <span style="font-size:0.8rem; color:#0369a1; font-weight:bold; margin-top:4px; display:block;">
            Máx. ${item.limiteHerramienta} unid. por pedido
          </span>
        </div>
        <div class="item-catalogo-action">
          <button type="button" class="btn-primary" onclick="agregarAlCarrito(${originalIndex})">+ Agregar al Carrito</button>
        </div>
      </div>
    `;
  });
}

// Carrito con Límite Propio por Herramienta
function agregarAlCarrito(index) {
  const item = inventario[index];
  const enCarrito = carrito.find(c => c.nombre === item.nombre);
  const cantidadEnCarrito = enCarrito ? enCarrito.cantidad : 0;

  // Validación de Límite Propio de la Herramienta
  if (cantidadEnCarrito >= item.limiteHerramienta) {
    return alert(`Límite alcanzado: Solo puedes llevar un máximo de ${item.limiteHerramienta} unidades de "${item.nombre}".`);
  }

  // Validación de Stock Disponible en el Pañol
  if (item.disponible > cantidadEnCarrito) {
    if (enCarrito) {
      enCarrito.cantidad++;
    } else {
      carrito.push({ nombre: item.nombre, cantidad: 1 });
    }
    renderizarCarrito();
  } else {
    alert(`No hay más stock disponible de ${item.nombre} en el pañol.`);
  }
}

function renderizarCarrito() {
  const lista = document.getElementById('lista-carrito');
  if (!lista) return;
  lista.innerHTML = '';
  carrito.forEach(item => {
    lista.innerHTML += `<li>${item.nombre} x ${item.cantidad}</li>`;
  });
}

function vaciarCarrito() {
  carrito = [];
  renderizarCarrito();
}

// Formulario de envío
function enviarPedido(e) {
  e.preventDefault();
  if (carrito.length === 0) return alert("El carrito está vacío. Selecciona herramientas antes de enviar.");

  const nuevoPedido = {
    id: Date.now(),
    tipo: document.getElementById('tipo-usuario').value,
    nombre: document.getElementById('nombre').value,
    curso: document.getElementById('curso').value,
    materia: document.getElementById('materia').value,
    turno: document.getElementById('turno').value,
    horario: document.getElementById('horario').value,
    fechaDevolucion: document.getElementById('fecha-devolucion').value,
    herramientas: [...carrito],
    estado: 'Pendiente',
    estadoAlumno: 'No devuelta',
    observacionAlumno: ''
  };

  pedidos.push(nuevoPedido);
  guardarDatos();

  carrito = [];
  renderizarCarrito();
  document.getElementById('form-solicitud').reset();

  alert("¡Pedido registrado exitosamente! Puedes consultar su estado en 'Mis Devoluciones y Reportes'.");
  renderizarMisPedidos();
  renderizarPedidos();
  renderizarTablaDevolucionesPanolero();
}

// Vista Alumnos
function renderizarMisPedidos() {
  const tbody = document.getElementById('tbody-mis-pedidos');
  if (!tbody) return;
  tbody.innerHTML = '';

  const filtro = document.getElementById('buscar-alumno')?.value.toLowerCase() || '';

  const filtrados = pedidos.filter(p => 
    p.nombre.toLowerCase().includes(filtro) || p.curso.toLowerCase().includes(filtro)
  );

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b;">No hay pedidos registrados.</td></tr>`;
    return;
  }

  filtrados.forEach(p => {
    let items = p.herramientas.map(h => `${h.cantidad}x ${h.nombre}`).join(', ');
    
    let badgeEstado = '';
    if (p.estado === 'Pendiente') badgeEstado = '<span style="color:#d97706; font-weight:bold;">⏳ Pendiente</span>';
    else if (p.estado === 'Aceptado') badgeEstado = '<span style="color:#2563eb; font-weight:bold;">✅ Entregado por Pañol</span>';
    else if (p.estado === 'Rechazado') badgeEstado = '<span style="color:#dc2626; font-weight:bold;">❌ Rechazado</span>';
    else badgeEstado = '<span style="color:#16a34a; font-weight:bold;">🏁 Finalizado</span>';

    tbody.innerHTML += `
      <tr>
        <td><strong>${p.nombre}</strong><br><small>${p.tipo} - ${p.curso}</small></td>
        <td>${items}</td>
        <td>${p.fechaDevolucion.replace('T', ' ')} hs</td>
        <td>${badgeEstado}</td>
        <td>
          <select id="select-est-alumno-${p.id}" style="margin-bottom:4px;">
            <option value="No devuelta" ${p.estadoAlumno === 'No devuelta' ? 'selected' : ''}>🔴 No devuelta</option>
            <option value="Devuelta" ${p.estadoAlumno === 'Devuelta' ? 'selected' : ''}>🟢 Devuelta</option>
            <option value="Se rompió" ${p.estadoAlumno === 'Se rompió' ? 'selected' : ''}>⚠️ Se rompió</option>
          </select>
        </td>
        <td>
          <input type="text" id="obs-alumno-${p.id}" value="${p.observacionAlumno || ''}" placeholder="Escribe observaciones..." style="margin-bottom:4px;">
          <button type="button" class="btn-primary" onclick="guardarReporteAlumno(${p.id})">Guardar Reporte</button>
        </td>
      </tr>
    `;
  });
}

function guardarReporteAlumno(id) {
  const p = pedidos.find(item => item.id === id);
  if (!p) return;

  p.estadoAlumno = document.getElementById(`select-est-alumno-${id}`).value;
  p.observacionAlumno = document.getElementById(`obs-alumno-${id}`).value;

  guardarDatos();
  alert("Reporte guardado correctamente.");
  renderizarMisPedidos();
  renderizarTablaDevolucionesPanolero();
}

// Login
function iniciarSesion(e) {
  e.preventDefault();
  const pass = document.getElementById('password').value;
  if (pass === passPanolero) {
    mostrarSeccion('panolero');
    document.getElementById('form-login').reset();
  } else {
    alert("Contraseña incorrecta.");
  }
}

function cerrarSesion() {
  mostrarSeccion('solicitud');
}

function cambiarPassword(e) {
  e.preventDefault();
  const act = document.getElementById('pass-actual').value;
  const nueva = document.getElementById('pass-nueva').value;
  if (act === passPanolero) {
    passPanolero = nueva;
    alert("Contraseña actualizada con éxito.");
    e.target.reset();
  } else {
    alert("La contraseña actual es incorrecta.");
  }
}

// Panel del Pañolero
function renderizarPedidos() {
  const cont = document.getElementById('lista-pedidos');
  if (!cont) return;
  cont.innerHTML = '';

  const pendientes = pedidos.filter(p => p.estado === 'Pendiente');

  if (pendientes.length === 0) {
    cont.innerHTML = '<p class="subtext">No hay pedidos pendientes por revisar.</p>';
    return;
  }

  pendientes.forEach(p => {
    let items = p.herramientas.map(h => `${h.cantidad}x ${h.nombre}`).join(', ');
    cont.innerHTML += `
      <div class="card" style="border-top: 5px solid #f59e0b;">
        <h4>${p.tipo}: ${p.nombre}</h4>
        <p><strong>Curso/Turno:</strong> ${p.curso} - ${p.turno} (${p.horario})</p>
        <p><strong>Materia:</strong> ${p.materia}</p>
        <p><strong>Herramientas:</strong> ${items}</p>
        <p><strong>Devolución Estimada:</strong> ${p.fechaDevolucion.replace('T', ' ')} hs</p>
        <div style="margin-top:12px; display:flex; gap:10px;">
          <button type="button" class="btn-primary" onclick="responderPedido(${p.id}, true)">✅ Aprobar y Entregar</button>
          <button type="button" class="btn-danger" onclick="responderPedido(${p.id}, false)">❌ Rechazar (Falta Stock)</button>
        </div>
      </div>
    `;
  });
}

function responderPedido(id, aceptado) {
  const p = pedidos.find(item => item.id === id);
  if (aceptado) {
    p.estado = 'Aceptado';
    p.herramientas.forEach(h => {
      const inv = inventario.find(i => i.nombre === h.nombre);
      if (inv) {
        inv.disponible -= h.cantidad;
        inv.prestados += h.cantidad;
      }
    });
    alert("Pedido Aprobado.");
  } else {
    p.estado = 'Rechazado';
    alert("Pedido Rechazado.");
  }
  guardarDatos();
  renderizarPedidos();
  renderizarTablaDevolucionesPanolero();
  renderizarInventario();
  renderizarCatalogo();
  renderizarMisPedidos();
}

function renderizarTablaDevolucionesPanolero() {
  const tbody = document.getElementById('tbody-devoluciones-panolero');
  if (!tbody) return;
  tbody.innerHTML = '';

  const activos = pedidos.filter(p => p.estado === 'Aceptado' || p.estado === 'Finalizado');

  activos.forEach(p => {
    let items = p.herramientas.map(h => `${h.cantidad}x ${h.nombre}`).join(', ');

    tbody.innerHTML += `
      <tr>
        <td><strong>${p.nombre}</strong><br><small>(${p.tipo})</small></td>
        <td>${p.curso} - ${p.turno}<br><small>${p.horario}</small></td>
        <td>${items}</td>
        <td>${p.fechaDevolucion.replace('T', ' ')} hs</td>
        <td><strong>${p.estado}</strong></td>
        <td>
          <span style="font-weight:bold; color: ${p.estadoAlumno === 'Devuelta' ? '#16a34a' : (p.estadoAlumno === 'Se rompió' ? '#dc2626' : '#d97706')}">
            ${p.estadoAlumno}
          </span>
          <br><small>${p.observacionAlumno ? 'Obs: ' + p.observacionAlumno : 'Sin observaciones'}</small>
        </td>
        <td>
          ${p.estado === 'Aceptado' ? `
            <button type="button" class="btn-primary" onclick="finalizarPrestamo(${p.id})">Cerrar Préstamo</button>
          ` : '<span style="color:#16a34a; font-weight:bold;">Finalizado</span>'}
        </td>
      </tr>
    `;
  });
}

function finalizarPrestamo(id) {
  const p = pedidos.find(item => item.id === id);
  if (!p) return;

  p.herramientas.forEach(h => {
    const inv = inventario.find(i => i.nombre === h.nombre);
    if (inv) {
      inv.prestados -= h.cantidad;
      if (p.estadoAlumno === 'Devuelta') {
        inv.disponible += h.cantidad;
      }
    }
  });

  p.estado = 'Finalizado';
  guardarDatos();
  alert("Préstamo cerrado e ingresado al historial.");
  renderizarTablaDevolucionesPanolero();
  renderizarInventario();
  renderizarCatalogo();
  renderizarMisPedidos();
}

// Inventario del Pañolero
function renderizarInventario() {
  const tbody = document.getElementById('tbody-inventario');
  if (!tbody) return;
  tbody.innerHTML = '';
  inventario.forEach(i => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${i.nombre}</strong></td>
        <td>${i.categoria}</td>
        <td>${i.disponible}</td>
        <td>${i.prestados}</td>
        <td><strong>${i.limiteHerramienta}</strong> unid.</td>
      </tr>
    `;
  });
}

function agregarHerramienta(e) {
  e.preventDefault();
  const nombre = document.getElementById('nuevo-nombre').value;
  const categoria = document.getElementById('nueva-categoria').value;
  const cantidad = parseInt(document.getElementById('nueva-cantidad').value);
  const limite = parseInt(document.getElementById('nuevo-limite').value || 2);

  const existente = inventario.find(i => i.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente) {
    existente.disponible += cantidad;
    existente.limiteHerramienta = limite;
  } else {
    inventario.push({ nombre, categoria, disponible: cantidad, prestados: 0, limiteHerramienta: limite });
  }

  guardarDatos();
  renderizarInventario();
  renderizarCatalogo();
  e.target.reset();
  alert("Herramienta agregada al inventario correctamente.");
}

// Reservas
function agregarReserva(e) {
  e.preventDefault();
  reservas.push({
    prof: document.getElementById('res-profesor').value,
    materia: document.getElementById('res-materia').value,
    fecha: document.getElementById('res-fecha').value,
    turno: document.getElementById('res-turno').value,
    herram: document.getElementById('res-herramientas').value
  });
  guardarDatos();
  renderizarReservas();
  e.target.reset();
}

function renderizarReservas() {
  const tbody = document.getElementById('tbody-reservas');
  if (!tbody) return;
  tbody.innerHTML = '';
  reservas.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${r.fecha}</strong></td>
        <td>Prof. ${r.prof}</td>
        <td>${r.materia} (${r.turno})</td>
        <td>${r.herram}</td>
      </tr>
    `;
  });
}