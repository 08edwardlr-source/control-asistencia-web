/**
 * workers.js
 * -----------------------------------------------------------------------
 * Lógica de la pestaña ASISTENCIA (búsqueda de trabajador y registro de
 * personal nuevo) y de la pestaña TRABAJADORES (listado, filtros, perfil).
 * -----------------------------------------------------------------------
 */

const Workers = {

  trabajadorActual: null,
  metodoActual: 'DNI', // 'DNI' | 'QR' — método usado para identificar al trabajador

  /* ---------- Selector de método: QR o DNI ---------- */

  cambiarMetodo(metodo) {
    if (typeof Attendance !== 'undefined' && Attendance._timeoutRegreso) {
      clearTimeout(Attendance._timeoutRegreso);
      Attendance._timeoutRegreso = null;
    }
    this.metodoActual = metodo;

    document.getElementById('btn-metodo-qr').classList.toggle('activo', metodo === 'QR');
    document.getElementById('btn-metodo-dni').classList.toggle('activo', metodo === 'DNI');

    document.getElementById('panel-no-encontrado').classList.add('oculto');
    this.cerrarModalNuevo();
    document.getElementById('panel-ficha').classList.add('oculto');

    if (metodo === 'QR') {
      document.getElementById('panel-busqueda').classList.add('oculto');
      document.getElementById('panel-scanner').classList.remove('oculto');
      Scanner.abrir();
    } else {
      Scanner.cerrar();
      document.getElementById('panel-scanner').classList.add('oculto');
      document.getElementById('panel-busqueda').classList.remove('oculto');
      document.getElementById('input-dni-buscar').value = '';
      document.getElementById('input-dni-buscar').focus();
    }
    this.ocultarSugerenciasDni();
  },

  /* ---------- Sugerencias en vivo mientras se escribe el DNI ---------- */

  async mostrarSugerenciasDni(texto) {
    const contenedor = document.getElementById('sugerencias-dni');
    const input = document.getElementById('input-dni-buscar');
    const q = texto.replace(/\D/g, '').slice(0, 15);
    if (input.value !== q) input.value = q;

    if (!q) {
      this.ocultarSugerenciasDni();
      return;
    }

    const trabajadores = await DB.obtenerTrabajadores();
    const coincidencias = trabajadores
      .filter(t => t.dni.includes(q))
      .sort((a, b) => Number(b.dni.startsWith(q)) - Number(a.dni.startsWith(q)) || a.dni.localeCompare(b.dni))
      .slice(0, 8);

    contenedor.classList.remove('oculto');

    if (coincidencias.length === 0) {
      this.ocultarSugerenciasDni();
      return;
    }

    contenedor.innerHTML = coincidencias.map(t => `
      <div class="sugerencia-dni-item" data-dni="${t.dni}">
        <div class="avatar-mini">${UI.iniciales(t.nombres, t.apellidos)}</div>
        <div class="sugerencia-dni-info">
          <div class="sugerencia-dni-nombre">${UI.escaparHtml(t.nombres)} ${UI.escaparHtml(t.apellidos)}</div>
          <div class="sugerencia-dni-meta">DNI: <strong>${UI.escaparHtml(t.dni)}</strong> · ${UI.escaparHtml(t.cargo || 'Sin cargo')}</div>
        </div>
        <span class="badge badge-${t.estado === 'ACTIVO' ? 'verde' : 'rojo'}">${t.estado}</span>
      </div>
    `).join('');

    contenedor.querySelectorAll('.sugerencia-dni-item').forEach(item => {
      item.addEventListener('click', () => this.seleccionarSugerenciaDni(item.dataset.dni));
    });
  },

  ocultarSugerenciasDni() {
    const contenedor = document.getElementById('sugerencias-dni');
    if (contenedor) {
      contenedor.classList.add('oculto');
      contenedor.innerHTML = '';
    }
  },

  navegarSugerenciasDni(evento) {
    const contenedor = document.getElementById('sugerencias-dni');
    const items = [...contenedor.querySelectorAll('.sugerencia-dni-item')];
    if (!items.length || !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(evento.key)) return;

    if (evento.key === 'Escape') {
      this.ocultarSugerenciasDni();
      return;
    }

    const actual = items.findIndex(item => item.classList.contains('activa'));
    if (evento.key === 'Enter' && actual >= 0) {
      evento.preventDefault();
      this.seleccionarSugerenciaDni(items[actual].dataset.dni);
      return;
    }

    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      items.forEach(item => item.classList.remove('activa'));
      const siguiente = evento.key === 'ArrowDown'
        ? (actual + 1) % items.length
        : (actual <= 0 ? items.length - 1 : actual - 1);
      items[siguiente].classList.add('activa');
      items[siguiente].scrollIntoView({ block: 'nearest' });
    }
  },

  async seleccionarSugerenciaDni(dni) {
    document.getElementById('input-dni-buscar').value = dni;
    this.ocultarSugerenciasDni();
    await this.buscarPorDni();
  },

  /* ---------- Flujo de búsqueda en la pestaña Asistencia ---------- */

  async buscarPorDni() {
    const input = document.getElementById('input-dni-buscar');
    const dni = input.value.trim();

    if (!dni) {
      UI.toast('Ingresa un DNI para buscar', 'alerta');
      return;
    }

    this.ocultarSugerenciasDni();
    const trabajador = await DB.buscarPorDni(dni);

    if (trabajador) {
      this.trabajadorActual = trabajador;
      await Attendance.mostrarFichaTrabajador(trabajador, 'DNI');
    } else {
      this.mostrarNoEncontrado(dni, 'DNI');
    }
  },

  async buscarPorQr(qrTexto) {
    const trabajador = await DB.buscarPorQrId(qrTexto);

    if (trabajador) {
      this.trabajadorActual = trabajador;
      await Attendance.mostrarFichaTrabajador(trabajador, 'QR');
    } else {
      this.mostrarNoEncontrado(null, 'QR', qrTexto);
    }
  },

  mostrarNoEncontrado(dni, metodo = 'DNI', qrTexto = null) {
    document.getElementById('panel-busqueda').classList.add('oculto');
    document.getElementById('panel-scanner').classList.add('oculto');
    Scanner.cerrar();

    document.getElementById('panel-no-encontrado').classList.remove('oculto');
    document.getElementById('panel-ficha').classList.add('oculto');

    const titulo = document.getElementById('titulo-no-encontrado');
    const subtitulo = document.getElementById('dni-no-encontrado');
    const contenedorBtn = document.getElementById('contenedor-personal-nuevo-btn');

    if (metodo === 'QR') {
      titulo.textContent = '❌ QR NO ENCONTRADO';
      subtitulo.textContent = qrTexto || '';
      contenedorBtn.classList.add('oculto');
    } else {
      titulo.textContent = '⚠️ TRABAJADOR NO ENCONTRADO';
      subtitulo.textContent = dni || '';
      contenedorBtn.classList.remove('oculto');
      document.getElementById('form-nuevo-dni').value = dni || '';
    }
  },

  volverABuscar() {
    if (typeof Attendance !== 'undefined' && Attendance._timeoutRegreso) {
      clearTimeout(Attendance._timeoutRegreso);
      Attendance._timeoutRegreso = null;
    }
    document.getElementById('input-dni-buscar').value = '';
    this.cambiarMetodo(this.metodoActual);
  },

  /* ---------- Modal: registrar personal nuevo ---------- */

  abrirRegistroNuevo() {
    try {
      UI.cerrarTodosLosModales();
      document.getElementById('form-nuevo-trabajador').reset();
      const dniPrellenado = document.getElementById('dni-no-encontrado').textContent;
      if (dniPrellenado) document.getElementById('form-nuevo-dni').value = dniPrellenado;
      document.getElementById('modal-nuevo-trabajador').classList.add('visible');
      document.getElementById('modal-nuevo-overlay').classList.add('visible');
    } catch (err) {
      console.error('Error al abrir el modal de registro nuevo:', err);
      UI.toast('No se pudo abrir el formulario. Revisa la consola (F12).', 'error');
    }
  },

  abrirRegistroDirecto() {
    try {
      Scanner.cerrar();
      UI.cerrarTodosLosModales();
      const dniEscrito = document.getElementById('input-dni-buscar').value.trim();
      document.getElementById('form-nuevo-trabajador').reset();
      document.getElementById('form-nuevo-dni').value = dniEscrito;
      document.getElementById('modal-nuevo-trabajador').classList.add('visible');
      document.getElementById('modal-nuevo-overlay').classList.add('visible');
    } catch (err) {
      console.error('Error al abrir el modal de registro nuevo:', err);
      UI.toast('No se pudo abrir el formulario. Revisa la consola (F12).', 'error');
    }
  },

  cerrarModalNuevo() {
    document.getElementById('modal-nuevo-trabajador').classList.remove('visible');
    document.getElementById('modal-nuevo-overlay').classList.remove('visible');
  },

  cancelarRegistroNuevo() {
    this.cerrarModalNuevo();
  },

  async guardarNuevoTrabajador(evento) {
    evento.preventDefault();
    const form = evento.target;

    try {
      const datos = {
        dni: (form.dni && form.dni.value || '').trim(),
        nombres: (form.nombres && form.nombres.value || '').trim(),
        apellidos: (form.apellidos && form.apellidos.value || '').trim(),
        cargo: (form.cargo && form.cargo.value) || '',
        area: (form.area && form.area.value) || '',
        estado: (form.estado && form.estado.value) || 'ACTIVO',
        turnoAsignado: (typeof Attendance !== 'undefined' && Attendance.turnoSeleccionado) || 'T01'
      };

      if (!datos.dni || !datos.nombres || !datos.apellidos) {
        UI.toast('Completa DNI, nombres y apellidos', 'error');
        return;
      }

      const nuevo = await DB.crearTrabajador(datos);
      UI.toast(`✅ Trabajador registrado — QR asignado: ${nuevo.qrId}`, 'exito');
      form.reset();
      this.cerrarModalNuevo();
      await App.renderizarContadorGlobal();
      if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();

      if (App.pestanaActual === 'trabajadores') {
        await this.renderizarListado();
      } else {
        document.getElementById('input-dni-buscar').value = datos.dni;
        await this.buscarPorDni();
      }
    } catch (err) {
      console.error('Error al registrar trabajador:', err);
      UI.toast(err && err.message ? err.message : 'No se pudo registrar el trabajador', 'error');
    }
  },

  /* ---------- Pestaña Trabajadores (listado + selección masiva de QR) ---------- */

  filtroTexto: '',
  filtroEstado: 'TODOS',
  seleccionados: new Set(),
  _filtradosVisibles: [],

  async renderizarListado() {
    const trabajadores = await DB.obtenerTrabajadores();
    const contenedor = document.getElementById('lista-trabajadores');

    let filtrados = trabajadores;
    if (this.filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(t => t.estado === this.filtroEstado);
    }
    if (this.filtroTexto) {
      const q = this.filtroTexto.toLowerCase();
      filtrados = filtrados.filter(t =>
        t.dni.includes(q) ||
        `${t.nombres} ${t.apellidos}`.toLowerCase().includes(q)
      );
    }

    document.getElementById('contador-trabajadores').textContent = `${trabajadores.length} Trabajadores`;
    this._filtradosVisibles = filtrados;

    if (filtrados.length === 0) {
      contenedor.innerHTML = `<div class="estado-vacio">No se encontraron trabajadores</div>`;
    } else {
      contenedor.innerHTML = filtrados.map(t => `
        <div class="fila-trabajador ${this.seleccionados.has(t.id) ? 'seleccionada' : ''}" data-id="${t.id}">
          <input type="checkbox" class="check-fila-trabajador" data-id="${t.id}" ${this.seleccionados.has(t.id) ? 'checked' : ''}>
          <div class="avatar-mini">${UI.iniciales(t.nombres, t.apellidos)}</div>
          <div class="fila-trabajador-info">
            <div class="fila-trabajador-nombre">${UI.escaparHtml(t.nombres)} ${UI.escaparHtml(t.apellidos)}</div>
            <div class="fila-trabajador-meta">DNI: ${UI.escaparHtml(t.dni)} · ${UI.escaparHtml(t.cargo)} · ${UI.escaparHtml(t.area || 'Sin área')}</div>
          </div>
          <button class="btn-icono-qr" data-qr-id="${t.id}" title="Generar QR" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="21"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="17.5" x2="21" y2="17.5"/></svg>
          </button>
          <span class="badge badge-${t.estado === 'ACTIVO' ? 'verde' : 'rojo'}">${t.estado}</span>
        </div>
      `).join('');

      contenedor.querySelectorAll('.fila-trabajador').forEach(fila => {
        fila.addEventListener('click', (e) => {
          if (e.target.closest('.check-fila-trabajador') || e.target.closest('.btn-icono-qr')) return;
          this.abrirPerfil(fila.dataset.id);
        });
      });

      contenedor.querySelectorAll('.check-fila-trabajador').forEach(chk => {
        chk.addEventListener('click', (e) => e.stopPropagation());
        chk.addEventListener('change', () => this.toggleSeleccion(chk.dataset.id));
      });

      contenedor.querySelectorAll('.btn-icono-qr').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          QRManager.abrirModalQr(btn.dataset.qrId);
        });
      });
    }

    const todosVisiblesSeleccionados = filtrados.length > 0 && filtrados.every(t => this.seleccionados.has(t.id));
    const checkTodos = document.getElementById('check-seleccionar-todos');
    if (checkTodos) checkTodos.checked = todosVisiblesSeleccionados;

    this._actualizarBarraSeleccion();
  },

  toggleSeleccion(id) {
    if (this.seleccionados.has(id)) {
      this.seleccionados.delete(id);
    } else {
      this.seleccionados.add(id);
    }
    this.renderizarListado();
  },

  toggleSeleccionarTodosVisibles(marcar) {
    (this._filtradosVisibles || []).forEach(t => {
      if (marcar) this.seleccionados.add(t.id);
      else this.seleccionados.delete(t.id);
    });
    this.renderizarListado();
  },

  limpiarSeleccion() {
    this.seleccionados.clear();
    this.renderizarListado();
    UI.toast('Selección limpiada', 'info');
  },

  _actualizarBarraSeleccion() {
    const boton = document.getElementById('btn-generar-carnets');
    if (!boton) return;
    const cantidad = this.seleccionados.size;
    boton.textContent = cantidad > 0
      ? `🪪 GENERAR CARNETS SELECCIONADOS (${cantidad})`
      : '🪪 GENERAR CARNETS DE TODOS (PDF)';
  },

  async generarCarnets() {
    if (this.seleccionados.size > 0) {
      const trabajadores = await DB.obtenerTrabajadores();
      const seleccionados = trabajadores.filter(t => this.seleccionados.has(t.id));
      await QRManager.generarCarnetsPDF(seleccionados, 'carnets-seleccionados');
    } else {
      await QRManager.generarCarnetsPDF();
    }
  },

  buscarEnListado(texto) {
    this.filtroTexto = texto;
    this.renderizarListado();
  },

  filtrarPorEstado(estado) {
    this.filtroEstado = estado;
    document.querySelectorAll('.chip-filtro').forEach(chip => {
      chip.classList.toggle('activo', chip.dataset.estado === estado);
    });
    this.renderizarListado();
  },

  /* ---------- Perfil de trabajador (ver / editar) ---------- */

  perfilActualId: null,

  async abrirPerfil(id) {
    const trabajadores = await DB.obtenerTrabajadores();
    const trabajador = trabajadores.find(t => t.id === id);
    if (!trabajador) return;

    this.perfilActualId = id;
    UI.cerrarTodosLosModales();
    const modal = document.getElementById('modal-perfil');

    document.getElementById('perfil-avatar').textContent = UI.iniciales(trabajador.nombres, trabajador.apellidos);
    document.getElementById('perfil-nombre').textContent = `${trabajador.nombres} ${trabajador.apellidos}`;
    document.getElementById('perfil-dni').textContent = `DNI: ${trabajador.dni}`;
    document.getElementById('perfil-qr-id').textContent = trabajador.qrId || '—';

    const form = document.getElementById('form-editar-perfil');
    document.getElementById('perfil-dni-input').value = trabajador.dni;
    form.nombres.value = trabajador.nombres;
    form.apellidos.value = trabajador.apellidos;
    form.cargo.value = trabajador.cargo;
    form.area.value = trabajador.area;
    form.estado.value = trabajador.estado;

    modal.classList.add('visible');
  },

  cerrarPerfil() {
    document.getElementById('modal-perfil').classList.remove('visible');
    this.perfilActualId = null;
  },

  async guardarPerfil(evento) {
    evento.preventDefault();
    if (!this.perfilActualId) return;
    const form = evento.target;

    await DB.actualizarTrabajador(this.perfilActualId, {
      nombres: form.nombres.value.trim(),
      apellidos: form.apellidos.value.trim(),
      cargo: form.cargo.value,
      area: form.area.value,
      estado: form.estado.value
    });

    UI.toast('Perfil actualizado correctamente', 'exito');
    this.cerrarPerfil();
    await this.renderizarListado();
    if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
  }
};
