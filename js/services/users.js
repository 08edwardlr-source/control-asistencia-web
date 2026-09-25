/**
 * workers.js
 * Lógica de trabajadores, búsqueda, registro, edición y eliminación.
 */

const Workers = {
  trabajadorActual: null,
  metodoActual: 'DNI',

  /* ================= MÉTODO QR O DNI ================= */

  cambiarMetodo(metodo) {
    if (
  typeof Attendance !== 'undefined' &&
  !Attendance.turnoSeleccionado
) {
  UI.toast(
    'Selecciona un turno antes de elegir DNI o QR',
    'alerta'
  );

  document
    .querySelector('.turnos-grid')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

  return;
}
    if (
      typeof Attendance !== 'undefined' &&
      Attendance._timeoutRegreso
    ) {
      clearTimeout(Attendance._timeoutRegreso);
      Attendance._timeoutRegreso = null;
    }

    this.metodoActual = metodo;

    document
      .getElementById('btn-metodo-qr')
      .classList.toggle('activo', metodo === 'QR');

    document
      .getElementById('btn-metodo-dni')
      .classList.toggle('activo', metodo === 'DNI');

    document
      .getElementById('panel-no-encontrado')
      .classList.add('oculto');

    this.cerrarModalNuevo();

    document
      .getElementById('panel-ficha')
      .classList.add('oculto');

    if (metodo === 'QR') {
      document
        .getElementById('panel-busqueda')
        .classList.add('oculto');

      document
        .getElementById('panel-scanner')
        .classList.remove('oculto');

      Scanner.abrir();
    } else {
      Scanner.cerrar();

      document
        .getElementById('panel-scanner')
        .classList.add('oculto');

      document
        .getElementById('panel-busqueda')
        .classList.remove('oculto');

      const input = document.getElementById(
        'input-dni-buscar'
      );

      input.value = '';
      input.focus();
    }

    this.ocultarSugerenciasDni();
  },

  /* ================= SUGERENCIAS DNI ================= */

  async mostrarSugerenciasDni(texto) {
    const contenedor = document.getElementById(
      'sugerencias-dni'
    );

    const input = document.getElementById(
      'input-dni-buscar'
    );

    const q = texto.replace(/\D/g, '').slice(0, 15);

    if (input.value !== q) {
      input.value = q;
    }

    if (!q) {
      this.ocultarSugerenciasDni();
      return;
    }

    const trabajadores = await DB.obtenerTrabajadores();

    const coincidencias = trabajadores
      .filter(trabajador =>
        String(trabajador.dni).includes(q)
      )
      .sort((a, b) => {
        const prioridadA = Number(
          String(a.dni).startsWith(q)
        );

        const prioridadB = Number(
          String(b.dni).startsWith(q)
        );

        return (
          prioridadB -
            prioridadA ||
          String(a.dni).localeCompare(String(b.dni))
        );
      })
      .slice(0, 8);

    if (!coincidencias.length) {
      this.ocultarSugerenciasDni();
      return;
    }

    contenedor.classList.remove('oculto');

    contenedor.innerHTML = coincidencias
      .map(
        trabajador => `
          <div
            class="sugerencia-dni-item"
            data-dni="${UI.escaparHtml(trabajador.dni)}"
          >
            <div class="avatar-mini">
              ${UI.iniciales(
                trabajador.nombres,
                trabajador.apellidos
              )}
            </div>

            <div class="sugerencia-dni-info">
              <div class="sugerencia-dni-nombre">
                ${UI.escaparHtml(trabajador.nombres)}
                ${UI.escaparHtml(trabajador.apellidos)}
              </div>

              <div class="sugerencia-dni-meta">
                DNI:
                <strong>
                  ${UI.escaparHtml(trabajador.dni)}
                </strong>
                ·
                ${UI.escaparHtml(
                  trabajador.cargo || 'Sin cargo'
                )}
              </div>
            </div>

            <span
              class="badge badge-${
                trabajador.estado === 'ACTIVO'
                  ? 'verde'
                  : 'rojo'
              }"
            >
              ${UI.escaparHtml(trabajador.estado)}
            </span>
          </div>
        `
      )
      .join('');

    contenedor
      .querySelectorAll('.sugerencia-dni-item')
      .forEach(elemento => {
        elemento.addEventListener('click', () => {
          this.seleccionarSugerenciaDni(
            elemento.dataset.dni
          );
        });
      });
  },

  ocultarSugerenciasDni() {
    const contenedor = document.getElementById(
      'sugerencias-dni'
    );

    if (contenedor) {
      contenedor.classList.add('oculto');
      contenedor.innerHTML = '';
    }
  },

  navegarSugerenciasDni(evento) {
    const contenedor = document.getElementById(
      'sugerencias-dni'
    );

    const elementos = [
      ...contenedor.querySelectorAll(
        '.sugerencia-dni-item'
      )
    ];

    const teclasPermitidas = [
      'ArrowDown',
      'ArrowUp',
      'Enter',
      'Escape'
    ];

    if (
      !elementos.length ||
      !teclasPermitidas.includes(evento.key)
    ) {
      return;
    }

    if (evento.key === 'Escape') {
      this.ocultarSugerenciasDni();
      return;
    }

    const indiceActual = elementos.findIndex(
      elemento =>
        elemento.classList.contains('activa')
    );

    if (
      evento.key === 'Enter' &&
      indiceActual >= 0
    ) {
      evento.preventDefault();

      this.seleccionarSugerenciaDni(
        elementos[indiceActual].dataset.dni
      );

      return;
    }

    if (
      evento.key === 'ArrowDown' ||
      evento.key === 'ArrowUp'
    ) {
      evento.preventDefault();

      elementos.forEach(elemento =>
        elemento.classList.remove('activa')
      );

      const siguiente =
        evento.key === 'ArrowDown'
          ? (indiceActual + 1) % elementos.length
          : indiceActual <= 0
            ? elementos.length - 1
            : indiceActual - 1;

      elementos[siguiente].classList.add('activa');

      elementos[siguiente].scrollIntoView({
        block: 'nearest'
      });
    }
  },

  async seleccionarSugerenciaDni(dni) {
    document.getElementById(
      'input-dni-buscar'
    ).value = dni;

    this.ocultarSugerenciasDni();
    await this.buscarPorDni();
  },

  /* ================= BUSCAR TRABAJADOR ================= */

  async buscarPorDni() {
    const input = document.getElementById(
      'input-dni-buscar'
    );

    const dni = input.value.trim();

    if (!dni) {
      UI.toast(
        'Ingresa un DNI para buscar',
        'alerta'
      );

      return;
    }

    this.ocultarSugerenciasDni();

    const trabajador = await DB.buscarPorDni(dni);

    if (trabajador) {
      this.trabajadorActual = trabajador;

      await Attendance.mostrarFichaTrabajador(
        trabajador,
        'DNI'
      );
    } else {
      this.mostrarNoEncontrado(dni, 'DNI');
    }
  },

  async buscarPorQr(qrTexto) {
    const trabajador =
      await DB.buscarPorQrId(qrTexto);

    if (trabajador) {
      this.trabajadorActual = trabajador;

      await Attendance.mostrarFichaTrabajador(
        trabajador,
        'QR'
      );
    } else {
      this.mostrarNoEncontrado(
        null,
        'QR',
        qrTexto
      );
    }
  },

  mostrarNoEncontrado(
    dni,
    metodo = 'DNI',
    qrTexto = null
  ) {
    document
      .getElementById('panel-busqueda')
      .classList.add('oculto');

    document
      .getElementById('panel-scanner')
      .classList.add('oculto');

    Scanner.cerrar();

    document
      .getElementById('panel-no-encontrado')
      .classList.remove('oculto');

    document
      .getElementById('panel-ficha')
      .classList.add('oculto');

    const titulo = document.getElementById(
      'titulo-no-encontrado'
    );

    const subtitulo = document.getElementById(
      'dni-no-encontrado'
    );

    const contenedorBoton = document.getElementById(
      'contenedor-personal-nuevo-btn'
    );

    if (metodo === 'QR') {
      titulo.textContent = '❌ QR NO ENCONTRADO';
      subtitulo.textContent = qrTexto || '';
      contenedorBoton.classList.add('oculto');
    } else {
      titulo.textContent =
        '⚠️ TRABAJADOR NO ENCONTRADO';

      subtitulo.textContent = dni || '';
      contenedorBoton.classList.remove('oculto');

      document.getElementById(
        'form-nuevo-dni'
      ).value = dni || '';
    }
  },

  volverABuscar() {
    if (
      typeof Attendance !== 'undefined' &&
      Attendance._timeoutRegreso
    ) {
      clearTimeout(Attendance._timeoutRegreso);
      Attendance._timeoutRegreso = null;
    }

    document.getElementById(
      'input-dni-buscar'
    ).value = '';

    this.cambiarMetodo(this.metodoActual);
  },

  /* ================= NUEVO TRABAJADOR ================= */

  abrirRegistroNuevo() {
    try {
      UI.cerrarTodosLosModales();

      document
        .getElementById('form-nuevo-trabajador')
        .reset();

      const dniPrellenado = document.getElementById(
        'dni-no-encontrado'
      ).textContent;

      if (dniPrellenado) {
        document.getElementById(
          'form-nuevo-dni'
        ).value = dniPrellenado;
      }

      document
        .getElementById('modal-nuevo-trabajador')
        .classList.add('visible');

      document
        .getElementById('modal-nuevo-overlay')
        .classList.add('visible');
    } catch (error) {
      console.error(
        'Error abriendo formulario:',
        error
      );

      UI.toast(
        'No se pudo abrir el formulario',
        'error'
      );
    }
  },

  abrirRegistroDirecto() {
    try {
      Scanner.cerrar();
      UI.cerrarTodosLosModales();

      const dniEscrito = document
        .getElementById('input-dni-buscar')
        .value.trim();

      document
        .getElementById('form-nuevo-trabajador')
        .reset();

      document.getElementById(
        'form-nuevo-dni'
      ).value = dniEscrito;

      document
        .getElementById('modal-nuevo-trabajador')
        .classList.add('visible');

      document
        .getElementById('modal-nuevo-overlay')
        .classList.add('visible');
    } catch (error) {
      console.error(
        'Error abriendo formulario:',
        error
      );

      UI.toast(
        'No se pudo abrir el formulario',
        'error'
      );
    }
  },

  cerrarModalNuevo() {
    const modal = document.getElementById(
      'modal-nuevo-trabajador'
    );

    const overlay = document.getElementById(
      'modal-nuevo-overlay'
    );

    if (modal) {
      modal.classList.remove('visible');
    }

    if (overlay) {
      overlay.classList.remove('visible');
    }
  },

  cancelarRegistroNuevo() {
    this.cerrarModalNuevo();
  },

  async guardarNuevoTrabajador(evento) {
    evento.preventDefault();

    const formulario = evento.target;

    try {
      const datos = {
        dni: String(
          formulario.dni?.value || ''
        ).trim(),

        nombres: String(
          formulario.nombres?.value || ''
        ).trim(),

        apellidos: String(
          formulario.apellidos?.value || ''
        ).trim(),

        cargo: formulario.cargo?.value || '',

        area: formulario.area?.value || '',

        estado:
          formulario.estado?.value || 'ACTIVO',

        turnoAsignado:
          typeof Attendance !== 'undefined'
            ? Attendance.turnoSeleccionado || 'T01'
            : 'T01'
      };

      if (
        !datos.dni ||
        !datos.nombres ||
        !datos.apellidos
      ) {
        UI.toast(
          'Completa DNI, nombres y apellidos',
          'error'
        );

        return;
      }

      const nuevo =
        await DB.crearTrabajador(datos);

      UI.toast(
        `✅ Trabajador registrado — Código: ${nuevo.qrId}`,
        'exito'
      );

      formulario.reset();
      this.cerrarModalNuevo();

      await App.renderizarContadorGlobal();

      if (typeof Dashboard !== 'undefined') {
        Dashboard.actualizarSiVisible();
      }

      if (App.pestanaActual === 'trabajadores') {
        await this.renderizarListado();
      } else {
        document.getElementById(
          'input-dni-buscar'
        ).value = datos.dni;

        await this.buscarPorDni();
      }
    } catch (error) {
      console.error(
        'Error registrando trabajador:',
        error
      );

      UI.toast(
        error?.message ||
          'No se pudo registrar el trabajador',
        'error'
      );
    }
  },

  /* ================= LISTADO ================= */

  filtroTexto: '',
  filtroEstado: 'TODOS',
  seleccionados: new Set(),
  _filtradosVisibles: [],

  async renderizarListado() {
    const trabajadores =
      await DB.obtenerTrabajadores();

    const contenedor = document.getElementById(
      'lista-trabajadores'
    );

    if (!contenedor) {
      return;
    }

    let filtrados = trabajadores;

    if (this.filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(
        trabajador =>
          trabajador.estado === this.filtroEstado
      );
    }

    if (this.filtroTexto) {
      const texto = this.filtroTexto.toLowerCase();

      filtrados = filtrados.filter(trabajador => {
        const nombreCompleto =
          `${trabajador.nombres} ${trabajador.apellidos}`
            .toLowerCase();

        return (
          String(trabajador.dni).includes(texto) ||
          nombreCompleto.includes(texto)
        );
      });
    }

    document.getElementById(
      'contador-trabajadores'
    ).textContent =
      `${trabajadores.length} Trabajadores`;

    this._filtradosVisibles = filtrados;

    if (!filtrados.length) {
      contenedor.innerHTML = `
        <div class="estado-vacio">
          No se encontraron trabajadores
        </div>
      `;
    } else {
      contenedor.innerHTML = filtrados
        .map(
          trabajador => `
            <div
              class="fila-trabajador ${
                this.seleccionados.has(trabajador.id)
                  ? 'seleccionada'
                  : ''
              }"
              data-id="${UI.escaparHtml(trabajador.id)}"
            >
              <input
                type="checkbox"
                class="check-fila-trabajador"
                data-id="${UI.escaparHtml(trabajador.id)}"
                ${
                  this.seleccionados.has(trabajador.id)
                    ? 'checked'
                    : ''
                }
              >

              <div class="avatar-mini">
                ${UI.iniciales(
                  trabajador.nombres,
                  trabajador.apellidos
                )}
              </div>

              <div class="fila-trabajador-info">
                <div class="fila-trabajador-nombre">
                  ${UI.escaparHtml(trabajador.nombres)}
                  ${UI.escaparHtml(trabajador.apellidos)}
                </div>

                <div class="fila-trabajador-meta">
                  DNI:
                  ${UI.escaparHtml(trabajador.dni)}
                  ·
                  ${UI.escaparHtml(
                    trabajador.cargo || 'Sin cargo'
                  )}
                  ·
                  ${UI.escaparHtml(
                    trabajador.area || 'Sin área'
                  )}
                </div>
              </div>

              <button
                class="btn-icono-qr"
                data-qr-id="${UI.escaparHtml(trabajador.id)}"
                title="Generar QR"
                type="button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <line x1="14" y1="14" x2="14" y2="21"/>
                  <line x1="21" y1="14" x2="21" y2="21"/>
                  <line x1="14" y1="17.5" x2="21" y2="17.5"/>
                </svg>
              </button>

              <div class="trabajador-estado-acciones">
                <span
                  class="badge badge-${
                    trabajador.estado === 'ACTIVO'
                      ? 'verde'
                      : 'rojo'
                  }"
                >
                  ${UI.escaparHtml(trabajador.estado)}
                </span>

                <div class="menu-trabajador">
                  <button
                    type="button"
                    class="btn-menu-trabajador"
                    data-menu-trabajador="${UI.escaparHtml(
                      trabajador.id
                    )}"
                    title="Opciones"
                    aria-label="Opciones del trabajador"
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>

                  <div
                    class="menu-trabajador-opciones"
                    data-menu-opciones="${UI.escaparHtml(
                      trabajador.id
                    )}"
                  >
                    <button
                      type="button"
                      class="opcion-trabajador editar"
                      data-editar-trabajador="${UI.escaparHtml(
                        trabajador.id
                      )}"
                    >
                      <span>✏️</span>
                      Editar
                    </button>

                    <button
                      type="button"
                      class="opcion-trabajador eliminar"
                      data-eliminar-trabajador="${UI.escaparHtml(
                        trabajador.id
                      )}"
                    >
                      <span>🗑️</span>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
        )
        .join('');

      /* Evento de la fila */

      contenedor
        .querySelectorAll('.fila-trabajador')
        .forEach(fila => {
          fila.addEventListener('click', evento => {
            if (
              evento.target.closest(
                '.check-fila-trabajador'
              ) ||
              evento.target.closest('.btn-icono-qr') ||
              evento.target.closest('.menu-trabajador')
            ) {
              return;
            }

            this.abrirPerfil(fila.dataset.id);
          });
        });

      /* Selección individual */

      contenedor
        .querySelectorAll('.check-fila-trabajador')
        .forEach(check => {
          check.addEventListener(
            'click',
            evento => evento.stopPropagation()
          );

          check.addEventListener('change', () => {
            this.toggleSeleccion(check.dataset.id);
          });
        });

      /* Botón QR */

      contenedor
        .querySelectorAll('.btn-icono-qr')
        .forEach(boton => {
          boton.addEventListener('click', evento => {
            evento.stopPropagation();

            QRManager.abrirModalQr(
              boton.dataset.qrId
            );
          });
        });

      /* Abrir menú de tres puntos */

      contenedor
        .querySelectorAll('[data-menu-trabajador]')
        .forEach(boton => {
          boton.addEventListener('click', evento => {
            evento.stopPropagation();

            const trabajadorId =
              boton.dataset.menuTrabajador;

            const menuSeleccionado =
              contenedor.querySelector(
                `[data-menu-opciones="${trabajadorId}"]`
              );

            if (!menuSeleccionado) {
              return;
            }

            const estabaAbierto =
              menuSeleccionado.classList.contains(
                'visible'
              );

            contenedor
              .querySelectorAll(
                '.menu-trabajador-opciones'
              )
              .forEach(menu => {
                menu.classList.remove('visible');
              });

            if (!estabaAbierto) {
              menuSeleccionado.classList.add(
                'visible'
              );
            }
          });
        });

      /* Editar trabajador */

      contenedor
        .querySelectorAll('[data-editar-trabajador]')
        .forEach(boton => {
          boton.addEventListener(
            'click',
            async evento => {
              evento.stopPropagation();

              contenedor
                .querySelectorAll(
                  '.menu-trabajador-opciones'
                )
                .forEach(menu => {
                  menu.classList.remove('visible');
                });

              await this.abrirPerfil(
                boton.dataset.editarTrabajador
              );
            }
          );
        });

      /* Eliminar trabajador */

      contenedor
        .querySelectorAll('[data-eliminar-trabajador]')
        .forEach(boton => {
          boton.addEventListener(
            'click',
            async evento => {
              evento.stopPropagation();

              contenedor
                .querySelectorAll(
                  '.menu-trabajador-opciones'
                )
                .forEach(menu => {
                  menu.classList.remove('visible');
                });

              await this.confirmarEliminarTrabajador(
                boton.dataset.eliminarTrabajador
              );
            }
          );
        });
    }

    const todosSeleccionados =
      filtrados.length > 0 &&
      filtrados.every(trabajador =>
        this.seleccionados.has(trabajador.id)
      );

    const checkTodos = document.getElementById(
      'check-seleccionar-todos'
    );

    if (checkTodos) {
      checkTodos.checked = todosSeleccionados;
    }

    this._actualizarBarraSeleccion();
  },

  /* ================= SELECCIÓN ================= */

  toggleSeleccion(id) {
    if (this.seleccionados.has(id)) {
      this.seleccionados.delete(id);
    } else {
      this.seleccionados.add(id);
    }

    this.renderizarListado();
  },

  toggleSeleccionarTodosVisibles(marcar) {
    this._filtradosVisibles.forEach(trabajador => {
      if (marcar) {
        this.seleccionados.add(trabajador.id);
      } else {
        this.seleccionados.delete(trabajador.id);
      }
    });

    this.renderizarListado();
  },

  limpiarSeleccion() {
    this.seleccionados.clear();
    this.renderizarListado();

    UI.toast(
      'Selección limpiada',
      'info'
    );
  },

  _actualizarBarraSeleccion() {
    const boton = document.getElementById(
      'btn-generar-carnets'
    );

    if (!boton) {
      return;
    }

    const cantidad = this.seleccionados.size;

    boton.textContent =
      cantidad > 0
        ? `🪪 GENERAR CARNETS SELECCIONADOS (${cantidad})`
        : '🪪 GENERAR CARNETS DE TODOS (PDF)';
  },

  async generarCarnets() {
    if (this.seleccionados.size > 0) {
      const trabajadores =
        await DB.obtenerTrabajadores();

      const seleccionados = trabajadores.filter(
        trabajador =>
          this.seleccionados.has(trabajador.id)
      );

      await QRManager.generarCarnetsPDF(
        seleccionados,
        'carnets-seleccionados'
      );
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

    document
      .querySelectorAll('.chip-filtro')
      .forEach(chip => {
        chip.classList.toggle(
          'activo',
          chip.dataset.estado === estado
        );
      });

    this.renderizarListado();
  },

  /* ================= ELIMINAR ================= */

  async confirmarEliminarTrabajador(id) {
    try {
      const trabajadores =
        await DB.obtenerTrabajadores();

      const trabajador = trabajadores.find(
        elemento => elemento.id === id
      );

      if (!trabajador) {
        UI.toast(
          'Trabajador no encontrado',
          'error'
        );

        return;
      }

      const nombreCompleto =
        `${trabajador.nombres} ${trabajador.apellidos}`
          .trim();

      const confirmado = confirm(
        `¿Eliminar al trabajador?\n\n` +
        `Nombre: ${nombreCompleto}\n` +
        `DNI: ${trabajador.dni}\n` +
        `Código: ${
          trabajador.qrId || trabajador.id
        }\n\n` +
        `Sus registros históricos se conservarán.`
      );

      if (!confirmado) {
        return;
      }

      /*
       * Si main.js ya contiene eliminarTrabajador,
       * utiliza esa función.
       */
      if (
        typeof DB.eliminarTrabajador === 'function'
      ) {
        await DB.eliminarTrabajador(id);
      } else {
        /*
         * Compatibilidad para versiones de main.js
         * que todavía no tengan esa función.
         */

        if (
          typeof Auth !== 'undefined' &&
          !Auth.puedeEditar()
        ) {
          throw new Error(
            'Tu cuenta no tiene permiso para eliminar'
          );
        }

        if (
          typeof Cloud !== 'undefined' &&
          Cloud.client &&
          Cloud.almacenId
        ) {
          const { error } = await Cloud.client
            .from('trabajadores')
            .delete()
            .eq('almacen_id', Cloud.almacenId)
            .eq('id', id);

          if (error) {
            throw new Error(
              `No se pudo eliminar en Supabase: ${error.message}`
            );
          }
        }

        const listaActualizada =
          trabajadores.filter(
            elemento => elemento.id !== id
          );

        _escribir(
          DB_KEYS.TRABAJADORES,
          listaActualizada
        );
      }

      this.seleccionados.delete(id);

      UI.toast(
        `✅ ${nombreCompleto} fue eliminado`,
        'exito'
      );

      await this.renderizarListado();
      await App.renderizarContadorGlobal();

      if (typeof Dashboard !== 'undefined') {
        Dashboard.actualizarSiVisible();
      }
    } catch (error) {
      console.error(
        'Error eliminando trabajador:',
        error
      );

      UI.toast(
        error?.message ||
          'No se pudo eliminar el trabajador',
        'error'
      );
    }
  },

  /* ================= PERFIL Y EDICIÓN ================= */

  perfilActualId: null,

  async abrirPerfil(id) {
    const trabajadores =
      await DB.obtenerTrabajadores();

    const trabajador = trabajadores.find(
      elemento => elemento.id === id
    );

    if (!trabajador) {
      UI.toast(
        'Trabajador no encontrado',
        'error'
      );

      return;
    }

    this.perfilActualId = id;
    UI.cerrarTodosLosModales();

    const modal = document.getElementById(
      'modal-perfil'
    );

    document.getElementById(
      'perfil-avatar'
    ).textContent = UI.iniciales(
      trabajador.nombres,
      trabajador.apellidos
    );

    document.getElementById(
      'perfil-nombre'
    ).textContent =
      `${trabajador.nombres} ${trabajador.apellidos}`;

    document.getElementById(
      'perfil-dni'
    ).textContent = `DNI: ${trabajador.dni}`;

    document.getElementById(
      'perfil-qr-id'
    ).textContent =
      trabajador.qrId || '—';

    const formulario = document.getElementById(
      'form-editar-perfil'
    );

    document.getElementById(
      'perfil-dni-input'
    ).value = trabajador.dni;

    formulario.nombres.value =
      trabajador.nombres || '';

    formulario.apellidos.value =
      trabajador.apellidos || '';

    formulario.cargo.value =
      trabajador.cargo || '';

    formulario.area.value =
      trabajador.area || '';

    formulario.estado.value =
      trabajador.estado || 'ACTIVO';

    modal.classList.add('visible');

    const overlay = document.getElementById(
      'modal-perfil-overlay'
    );

    if (overlay) {
      overlay.classList.add('visible');
    }
  },

  cerrarPerfil() {
    const modal = document.getElementById(
      'modal-perfil'
    );

    const overlay = document.getElementById(
      'modal-perfil-overlay'
    );

    if (modal) {
      modal.classList.remove('visible');
    }

    if (overlay) {
      overlay.classList.remove('visible');
    }

    this.perfilActualId = null;
  },

  async guardarPerfil(evento) {
    evento.preventDefault();

    if (!this.perfilActualId) {
      return;
    }

    const formulario = evento.target;

    try {
      await DB.actualizarTrabajador(
        this.perfilActualId,
        {
          nombres:
            formulario.nombres.value.trim(),

          apellidos:
            formulario.apellidos.value.trim(),

          cargo:
            formulario.cargo.value,

          area:
            formulario.area.value,

          estado:
            formulario.estado.value
        }
      );

      UI.toast(
        'Perfil actualizado correctamente',
        'exito'
      );

      this.cerrarPerfil();
      await this.renderizarListado();

      if (typeof Dashboard !== 'undefined') {
        Dashboard.actualizarSiVisible();
      }
    } catch (error) {
      console.error(
        'Error actualizando trabajador:',
        error
      );

      UI.toast(
        error?.message ||
          'No se pudo actualizar el trabajador',
        'error'
      );
    }
  }
};
