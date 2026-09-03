/**
 * ui.js
 * -----------------------------------------------------------------------
 * Utilidades de interfaz compartidas: toasts, formateo, iniciales.
 * -----------------------------------------------------------------------
 */

const UI = {

  toast(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('toast-contenedor');
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.textContent = mensaje;
    contenedor.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    const duracion = tipo === 'error' ? 5500 : 3000;
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, duracion);
  },

  iniciales(nombres, apellidos) {
    const n = (nombres || '').trim().charAt(0);
    const a = (apellidos || '').trim().charAt(0);
    return (n + a).toUpperCase() || '?';
  },

  formatearFecha(fechaISO) {
    if (!fechaISO) return '—';
    const [aaaa, mm, dd] = fechaISO.split('-');
    if (!aaaa || !mm || !dd) return fechaISO;
    return `${dd}/${mm}/${aaaa}`;
  },

  calcularEdad(fechaNacimientoISO) {
    if (!fechaNacimientoISO) return '—';
    const nacimiento = new Date(fechaNacimientoISO);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  },

  escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[caracter]));
  },

  // Cierra cualquier modal que haya quedado abierto antes de mostrar uno nuevo,
  // para evitar que dos modales queden apilados visualmente al mismo tiempo.
  cerrarTodosLosModales() {
    document.querySelectorAll('.modal.visible').forEach(m => m.classList.remove('visible'));
    document.querySelectorAll('.modal-overlay.visible').forEach(o => o.classList.remove('visible'));
  }
};


/**
 * theme.js
 * -----------------------------------------------------------------------
 * Fondos completos para personalizar la apariencia de la aplicación.
 * El tema seleccionado se guarda en localStorage.
 * -----------------------------------------------------------------------
 */

const TEMA_KEY = 'asistencia_tema';

const TEMAS = [
  { id:'blanco', nombre:'Blanco', fondo:'#FFFFFF', superficie:'#FFFFFF', texto:'#111827', g700:'#374151', g500:'#6B7280', g300:'#D1D5DB', g200:'#E5E7EB', g100:'#F3F4F6', g50:'#FFFFFF' },
  { id:'gris', nombre:'Gris oscuro', fondo:'#17191D', superficie:'#25282D', texto:'#F3F4F6', g700:'#D1D5DB', g500:'#9CA3AF', g300:'#6B7280', g200:'#444951', g100:'#32363D', g50:'#202328' },
  { id:'oscuro', nombre:'Azul oscuro', fondo:'#020B18', superficie:'#092342', texto:'#F8FBFF', g700:'#D5E3F2', g500:'#9DB2CA', g300:'#58718E', g200:'#294B6D', g100:'#133655', g50:'#061A35' }
];

const Theme = {

  actual: 'gris',

  init() {
    const guardado = localStorage.getItem(TEMA_KEY);
    this.actual = TEMAS.some(t => t.id === guardado) ? guardado : 'gris';
    this.aplicar(this.actual, false);
  },

  aplicar(id, guardar = true) {
    const tema = TEMAS.find(t => t.id === id) || TEMAS[0];
    const raiz = document.documentElement.style;
    document.documentElement.dataset.temaFondo = tema.id;
    raiz.setProperty('--fondo-app', tema.fondo);
    raiz.setProperty('--blanco', tema.superficie);
    raiz.setProperty('--gris-900', tema.texto);
    raiz.setProperty('--gris-700', tema.g700);
    raiz.setProperty('--gris-500', tema.g500);
    raiz.setProperty('--gris-300', tema.g300);
    raiz.setProperty('--gris-200', tema.g200);
    raiz.setProperty('--gris-100', tema.g100);
    raiz.setProperty('--gris-50', tema.g50);
    const esOscuro = tema.id === 'oscuro' || tema.id === 'gris';
    raiz.setProperty('--verde-claro', esOscuro ? '#173B2B' : '#F0FDF4');
    raiz.setProperty('--rojo-claro', esOscuro ? '#43242A' : '#FEF2F2');
    raiz.setProperty('--naranja-claro', esOscuro ? '#45301F' : '#FFF7ED');
    raiz.setProperty('--azul-claro', esOscuro ? '#24344F' : '#EFF4FF');
    this.actual = tema.id;
    if (guardar) {
      localStorage.setItem(TEMA_KEY, tema.id);
    }
    if (typeof Dashboard !== 'undefined' && document.getElementById('vista-reportes')?.classList.contains('activa')) {
      requestAnimationFrame(() => Dashboard.actualizar());
    }
  },

  renderizarSelector() {
    const contenedor = document.getElementById('grid-temas');
    if (!contenedor) return;

    contenedor.innerHTML = TEMAS.map(t => `
      <button type="button" class="tarjeta-tema ${this.actual === t.id ? 'seleccionado' : ''}"
        data-tema="${t.id}"
        style="--tema-fondo:${t.fondo}; --tema-superficie:${t.superficie}; --tema-texto:${t.texto};">
        <span class="tarjeta-tema-check">✓</span>
        <span class="tarjeta-tema-muestra"></span>
        <span class="tarjeta-tema-nombre">${t.nombre}</span>
      </button>
    `).join('');

    contenedor.querySelectorAll('.tarjeta-tema').forEach(btn => {
      btn.addEventListener('click', () => {
        this.aplicar(btn.dataset.tema);
        this.renderizarSelector();
        UI.toast('Tema aplicado', 'exito');
      });
    });
  }
};


/**
 * seed.js
 * -----------------------------------------------------------------------
 * Genera datos de prueba: 40 trabajadores ficticios y registros de
 * asistencia variados para que Reportes e Historial tengan información
 * desde el primer momento.
 * -----------------------------------------------------------------------
 */

const Seed = {

  generarTrabajadores(cantidad = 40) {
    const nombres = [
      'Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Rosa', 'Pedro', 'Carmen',
      'Miguel', 'Lucía', 'Jorge', 'Patricia', 'Fernando', 'Diana', 'Ricardo',
      'Elena', 'Manuel', 'Sofía', 'Andrés', 'Valeria', 'Raúl', 'Gabriela',
      'Óscar', 'Karen', 'Víctor', 'Milagros', 'Enrique', 'Paola', 'Iván',
      'Cynthia', 'Alberto', 'Fiorella', 'Marco', 'Yesenia', 'Gustavo',
      'Roxana', 'Hernán', 'Katherine', 'Adrián', 'Vanessa'
    ];
    const apellidos = [
      'García', 'Pérez', 'Rodríguez', 'López', 'Gómez', 'Sánchez', 'Ramos',
      'Torres', 'Flores', 'Díaz', 'Vásquez', 'Castillo', 'Rojas', 'Chávez',
      'Mendoza', 'Reyes', 'Morales', 'Herrera', 'Medina', 'Aguilar',
      'Vargas', 'Cruz', 'Ortiz', 'Silva', 'Núñez', 'Paredes', 'Salazar',
      'Ríos', 'Guerrero', 'Campos'
    ];
    const cargos = ['Operario', 'Técnico', 'Supervisor', 'Almacenero', 'Analista', 'Chofer', 'Auxiliar'];
    const areas = ['Almacén', 'Producción', 'Logística', 'Mantenimiento', 'Calidad', 'Administración'];
    const turnosIds = ['T01', 'T02', 'T03'];

    const trabajadores = [];
    for (let i = 0; i < cantidad; i++) {
      const nombre = nombres[i % nombres.length];
      const apellido1 = apellidos[i % apellidos.length];
      const apellido2 = apellidos[(i + 7) % apellidos.length];
      const dni = String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8);
      const anioNacimiento = 1970 + Math.floor(Math.random() * 30);
      const mesNacimiento = 1 + Math.floor(Math.random() * 12);
      const diaNacimiento = 1 + Math.floor(Math.random() * 28);
      const fechaNacimiento = `${anioNacimiento}-${String(mesNacimiento).padStart(2, '0')}-${String(diaNacimiento).padStart(2, '0')}`;

      const anioIngreso = 2018 + Math.floor(Math.random() * 8);
      const mesIngreso = 1 + Math.floor(Math.random() * 12);
      const diaIngreso = 1 + Math.floor(Math.random() * 28);
      const fechaIngreso = `${anioIngreso}-${String(mesIngreso).padStart(2, '0')}-${String(diaIngreso).padStart(2, '0')}`;

      trabajadores.push({
        id: 'seed-' + i + '-' + dni,
        dni,
        nombres: nombre,
        apellidos: `${apellido1} ${apellido2}`,
        fechaNacimiento,
        cargo: cargos[i % cargos.length],
        area: areas[i % areas.length],
        fechaIngreso,
        telefono: '9' + String(10000000 + Math.floor(Math.random() * 89999999)).slice(0, 8),
        estado: Math.random() < 0.9 ? 'ACTIVO' : 'INACTIVO',
        qrId: 'EMP-' + String(i + 1).padStart(5, '0'),
        turnoAsignado: turnosIds[i % turnosIds.length]
      });
    }
    return trabajadores;
  },

  generarAsistencias(trabajadores) {
    const turnos = [
      { id: 'T01', nombre: 'TURNO 01', inicio: '06:00' },
      { id: 'T02', nombre: 'TURNO 02', inicio: '14:00' },
      { id: 'T03', nombre: 'TURNO 03', inicio: '22:00' }
    ];
    const registros = [];
    const hoy = new Date();

    // Genera asistencias para los últimos 5 días (incluyendo hoy)
    for (let dOffset = 4; dOffset >= 0; dOffset--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - dOffset);
      const fechaISO = _fechaLocalISO(fecha);

      trabajadores
        .filter(t => t.estado === 'ACTIVO')
        .forEach((trabajador) => {
          // ~80% de asistencia por día
          if (Math.random() > 0.8) return;

          const turno = turnos.find(t => t.id === trabajador.turnoAsignado) || turnos[0];
          const [hBase, mBase] = turno.inicio.split(':').map(Number);

          // desviación aleatoria en minutos respecto a la hora de inicio
          const desviacion = Math.floor(Math.random() * 25) - 5; // -5 a +19 min
          let minutosEntrada = hBase * 60 + mBase + Math.max(desviacion, -5);
          minutosEntrada = ((minutosEntrada % 1440) + 1440) % 1440;
          const hEntrada = Math.floor(minutosEntrada / 60);
          const mEntrada = minutosEntrada % 60;
          const horaEntrada = `${String(hEntrada).padStart(2, '0')}:${String(mEntrada).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

          const estado = desviacion > 10 ? 'TARDANZA' : 'PRESENTE';

          // si no es el día de hoy, generar también la salida
          const esHoy = fechaISO === _fechaLocalISO(hoy);
          let horaSalida = null;
          let horasTrabajadas = null;
          let estadoFinal = estado;

          if (!esHoy || Math.random() > 0.3) {
            let minutosSalida = minutosEntrada + 8 * 60 - Math.floor(Math.random() * 10);
            minutosSalida = minutosSalida % 1440;
            const hSalida = Math.floor(minutosSalida / 60);
            const mSalida = minutosSalida % 60;
            horaSalida = `${String(hSalida).padStart(2, '0')}:${String(mSalida).padStart(2, '0')}:00`;

            let diffMin = minutosSalida - minutosEntrada;
            if (diffMin < 0) diffMin += 1440;
            const horas = Math.floor(diffMin / 60);
            const minutos = Math.round(diffMin % 60);
            horasTrabajadas = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
            estadoFinal = estado;
          }

          registros.push({
            id: 'seed-a-' + fechaISO + '-' + trabajador.dni,
            dni: trabajador.dni,
            nombreCompleto: `${trabajador.nombres} ${trabajador.apellidos}`,
            fecha: fechaISO,
            turnoId: turno.id,
            turnoNombre: turno.nombre,
            horaEntrada,
            horaSalida,
            horasTrabajadas,
            estado: estadoFinal,
            estadoEntrada: estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL',
            estadoSalida: horaSalida ? 'A TIEMPO' : null,
            metodo: Math.random() < 0.75 ? 'QR' : 'DNI'
          });
        });
    }

    return registros.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  }
};




function _leer(key, porDefecto) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return porDefecto;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo', key, e);
    return porDefecto;
  }
}

function _escribir(key, valor) {
  try {
    if (key === DB_KEYS.ASISTENCIAS && typeof Cloud !== 'undefined' && Cloud.usuarioId) {
      const normalizados = Cloud.actualizarMemoriaAsistencias(valor);
      Cloud.programar(key, normalizados);
      return true;
    }
    localStorage.setItem(key, JSON.stringify(valor));
    if (typeof Cloud !== 'undefined') Cloud.programar(key, valor);
    return true;
  } catch (e) {
    console.error('Error guardando', key, e);
    throw new Error('No se pudo guardar la información. Revisa el espacio disponible del navegador.');
  }
}

function _exigirPermisoEdicion() {
  if (typeof Auth !== 'undefined' && Auth.usuarioActual && !Auth.puedeEditar()) {
    throw new Error('Tu cuenta tiene permiso de solo lectura');
  }
}

function _uuid() {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function _hoyISO() {
  return _fechaLocalISO();
}

// Fecha del dispositivo en horario local. Evita el desfase de toISOString(),
// que usa UTC y puede cambiar de día antes que Colombia.
function _fechaLocalISO(fecha = new Date()) {
  const aaaa = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${aaaa}-${mm}-${dd}`;
}

function _sumarDiasISO(fechaISO, dias) {
  const [aaaa, mm, dd] = fechaISO.split('-').map(Number);
  const fecha = new Date(aaaa, mm - 1, dd);
  fecha.setDate(fecha.getDate() + dias);
  return _fechaLocalISO(fecha);
}

function _esTurnoNocturno(turno) {
  return !!turno && horaAMinutos(turno.fin) <= horaAMinutos(turno.inicio);
}

// El turno nocturno pertenece al día en que comenzó. Entre medianoche y su
// hora de fin, cualquier entrada/salida se asocia con la fecha anterior.
function _fechaOperativaTurno(turno, ahora = new Date()) {
  const hoy = _fechaLocalISO(ahora);
  if (_esTurnoNocturno(turno) && (ahora.getHours() * 60 + ahora.getMinutes()) <= horaAMinutos(turno.fin)) {
    return _sumarDiasISO(hoy, -1);
  }
  return hoy;
}

function _estaEnVentanaEntrada(turno, ahora = new Date()) {
  if (!turno) return false;
  const actual = ahora.getHours() * 60 + ahora.getMinutes();
  const inicio = horaAMinutos(turno.inicio);
  const diferencia = ((((actual - inicio + 12 * 60) % (24 * 60)) + 24 * 60) % (24 * 60)) - 12 * 60;
  return diferencia >= -120 && diferencia <= 360;
}

function _solicitarClaveOculta(mensaje) {
  return new Promise(resolve => {
    const fondo = document.createElement('div');
    fondo.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.62);display:grid;place-items:center;padding:20px';
    fondo.innerHTML = `<form style="width:min(390px,100%);background:var(--fondo-tarjeta,#fff);color:var(--texto-principal,#172033);border:1px solid var(--borde,#dbe2ea);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.35)"><h3 style="margin:0 0 8px">Verificación de seguridad</h3><p style="margin:0 0 16px;color:var(--texto-secundario,#64748b)">${UI.escaparHtml(mensaje)}</p><input type="password" autocomplete="current-password" required style="width:100%;box-sizing:border-box;padding:13px;border:1px solid var(--borde,#cbd5e1);border-radius:10px;background:var(--fondo-app,#fff);color:inherit"><div style="display:flex;gap:10px;margin-top:16px"><button type="button" data-cancelar style="flex:1;padding:11px;border-radius:10px;border:1px solid var(--borde,#cbd5e1);background:transparent;color:inherit">Cancelar</button><button type="submit" style="flex:1;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:700">Continuar</button></div></form>`;
    const form = fondo.querySelector('form');
    const input = fondo.querySelector('input');
    const terminar = valor => { fondo.remove(); resolve(valor); };
    form.addEventListener('submit', e => { e.preventDefault(); terminar(input.value); });
    fondo.querySelector('[data-cancelar]').addEventListener('click', () => terminar(null));
    fondo.addEventListener('click', e => { if (e.target === fondo) terminar(null); });
    document.body.appendChild(fondo);
    input.focus();
  });
}

function _nombreSupervisor(perfil) {
  if (!perfil) return 'No identificado';
  return `${perfil.nombres || ''} ${perfil.apellidos || ''}`.trim() || 'No identificado';
}

/* ------------------------------------------------------------------- */
/* Turnos por defecto                                                   */
/* ------------------------------------------------------------------- */

const TURNOS_POR_DEFECTO = [
  { id: 'T01', nombre: 'TURNO 01', inicio: '06:00', fin: '14:00', icono: 'sun' },
  { id: 'T02', nombre: 'TURNO 02', inicio: '14:00', fin: '22:00', icono: 'sunset' },
  { id: 'T03', nombre: 'TURNO 03', inicio: '22:00', fin: '05:00', icono: 'moon' }
];

/* ------------------------------------------------------------------- */
/* API pública: DB                                                      */
/* Todas las funciones son async para que el reemplazo por Supabase     */
/* (que también es async) sea transparente.                             */
/* ------------------------------------------------------------------- */

const DB = {

  async obtenerPerfilSupervisor() {
    return _leer(DB_KEYS.PERFIL, null);
  },

  async guardarPerfilSupervisor(perfil) {
    const guardado = {
      nombres: String(perfil.nombres || '').trim(),
      apellidos: String(perfil.apellidos || '').trim(),
      dni: String(perfil.dni || '').trim(),
      cargo: String(perfil.cargo || 'Supervisor').trim(),
      area: String(perfil.area || '').trim()
    };
    _escribir(DB_KEYS.PERFIL, guardado);
    return guardado;
  },

  /* ---------- Inicialización ---------- */

  async init() {
    if (_leer(DB_KEYS.TURNOS, null) === null) {
      _escribir(DB_KEYS.TURNOS, TURNOS_POR_DEFECTO);
    } else {
      const turnosGuardados = _leer(DB_KEYS.TURNOS, TURNOS_POR_DEFECTO);
      const nocturno = turnosGuardados.find(t => t.id === 'T03');
      if (nocturno && nocturno.inicio === '22:00' && nocturno.fin === '06:00') {
        nocturno.fin = '05:00';
        _escribir(DB_KEYS.TURNOS, turnosGuardados);
      }
    }
    if (_leer(DB_KEYS.TRABAJADORES, null) === null) {
      _escribir(DB_KEYS.TRABAJADORES, []);
    } else {
      await this._migrarQrIds();
      await this._migrarTurnoAsignado();
    }
    if (_leer(DB_KEYS.ASISTENCIAS, null) === null) {
      _escribir(DB_KEYS.ASISTENCIAS, []);
    } else {
      await this._migrarMetodoAsistencias();
      await this._migrarEstadosAsistencias();
    }
    if (_leer(DB_KEYS.PROGRAMACIONES, null) === null) {
      _escribir(DB_KEYS.PROGRAMACIONES, []);
    }
    await this._migrarCierresALotes();
    return true;
  },

  async resetearDatos() {
    if (Cloud.client && Cloud.usuarioId && Cloud.almacenId) {
      const { error: estadoError } = await Cloud.client.from('estado_almacen').delete().eq('almacen_id', Cloud.almacenId);
      if (estadoError) throw estadoError;
      const { error: asistenciaError } = await Cloud.client.from('asistencias_almacen').delete().eq('almacen_id', Cloud.almacenId);
      if (asistenciaError) throw asistenciaError;
    }
    localStorage.removeItem(DB_KEYS.TRABAJADORES);
    localStorage.removeItem(DB_KEYS.ASISTENCIAS);
    localStorage.removeItem(DB_KEYS.TURNOS);
    localStorage.removeItem(DB_KEYS.CIERRES);
    localStorage.removeItem(DB_KEYS.PROGRAMACIONES);
    Cloud.asistenciasMemoria = [];
    Cloud.asistenciasCambiosPendientes.clear();
    Cloud.asistenciasEliminadasPendientes.clear();
    Cloud.pendientes.delete(DB_KEYS.ASISTENCIAS);
    Cloud.guardarEliminadosLocales();
    await this.init();
    return true;
  },

  /* ---------- Migraciones (compatibilidad con datos guardados previamente) ---------- */

  // Asigna un qrId a trabajadores guardados antes de que existiera el sistema de QR.
  async _migrarQrIds() {
    const trabajadores = await this.obtenerTrabajadores();
    let cambiado = false;
    trabajadores.forEach(t => {
      if (!t.qrId) {
        t.qrId = this._generarQrId(trabajadores);
        cambiado = true;
      }
    });
    if (cambiado) _escribir(DB_KEYS.TRABAJADORES, trabajadores);
  },

  // Asigna metodo:'DNI' a registros guardados antes de que existiera el escáner QR.
  async _migrarMetodoAsistencias() {
    const registros = await this.obtenerAsistencias();
    let cambiado = false;
    registros.forEach(r => {
      if (!r.metodo) {
        r.metodo = 'DNI';
        cambiado = true;
      }
    });
    if (cambiado) _escribir(DB_KEYS.ASISTENCIAS, registros);
  },

  // Separa la condición de entrada y de salida sin borrar registros antiguos.
  async _migrarEstadosAsistencias() {
    const registros = await this.obtenerAsistencias();
    const turnos = await this.obtenerTurnos();
    let cambiado = false;
    registros.forEach(r => {
      if (!r.estadoEntrada) {
        r.estadoEntrada = r.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL';
        cambiado = true;
      }
      if (r.horaSalida && !r.estadoSalida) {
        const turno = turnos.find(t => t.id === r.turnoId);
        r.estadoSalida = _clasificarSalida(r, turno);
        cambiado = true;
      }
      const estadoCompatible = r.estadoEntrada === 'TARDANZA' ? 'TARDANZA' : 'PRESENTE';
      if (r.estado !== estadoCompatible) {
        r.estado = estadoCompatible;
        cambiado = true;
      }
    });
    if (cambiado) _escribir(DB_KEYS.ASISTENCIAS, registros);
  },

  async _migrarCierresALotes() {
    const claveMigracion = 'asistencia_migracion_lotes_v1';
    if (_leer(claveMigracion, false)) return;
    const cierres = _leer(DB_KEYS.CIERRES, []);
    const registros = await this.obtenerAsistencias();
    cierres.forEach(cierre => {
      registros.forEach(registro => {
        if (!registro.finalizado && registro.fecha === cierre.fecha && registro.turnoId === cierre.turnoId) {
          registro.finalizado = true;
          registro.cierreId = cierre.id;
          registro.finalizadoEn = registro.finalizadoEn || new Date().toISOString();
        }
      });
    });
    _escribir(DB_KEYS.ASISTENCIAS, registros);
    _escribir(claveMigracion, true);
  },

  // Genera el siguiente identificador único de QR: EMP-00001, EMP-00002...
  _generarQrId(trabajadoresExistentes) {
    let max = 0;
    trabajadoresExistentes.forEach(t => {
      if (t.qrId) {
        const m = /^EMP-(\d+)$/.exec(t.qrId);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      }
    });
    return 'EMP-' + String(max + 1).padStart(5, '0');
  },

  // Asigna un turno habitual (round-robin) a trabajadores guardados antes de
  // que existiera el campo turnoAsignado. Necesario para poder calcular
  // "personal programado por turno" en el dashboard con datos reales.
  async _migrarTurnoAsignado() {
    const trabajadores = await this.obtenerTrabajadores();
    const turnos = await this.obtenerTurnos();
    let cambiado = false;
    trabajadores.forEach((t, i) => {
      if (!t.turnoAsignado) {
        t.turnoAsignado = (turnos[i % turnos.length] || turnos[0]).id;
        cambiado = true;
      }
    });
    if (cambiado) _escribir(DB_KEYS.TRABAJADORES, trabajadores);
  },

  /* ---------- Turnos ---------- */

  async obtenerTurnos() {
    return _leer(DB_KEYS.TURNOS, TURNOS_POR_DEFECTO);
  },

  async guardarTurnos(turnos) {
    _escribir(DB_KEYS.TURNOS, turnos);
    return turnos;
  },

  /* ---------- Trabajadores ---------- */

  async obtenerTrabajadores() {
    return _leer(DB_KEYS.TRABAJADORES, []);
  },

  async buscarPorDni(dni) {
    const trabajadores = await this.obtenerTrabajadores();
    return trabajadores.find(t => t.dni === String(dni).trim()) || null;
  },

  async buscarPorQrId(qrId) {
    const trabajadores = await this.obtenerTrabajadores();
    const buscado = String(qrId || '').trim().toUpperCase();
    return trabajadores.find(t => String(t.qrId || '').trim().toUpperCase() === buscado) || null;
  },

  /* ---------- Programación diaria por cantidades ---------- */

  async obtenerProgramaciones(filtros = {}) {
    let datos = _leer(DB_KEYS.PROGRAMACIONES, []);
    if (filtros.fecha) datos = datos.filter(p => p.fecha === filtros.fecha);
    if (filtros.fechaInicio) datos = datos.filter(p => p.fecha >= filtros.fechaInicio);
    if (filtros.fechaFin) datos = datos.filter(p => p.fecha <= filtros.fechaFin);
    return datos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  async obtenerProgramacion(fecha) {
    return _leer(DB_KEYS.PROGRAMACIONES, []).find(p => p.fecha === fecha) || null;
  },

  async guardarProgramacion(fecha, cantidades) {
    _exigirPermisoEdicion();
    const turnos = await this.obtenerTurnos();
    const normalizadas = {};
    turnos.forEach(t => { normalizadas[t.id] = Math.max(0, parseInt(cantidades[t.id], 10) || 0); });
    const datos = _leer(DB_KEYS.PROGRAMACIONES, []);
    const supervisor = await this.obtenerPerfilSupervisor();
    const programacion = { fecha, cantidades: normalizadas, actualizadoEn: new Date().toISOString(), supervisor: supervisor ? { ...supervisor } : null };
    const indice = datos.findIndex(p => p.fecha === fecha);
    if (indice >= 0) datos[indice] = programacion; else datos.push(programacion);
    _escribir(DB_KEYS.PROGRAMACIONES, datos);
    return programacion;
  },

  async eliminarProgramacion(fecha) {
    _exigirPermisoEdicion();
    const datos = _leer(DB_KEYS.PROGRAMACIONES, []).filter(p => p.fecha !== fecha);
    _escribir(DB_KEYS.PROGRAMACIONES, datos);
    return true;
  },

  async obtenerCantidadProgramada(fecha, turnoId) {
    const programacion = await this.obtenerProgramacion(fecha);
    if (programacion) return Math.max(0, Number(programacion.cantidades?.[turnoId]) || 0);
    const cierre = await this.obtenerCierre(fecha, turnoId);
    return cierre ? Math.max(0, Number(cierre.programado) || 0) : 0;
  },

  async crearTrabajador(datos) {
    _exigirPermisoEdicion();
    const trabajadores = await this.obtenerTrabajadores();
    const existente = trabajadores.find(t => t.dni === datos.dni);
    if (existente) {
      throw new Error('Ya existe un trabajador con ese DNI');
    }
    const turnos = await this.obtenerTurnos();
    const nuevo = {
      id: _uuid(),
      dni: String(datos.dni).trim(),
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      fechaNacimiento: datos.fechaNacimiento || '',
      cargo: datos.cargo || '',
      area: datos.area || '',
      fechaIngreso: datos.fechaIngreso || _hoyISO(),
      telefono: datos.telefono || '',
      estado: datos.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO',
      qrId: this._generarQrId(trabajadores),
      turnoAsignado: datos.turnoAsignado || (turnos[0] && turnos[0].id) || 'T01'
    };
    trabajadores.push(nuevo);
    _escribir(DB_KEYS.TRABAJADORES, trabajadores);
    return nuevo;
  },

  async actualizarTrabajador(id, cambios) {
    _exigirPermisoEdicion();
    const trabajadores = await this.obtenerTrabajadores();
    const idx = trabajadores.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Trabajador no encontrado');
    trabajadores[idx] = { ...trabajadores[idx], ...cambios };
    _escribir(DB_KEYS.TRABAJADORES, trabajadores);
    return trabajadores[idx];
  },

  async cambiarEstadoTrabajador(id, estado) {
    return this.actualizarTrabajador(id, { estado });
  },

  /* ---------- Asistencias ---------- */

  async obtenerAsistencias() {
    if (typeof Cloud !== 'undefined' && Cloud.usuarioId) return Cloud.obtenerAsistenciasMemoria();
    return _leer(DB_KEYS.ASISTENCIAS, []);
  },

  async obtenerAsistenciaAbierta(dni, turnoId = null) {
    const registros = await this.obtenerAsistencias();
    return registros.find(r => r.dni === dni && !r.finalizado && !r.horaSalida && (!turnoId || r.turnoId === turnoId)) || null;
  },

  // Devuelve el registro de asistencia de HOY para ese trabajador, esté abierto
  // (solo entrada) o completo (entrada + salida). Se usa para evitar duplicados.
  async obtenerAsistenciaDeHoy(dni, turnoId = null) {
    const registros = await this.obtenerAsistencias();
    const turnos = await this.obtenerTurnos();
    const turno = turnos.find(t => t.id === turnoId) || null;
    const fechaJornada = _fechaOperativaTurno(turno);
    return registros.find(r => r.dni === dni && r.fecha === fechaJornada && (!turnoId || r.turnoId === turnoId)) || null;
  },

  async registrarEntrada({ dni, nombreCompleto, turnoId, turnoNombre, metodo = 'DNI' }) {
    _exigirPermisoEdicion();
    const registros = await this.obtenerAsistencias();
    const ahora = new Date();
    const horaStr = ahora.toTimeString().slice(0, 8);

    const turnos = await this.obtenerTurnos();
    const turno = turnos.find(t => t.id === turnoId);
    if (!turno) throw new Error('Turno no encontrado');
    const fechaJornada = _fechaOperativaTurno(turno, ahora);
    if (!_estaEnVentanaEntrada(turno, ahora)) throw new Error(`La hora actual no corresponde a la ventana de entrada de ${turno.nombre}`);
    if (await this.obtenerCierre(fechaJornada, turnoId)) throw new Error('Este turno ya fue finalizado y no admite nuevos registros');
    if (registros.some(r => r.dni === dni && r.fecha === fechaJornada && r.turnoId === turnoId)) throw new Error('El trabajador ya tiene un registro en este turno');
    const supervisor = await this.obtenerPerfilSupervisor();
    const estadoEntrada = _clasificarEntrada(horaStr, turno);

    const nuevo = {
      id: _uuid(),
      dni,
      nombreCompleto,
      fecha: fechaJornada,
      turnoId,
      turnoNombre,
      horaEntrada: horaStr,
      horaSalida: null,
      horasTrabajadas: null,
      estado: estadoEntrada === 'TARDANZA' ? 'TARDANZA' : 'PRESENTE',
      estadoEntrada,
      estadoSalida: null,
      supervisorEntrada: supervisor ? { ...supervisor } : null,
      supervisorSalida: null,
      metodo,
      metodoEntrada: metodo
    };
    registros.unshift(nuevo);
    _escribir(DB_KEYS.ASISTENCIAS, registros);
    return nuevo;
  },

  async registrarSalida(registroId, metodo = 'DNI') {
    _exigirPermisoEdicion();
    const registros = await this.obtenerAsistencias();
    const idx = registros.findIndex(r => r.id === registroId);
    if (idx === -1) throw new Error('Registro no encontrado');

    const registro = registros[idx];
    const ahora = new Date();
    const horaSalida = ahora.toTimeString().slice(0, 8);
    const turnos = await this.obtenerTurnos();
    const turno = turnos.find(t => t.id === registro.turnoId);
    const supervisor = await this.obtenerPerfilSupervisor();

    registro.horaSalida = horaSalida;
    registro.metodoSalida = metodo;
    registro.horasTrabajadas = _calcularHoras(registro.horaEntrada, horaSalida);
    registro.estadoSalida = _clasificarSalida(registro, turno);
    registro.minutosSalidaAnticipada = _minutosSalidaAnticipada(registro, turno);
    registro.supervisorSalida = supervisor ? { ...supervisor } : null;
    registro.estadoEntrada = registro.estadoEntrada || (registro.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL');
    registro.estado = registro.estadoEntrada === 'TARDANZA' ? 'TARDANZA' : 'PRESENTE';

    registros[idx] = registro;
    _escribir(DB_KEYS.ASISTENCIAS, registros);
    return registro;
  },

  async actualizarRegistroAsistencia(registroId, { dni, horaEntrada, horaSalida }) {
    _exigirPermisoEdicion();
    const registros = await this.obtenerAsistencias();
    const idx = registros.findIndex(r => r.id === registroId);
    if (idx === -1) throw new Error('Registro no encontrado');

    const registro = registros[idx];
    if (registro.finalizado) throw new Error('El turno ya fue finalizado y este registro no puede modificarse');
    const duplicado = registros.find(r => r.id !== registroId && r.dni === dni && r.fecha === registro.fecha && r.turnoId === registro.turnoId);
    if (duplicado) throw new Error('Ese trabajador ya tiene un registro en este turno');

    const trabajador = await this.buscarPorDni(dni);
    if (!trabajador) throw new Error('Trabajador no encontrado');

    const turnos = await this.obtenerTurnos();
    const turno = turnos.find(t => t.id === registro.turnoId);
    const entradaNormalizada = horaEntrada.length === 5 ? `${horaEntrada}:00` : horaEntrada;
    const salidaNormalizada = horaSalida ? (horaSalida.length === 5 ? `${horaSalida}:00` : horaSalida) : null;
    const estadoEntrada = _clasificarEntrada(entradaNormalizada, turno);
    const supervisor = await this.obtenerPerfilSupervisor();

    registro.dni = trabajador.dni;
    registro.nombreCompleto = `${trabajador.nombres} ${trabajador.apellidos}`;
    registro.horaEntrada = entradaNormalizada;
    registro.horaSalida = salidaNormalizada;
    registro.horasTrabajadas = salidaNormalizada ? _calcularHoras(entradaNormalizada, salidaNormalizada) : null;
    registro.estadoEntrada = estadoEntrada;
    registro.estado = estadoEntrada === 'TARDANZA' ? 'TARDANZA' : 'PRESENTE';
    registro.estadoSalida = salidaNormalizada ? _clasificarSalida(registro, turno) : null;
    registro.minutosSalidaAnticipada = salidaNormalizada ? _minutosSalidaAnticipada(registro, turno) : 0;
    registro.supervisorEdicion = supervisor ? { ...supervisor } : null;

    registros[idx] = registro;
    _escribir(DB_KEYS.ASISTENCIAS, registros);
    await this.sincronizarCierreSiExiste(registro.fecha, registro.turnoId);
    return registro;
  },

  async eliminarRegistroAsistencia(registroId) {
    _exigirPermisoEdicion();
    const registros = await this.obtenerAsistencias();
    const registro = registros.find(r => r.id === registroId);
    if (!registro) throw new Error('Registro no encontrado');
    const supervisor = await this.obtenerPerfilSupervisor();
    const eliminados = _leer('asistencia_registros_eliminados', []);
    eliminados.unshift({ ...registro, eliminadoEn: new Date().toISOString(), supervisorEliminacion: supervisor ? { ...supervisor } : null });
    _escribir('asistencia_registros_eliminados', eliminados);
    _escribir(DB_KEYS.ASISTENCIAS, registros.filter(r => r.id !== registroId));
    await this.sincronizarCierreSiExiste(registro.fecha, registro.turnoId);
    return registro;
  },

  async marcarRegistrosFinalizados(registroIds, cierreId) {
    const ids = new Set(registroIds);
    const registros = await this.obtenerAsistencias();
    const ahora = new Date().toISOString();
    registros.forEach(r => {
      if (ids.has(r.id)) {
        r.finalizado = true;
        r.cierreId = cierreId;
        r.finalizadoEn = ahora;
      }
    });
    _escribir(DB_KEYS.ASISTENCIAS, registros);
  },

  async sincronizarCierreSiExiste(fecha, turnoId) {
    const cierres = _leer(DB_KEYS.CIERRES, []);
    const idx = cierres.findIndex(c => c.fecha === fecha && c.turnoId === turnoId);
    if (idx === -1) return null;
    const registros = (await this.obtenerAsistencias()).filter(r => r.fecha === fecha && r.turnoId === turnoId);
    const presentesSet = new Set(registros.map(r => r.dni));
    const programado = await this.obtenerCantidadProgramada(fecha, turnoId);
    cierres[idx] = {
      ...cierres[idx],
      programado,
      presentes: presentesSet.size,
      ausentes: Math.max(programado - presentesSet.size, 0),
      tardanzas: registros.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length,
      personalProgramado: [],
      personalAusente: []
    };
    _escribir(DB_KEYS.CIERRES, cierres);
    return cierres[idx];
  },

  async obtenerHistorial(filtros = {}) {
    let registros;
    if (Cloud.client && Cloud.usuarioId && navigator.onLine) {
      try {
        if (Cloud.pendientes.has(DB_KEYS.ASISTENCIAS)) await Cloud.sincronizarPendiente(DB_KEYS.ASISTENCIAS);
        registros = await Cloud.consultarAsistenciasRemotas({
          fechaInicio: filtros.fechaInicio,
          fechaFin: filtros.fechaFin,
          dni: filtros.dni,
          turnoId: filtros.turnoId,
          finalizado: true
        });
        Cloud.actualizarEstadoSync(Cloud.pendientes.size ? 'sincronizando' : 'guardado');
      } catch (error) {
        console.error('No se pudo consultar el historial en Supabase; se usará la caché reciente', error);
        Cloud.actualizarEstadoSync('sin-conexion');
        registros = (await this.obtenerAsistencias()).filter(r => r.finalizado === true);
      }
    } else {
      registros = (await this.obtenerAsistencias()).filter(r => r.finalizado === true);
    }

    if (filtros.fechaInicio) {
      registros = registros.filter(r => r.fecha >= filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      registros = registros.filter(r => r.fecha <= filtros.fechaFin);
    }
    if (filtros.dni) {
      registros = registros.filter(r => r.dni === filtros.dni);
    }
    if (filtros.turnoId) {
      registros = registros.filter(r => r.turnoId === filtros.turnoId);
    }
    if (filtros.estado) {
      registros = registros.filter(r => r.estado === filtros.estado || r.estadoEntrada === filtros.estado || r.estadoSalida === filtros.estado);
    }
    return registros.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  },

  /* ---------- Cierre de registro de turno ---------- */

  async obtenerCierres(filtros = {}) {
    let cierres = _leer(DB_KEYS.CIERRES, []);
    const unicos = new Map();
    cierres.forEach(c => unicos.set(`${c.fecha}|${c.turnoId}`, c));
    cierres = Array.from(unicos.values());
    if (filtros.fechaInicio) cierres = cierres.filter(c => c.fecha >= filtros.fechaInicio);
    if (filtros.fechaFin) cierres = cierres.filter(c => c.fecha <= filtros.fechaFin);
    if (filtros.turnoId) cierres = cierres.filter(c => c.turnoId === filtros.turnoId);
    return cierres;
  },

  async obtenerCierre(fecha, turnoId) {
    const cierres = _leer(DB_KEYS.CIERRES, []);
    return [...cierres].reverse().find(c => c.fecha === fecha && c.turnoId === turnoId) || null;
  },

  async registrarCierreTurno({ fecha = _hoyISO(), turnoId, turnoNombre, programado, presentes, ausentes, tardanzas, personalProgramado = [], personalAusente = [] }) {
    _exigirPermisoEdicion();
    const cierres = _leer(DB_KEYS.CIERRES, []);
    if (cierres.some(c => c.fecha === fecha && c.turnoId === turnoId)) throw new Error('Este turno ya fue finalizado anteriormente');
    const supervisor = await this.obtenerPerfilSupervisor();
    const ahora = new Date();
    const horaCierre = ahora.toTimeString().slice(0, 5);

    const cierre = {
      id: _uuid(),
      fecha,
      turnoId,
      turnoNombre,
      horaCierre,
      programado,
      presentes,
      ausentes,
      tardanzas,
      // La programación es por cantidades; nunca se asignan identidades a los ausentes.
      personalProgramado: [],
      personalAusente: [],
      supervisorCierre: supervisor ? { ...supervisor } : null
    };
    cierres.push(cierre);
    _escribir(DB_KEYS.CIERRES, cierres);
    return cierre;
  },

  async generarSimulacionDosSemanas() {
    await this.eliminarSimulacion(false);
    const turnos = await this.obtenerTurnos();
    const nombres = [
      ['Ana', 'Mendoza'], ['Bruno', 'Salazar'], ['Carla', 'Rojas'], ['Diego', 'Torres'],
      ['Elena', 'Vargas'], ['Fabio', 'Castillo'], ['Gabriela', 'Flores'], ['Hugo', 'Reyes'],
      ['Irene', 'Paredes'], ['Javier', 'Campos'], ['Karla', 'Medina'], ['Luis', 'Guerrero']
    ];
    const trabajadoresDemo = nombres.map((nombre, i) => ({
      id: `demo-trabajador-${i + 1}`,
      dni: String(91000001 + i),
      nombres: nombre[0],
      apellidos: nombre[1],
      cargo: ['Operario', 'Técnico', 'Auxiliar'][i % 3],
      area: ['Producción', 'Calidad', 'Logística'][i % 3],
      estado: 'ACTIVO',
      qrId: `DEMO-${String(i + 1).padStart(3, '0')}`,
      turnoAsignado: (turnos[i % turnos.length] || turnos[0]).id,
      esDemo: true
    }));
    _escribir(DB_KEYS.TRABAJADORES, [..._leer(DB_KEYS.TRABAJADORES, []), ...trabajadoresDemo]);

    const perfilDemo = { nombres: 'Supervisor', apellidos: 'Demostración', dni: '99999999', cargo: 'Supervisor', area: 'Simulación' };
    const registrosDemo = [];
    const cierresDemo = [];
    const hoy = _hoyISO();
    const horaDesdeMinutos = minutos => {
      const normalizados = ((minutos % 1440) + 1440) % 1440;
      return `${String(Math.floor(normalizados / 60)).padStart(2, '0')}:${String(normalizados % 60).padStart(2, '0')}:00`;
    };

    for (let desplazamiento = 13; desplazamiento >= 0; desplazamiento--) {
      const fecha = _sumarDiasISO(hoy, -desplazamiento);
      turnos.forEach((turno, indiceTurno) => {
        const programados = trabajadoresDemo.filter(t => t.turnoAsignado === turno.id);
        const presentes = [];
        programados.forEach((trabajador, indice) => {
          const patron = desplazamiento * 17 + indiceTurno * 7 + indice;
          if (patron % 11 === 0) return;
          const tardanza = patron % 5 === 0;
          const sinSalida = desplazamiento === 0 ? patron % 3 === 0 : patron % 19 === 0;
          const entradaMin = horaAMinutos(turno.inicio) + (tardanza ? 15 + (patron % 26) : -5 + (patron % 11));
          const entrada = horaDesdeMinutos(entradaMin);
          let salida = null;
          let horasTrabajadas = null;
          let estadoSalida = null;
          if (!sinSalida) {
            const finBase = horaAMinutos(turno.fin);
            const variacionSalida = patron % 6 === 0 ? -35 : (patron % 7 === 0 ? 25 : 0);
            salida = horaDesdeMinutos(finBase + variacionSalida);
            horasTrabajadas = _calcularHoras(entrada, salida);
            estadoSalida = variacionSalida < 0 ? 'SALIDA ANTICIPADA' : (variacionSalida > 0 ? 'SALIDA DESPUÉS DE HORA' : 'SALIDA A TIEMPO');
          }
          const registro = {
            id: `demo-registro-${fecha}-${trabajador.dni}`,
            dni: trabajador.dni,
            nombreCompleto: `${trabajador.nombres} ${trabajador.apellidos}`,
            fecha,
            turnoId: turno.id,
            turnoNombre: turno.nombre,
            horaEntrada: entrada,
            horaSalida: salida,
            horasTrabajadas,
            estado: tardanza ? 'TARDANZA' : 'PRESENTE',
            estadoEntrada: tardanza ? 'TARDANZA' : 'PUNTUAL',
            estadoSalida,
            supervisorEntrada: { ...perfilDemo },
            supervisorSalida: salida ? { ...perfilDemo } : null,
            metodo: patron % 2 === 0 ? 'QR' : 'DNI',
            finalizado: desplazamiento > 0,
            esDemo: true
          };
          registrosDemo.push(registro);
          presentes.push(registro);
        });

        if (desplazamiento > 0) {
          const presentesDni = new Set(presentes.map(r => r.dni));
          const personalProgramado = programados.map(t => ({ dni: t.dni, nombreCompleto: `${t.nombres} ${t.apellidos}` }));
          cierresDemo.push({
            id: `demo-cierre-${fecha}-${turno.id}`,
            fecha, turnoId: turno.id, turnoNombre: turno.nombre, horaCierre: turno.fin,
            programado: programados.length,
            presentes: presentesDni.size,
            ausentes: programados.length - presentesDni.size,
            tardanzas: presentes.filter(r => r.estadoEntrada === 'TARDANZA').length,
            personalProgramado,
            personalAusente: personalProgramado.filter(p => !presentesDni.has(p.dni)),
            supervisorCierre: { ...perfilDemo },
            esDemo: true
          });
        }
      });
    }

    _escribir(DB_KEYS.ASISTENCIAS, [...registrosDemo, ...await this.obtenerAsistencias()]);
    _escribir(DB_KEYS.CIERRES, [...cierresDemo, ..._leer(DB_KEYS.CIERRES, [])]);
    localStorage.setItem('asistencia_demo_2_semanas_v1', 'generado');
    return { trabajadores: trabajadoresDemo.length, registros: registrosDemo.length, dias: 14 };
  },

  async eliminarSimulacion(actualizarMarca = true) {
    _escribir(DB_KEYS.TRABAJADORES, _leer(DB_KEYS.TRABAJADORES, []).filter(item => !item.esDemo));
    _escribir(DB_KEYS.ASISTENCIAS, (await this.obtenerAsistencias()).filter(item => !item.esDemo));
    _escribir(DB_KEYS.CIERRES, _leer(DB_KEYS.CIERRES, []).filter(item => !item.esDemo));
    if (actualizarMarca) localStorage.setItem('asistencia_demo_2_semanas_v1', 'eliminado');
    return true;
  },

  /* ---------- Reportes ---------- */

  async obtenerResumenDelDia(fecha = _hoyISO()) {
    const trabajadores = await this.obtenerTrabajadores();
    const registros = (await this.obtenerAsistencias()).filter(r => r.fecha === fecha);

    const totalTrabajadores = trabajadores.filter(t => t.estado === 'ACTIVO').length;
    const presentes = registros.filter(r => r.estadoEntrada === 'PUNTUAL' || r.estadoEntrada === 'TARDANZA' || r.estado === 'PRESENTE' || r.estado === 'TARDANZA').length;
    const tardanzas = registros.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
    const ausentes = Math.max(totalTrabajadores - registros.length, 0);
    const registroPorQr = registros.filter(r => r.metodo === 'QR').length;
    const registroPorDni = registros.filter(r => r.metodo !== 'QR').length;

    const porTurno = {};
    const turnos = await this.obtenerTurnos();
    turnos.forEach(t => { porTurno[t.id] = { turno: t, cantidad: 0 }; });
    registros.forEach(r => {
      if (porTurno[r.turnoId]) porTurno[r.turnoId].cantidad++;
    });

    return {
      totalTrabajadores,
      presentes,
      ausentes,
      tardanzas,
      registroPorQr,
      registroPorDni,
      porTurno: Object.values(porTurno)
    };
  },

  async obtenerReporteDetallado(filtros = {}) {
    return this.obtenerHistorial(filtros);
  }
};

function _calcularHoras(horaEntrada, horaSalida) {
  const [he, me, se] = horaEntrada.split(':').map(Number);
  const [hs, ms, ss] = horaSalida.split(':').map(Number);
  let minutosEntrada = he * 60 + me + (se || 0) / 60;
  let minutosSalida = hs * 60 + ms + (ss || 0) / 60;
  let diff = minutosSalida - minutosEntrada;
  if (diff < 0) diff += 24 * 60; // turno nocturno que cruza medianoche
  const horas = Math.floor(diff / 60);
  const minutos = Math.round(diff % 60);
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function _clasificarEntrada(horaEntrada, turno) {
  if (!horaEntrada || !turno) return 'PUNTUAL';
  const entradaMin = horaAMinutos(horaEntrada);
  const inicioMin = horaAMinutos(turno.inicio);
  const diferencia = ((((entradaMin - inicioMin + 12 * 60) % (24 * 60)) + 24 * 60) % (24 * 60)) - 12 * 60;
  return diferencia > 10 ? 'TARDANZA' : 'PUNTUAL';
}

function _clasificarSalida(registro, turno) {
  if (!registro || !registro.horaSalida || !turno) return null;
  let salidaMin = horaAMinutos(registro.horaSalida);
  let finMin = horaAMinutos(turno.fin);
  if (_esTurnoNocturno(turno)) {
    finMin += 24 * 60;
    if (salidaMin <= horaAMinutos(turno.fin)) salidaMin += 24 * 60;
  }
  if (salidaMin < finMin) return 'SALIDA ANTICIPADA';
  if (salidaMin > finMin) return 'SALIDA DESPUÉS DE HORA';
  return 'SALIDA A TIEMPO';
}

function _minutosSalidaAnticipada(registro, turno) {
  if (!registro || !registro.horaSalida || !turno) return 0;
  let salidaMin = horaAMinutos(registro.horaSalida);
  let finMin = horaAMinutos(turno.fin);
  if (_esTurnoNocturno(turno)) {
    finMin += 24 * 60;
    if (salidaMin <= horaAMinutos(turno.fin)) salidaMin += 24 * 60;
  }
  return Math.max(finMin - salidaMin, 0);
}

/* ------------------------------------------------------------------- */
/* Utilidades de tiempo compartidas (usadas también por dashboard.js)   */
/* ------------------------------------------------------------------- */

// "HH:MM" o "HH:MM:SS" -> minutos totales desde medianoche
function horaAMinutos(horaStr) {
  if (!horaStr) return null;
  const [h, m] = horaStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

// Duración de un turno en minutos, contemplando turnos que cruzan medianoche
function duracionTurnoMinutos(turno) {
  if (!turno) return 480; // 8h por defecto
  let ini = horaAMinutos(turno.inicio);
  let fin = horaAMinutos(turno.fin);
  let diff = fin - ini;
  if (diff <= 0) diff += 24 * 60;
  return diff;
}

// "HH:MM" -> minutos totales (para promediar horas trabajadas)
function horasTrabajadasAMinutos(horasStr) {
  if (!horasStr) return 0;
  const [h, m] = horasStr.split(':').map(Number);
  return h * 60 + (m || 0);
}




/**
 * scanner.js
 * -----------------------------------------------------------------------
 * Escáner de códigos QR usando la cámara del dispositivo (getUserMedia)
 * y la librería jsQR para decodificar cada cuadro de video.
 *
 * NOTA: los navegadores solo permiten acceso a la cámara en contextos
 * seguros (HTTPS o localhost). Si el archivo se abre directamente como
 * file://, la cámara no estará disponible y se mostrará un aviso.
 * -----------------------------------------------------------------------
 */

const Scanner = {
  stream: null,
  animId: null,
  activo: false,
  lectorPromise: null,

  async asegurarLector() {
    if (typeof window.jsQR === 'function') return true;
    if (this.lectorPromise) return this.lectorPromise;

    const fuentes = [
      'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
      'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js'
    ];
    this.lectorPromise = (async () => {
      for (const fuente of fuentes) {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = fuente;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          if (typeof window.jsQR === 'function') return true;
        } catch (_) {}
      }
      return false;
    })();

    const disponible = await this.lectorPromise;
    if (!disponible) {
      this.lectorPromise = null;
      UI.toast('No se pudo cargar el lector QR. Revisa la conexión o los bloqueadores del navegador.', 'error');
    }
    return disponible;
  },

  extraerIdentificador(valor) {
    let texto = String(valor || '').replace(/^\uFEFF/, '').trim();
    if (!texto) return '';

    try {
      const json = JSON.parse(texto);
      texto = String(json.qrId || json.qr || json.codigo || json.id || texto).trim();
    } catch (_) {}

    try {
      const url = new URL(texto);
      texto = url.searchParams.get('qrId') || url.searchParams.get('qr') ||
        url.searchParams.get('codigo') || url.pathname.split('/').filter(Boolean).pop() || texto;
    } catch (_) {}

    const coincidencia = String(texto).toUpperCase().match(/EMP[-_\s]?\d+/);
    return coincidencia ? coincidencia[0].replace(/[_\s]/g, '-') : String(texto).trim();
  },

  procesarImagen(imagen) {
    if (typeof window.jsQR !== 'function') return false;
    const codigo = window.jsQR(imagen.data, imagen.width, imagen.height, { inversionAttempts: 'attemptBoth' });
    if (!codigo || !codigo.data) return false;

    const identificador = this.extraerIdentificador(codigo.data);
    if (!identificador) return false;
    this.cerrar();
    Workers.buscarPorQr(identificador);
    return true;
  },

  async abrir() {
    const video = document.getElementById('video-qr');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      UI.toast('La cámara requiere HTTPS. Puedes seleccionar una foto del QR.', 'alerta');
      return;
    }

    if (!await this.asegurarLector()) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      video.srcObject = this.stream;
      await video.play();
      this.activo = true;
      this.tick();
    } catch (err) {
      console.error('Error de cámara:', err);
      this.mostrarErrorCamara(err);
    }
  },

  mostrarErrorCamara(err) {
    const nombre = err && err.name;
    let mensaje;

    if (nombre === 'NotAllowedError' || nombre === 'PermissionDeniedError') {
      mensaje = '🚫 Permiso de cámara denegado. Revisa los permisos del sitio en tu navegador (ícono de candado junto a la URL) y permite el acceso a la cámara.';
    } else if (nombre === 'NotFoundError' || nombre === 'DevicesNotFoundError') {
      mensaje = '❌ No se encontró ninguna cámara en este dispositivo.';
    } else if (nombre === 'NotReadableError' || nombre === 'TrackStartError') {
      mensaje = '⚠️ La cámara está siendo usada por otra aplicación. Ciérrala e inténtalo de nuevo.';
    } else if (nombre === 'OverconstrainedError' || nombre === 'ConstraintNotSatisfiedError') {
      mensaje = '⚠️ La cámara no cumple los requisitos solicitados.';
    } else if (nombre === 'SecurityError' || location.protocol === 'file:') {
      mensaje = '🔒 La cámara requiere una conexión segura (HTTPS) o localhost. No funciona al abrir el archivo directamente.';
    } else {
      mensaje = 'No se pudo acceder a la cámara. Revisa los permisos o usa una conexión segura (HTTPS).';
    }

    UI.toast(mensaje, 'error');
  },

  tick() {
    if (!this.activo) return;

    const video = document.getElementById('video-qr');
    const canvas = document.getElementById('canvas-qr-oculto');

    if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (this.procesarImagen(imagen)) return;
      } catch (e) {
        // Frame no disponible aún, se reintenta en el siguiente tick
      }
    }

    this.animId = requestAnimationFrame(() => this.tick());
  },

  async cargarImagen(archivo) {
    if (!archivo || !await this.asegurarLector()) return;
    const canvas = document.getElementById('canvas-qr-oculto');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    try {
      const bitmap = await createImageBitmap(archivo);
      const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * escala));
      canvas.height = Math.max(1, Math.round(bitmap.height * escala));
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const imagen = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (!this.procesarImagen(imagen)) UI.toast('No se detectó un QR válido. Acerca la cámara y evita reflejos.', 'alerta');
    } catch (err) {
      console.error('Error leyendo imagen QR:', err);
      UI.toast('No se pudo leer la imagen seleccionada.', 'error');
    } finally {
      document.getElementById('input-imagen-qr').value = '';
    }
  },

  cerrar() {
    this.activo = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    const video = document.getElementById('video-qr');
    if (video) video.srcObject = null;
  }
};


/**
 * qr.js
 * -----------------------------------------------------------------------
 * Generación del QR individual de cada trabajador (con descarga PNG) y
 * generación masiva de carnets (NOMBRE + QR) en PDF listo para imprimir
 * en hojas A4 (2 columnas × 5 filas = 10 carnets por página).
 *
 * El QR solo contiene el identificador qrId (ej. "EMP-00001"), nunca
 * datos personales del trabajador.
 * -----------------------------------------------------------------------
 */

const QRManager = {

  trabajadorQrActual: null,

  /* ---------- QR individual ---------- */

  async abrirModalQr(trabajadorId) {
    const trabajadores = await DB.obtenerTrabajadores();
    const trabajador = trabajadores.find(t => t.id === trabajadorId);
    if (!trabajador) return;

    this.trabajadorQrActual = trabajador;

    UI.cerrarTodosLosModales();

    document.getElementById('qr-nombre').textContent = `${trabajador.nombres} ${trabajador.apellidos}`;
    document.getElementById('qr-codigo-texto').textContent = trabajador.qrId;

    const contenedor = document.getElementById('qr-contenedor-individual');
    contenedor.innerHTML = '';
    // eslint-disable-next-line no-undef
    new QRCode(contenedor, {
      text: trabajador.qrId,
      width: 190,
      height: 190,
      correctLevel: QRCode.CorrectLevel.M
    });

    document.getElementById('modal-qr').classList.add('visible');
    document.getElementById('modal-qr-overlay').classList.add('visible');
  },

  cerrarModalQr() {
    document.getElementById('modal-qr').classList.remove('visible');
    document.getElementById('modal-qr-overlay').classList.remove('visible');
  },

  descargarQrActual() {
    if (!this.trabajadorQrActual) return;
    const contenedor = document.getElementById('qr-contenedor-individual');
    const canvas = contenedor.querySelector('canvas');
    if (!canvas) {
      UI.toast('No se pudo generar el QR', 'error');
      return;
    }
    const nombreArchivo = `QR_${this.trabajadorQrActual.nombres}_${this.trabajadorQrActual.apellidos}`
      .replace(/\s+/g, '_')
      .toUpperCase();

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}.png`;
    a.click();
  },

  /* ---------- Carnets masivos en PDF ---------- */

  async generarCarnetsPDF(listaTrabajadores = null, nombreArchivo = null) {
    const trabajadores = listaTrabajadores || (await DB.obtenerTrabajadores()).filter(t => t.estado === 'ACTIVO');
    if (trabajadores.length === 0) {
      UI.toast('No hay trabajadores para generar carnets', 'alerta');
      return;
    }

    if (!window.jspdf || !window.QRCode) {
      UI.toast('No se pudieron cargar las librerías de PDF/QR. Verifica tu conexión a internet.', 'error');
      return;
    }

    UI.toast('Generando carnets, espera un momento...', 'info');

    // Generamos el QR de cada trabajador en un contenedor oculto temporal
    const temporal = document.createElement('div');
    temporal.style.position = 'fixed';
    temporal.style.left = '-9999px';
    temporal.style.top = '0';
    document.body.appendChild(temporal);

    const datos = [];
    for (const t of trabajadores) {
      const div = document.createElement('div');
      temporal.appendChild(div);
      // eslint-disable-next-line no-undef
      new QRCode(div, { text: t.qrId, width: 240, height: 240, correctLevel: QRCode.CorrectLevel.M });
      const canvas = div.querySelector('canvas');
      datos.push({
        nombre: `${t.nombres} ${t.apellidos}`.toUpperCase(),
        dataUrl: canvas ? canvas.toDataURL('image/png') : null
      });
    }
    document.body.removeChild(temporal);

    // eslint-disable-next-line no-undef
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const cols = 3, filas = 3;
    const anchoCarnet = 55, altoCarnet = 88; // formato credencial vertical (con orificio para cordón)
    const margenX = (210 - cols * anchoCarnet) / (cols + 1);
    const margenY = 10;
    const espacioY = (297 - margenY * 2 - filas * altoCarnet) / (filas - 1 || 1);

    datos.forEach((item, i) => {
      const posEnPagina = i % (cols * filas);
      if (i > 0 && posEnPagina === 0) doc.addPage();

      const col = posEnPagina % cols;
      const fila = Math.floor(posEnPagina / cols);
      const x = margenX + col * (anchoCarnet + margenX);
      const y = margenY + fila * (altoCarnet + espacioY);

      this._dibujarCarnetBadge(doc, x, y, anchoCarnet, altoCarnet, item.nombre, item.dataUrl);
    });

    doc.save(`${nombreArchivo || 'carnets-personal'}-${_hoyISO()}.pdf`);
    UI.toast('Carnets generados correctamente', 'exito');
  },

  /**
   * Dibuja un carnet individual estilo credencial corporativa dentro del PDF:
   * franja roja diagonal superior, logo, nombre, QR enmarcado y franja roja
   * inferior en forma de "V" con el lema de la empresa.
   */
  _dibujarCarnetBadge(doc, x, y, w, h, nombre, qrDataUrl) {
    const ROJO_OSC = [100, 0, 0];
    const ROJO = [125, 0, 0];
    const ORO = [205, 154, 38];
    const NEGRO = [8, 8, 8];

    // Fondo blanco + borde de corte
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.15);
    doc.roundedRect(x, y, w, h, 3, 3, 'S');

    // Cinta diagonal roja en la esquina superior izquierda
    doc.setFillColor(...ROJO_OSC);
    doc.triangle(x, y, x + w * 0.37, y, x, y + h * 0.17, 'F');
    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.5);
    doc.line(x + w * 0.37, y, x, y + h * 0.17);

    // Orificio para cordón
    doc.setFillColor(238, 238, 238);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.15);
    doc.roundedRect(x + w * 0.36, y + h * 0.047, w * 0.28, h * 0.027, 2, 2, 'FD');

    // Línea dorada con rombo central
    this._lineaDorada(doc, x, y + h * 0.235, w, ORO, true);

    // Nombre del trabajador, calibrado para ocupar el ancho disponible
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NEGRO);
    this._ajustarFontSizeParaAncho(doc, nombre, w * 0.78, 'bold', 17);
    doc.text(nombre, x + w / 2, y + h * 0.292, { align: 'center', maxWidth: w * 0.82 });

    // Línea dorada simple
    this._lineaDorada(doc, x, y + h * 0.322, w, ORO, false);

    // Relieves y puntos decorativos laterales como en la referencia.
    doc.setDrawColor(246, 246, 246);
    doc.setLineWidth(0.45);
    for (let i = 0; i < 4; i++) {
      const d = i * 1.35;
      doc.line(x + d, y + h * 0.47, x + w * 0.13 + d, y + h * 0.57);
      doc.line(x + w - d, y + h * 0.49, x + w * 0.87 - d, y + h * 0.59);
    }
    doc.setFillColor(...ORO);
    for (let i = 0; i < 13; i++) {
      const filaPunto = i % 7;
      const columnaPunto = Math.floor(i / 7);
      doc.circle(x + 1.3 + columnaPunto * 1.25, y + h * (0.49 + filaPunto * 0.014), 0.14, 'F');
      doc.circle(x + w - 1.3 - columnaPunto * 1.25, y + h * (0.60 + filaPunto * 0.014), 0.14, 'F');
    }

    // Recuadro del QR
    const qrTam = w * 0.61;
    const qrX = x + (w - qrTam) / 2;
    const qrY = y + h * 0.365;
    doc.setDrawColor(...ROJO);
    doc.setLineWidth(0.7);
    doc.rect(qrX, qrY, qrTam, qrTam, 'S');
    if (qrDataUrl) {
      const pad = qrTam * 0.065;
      doc.addImage(qrDataUrl, 'PNG', qrX + pad, qrY + pad, qrTam - pad * 2, qrTam - pad * 2);
    }

    // Franja roja inferior en forma de "V"
    const yBase = y + h;
    const yBorde = y + h * 0.80;
    const yValle = y + h * 0.875;
    const cx = x + w / 2;

    doc.setFillColor(...ROJO_OSC);
    doc.triangle(x, yBorde, cx, yValle, x, yBase, 'F');
    doc.triangle(cx, yValle, x + w, yBase, x, yBase, 'F');
    doc.triangle(cx, yValle, x + w, yBorde, x + w, yBase, 'F');

    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.5);
    doc.line(x, yBorde, cx, yValle);
    doc.line(cx, yValle, x + w, yBorde);

    // Corona decorativa dorada
    const cy = y + h * 0.918;
    doc.setFillColor(...ORO);
    doc.triangle(cx - 2.2, cy, cx - 0.9, cy - 2.4, cx, cy, 'F');
    doc.triangle(cx - 0.9, cy, cx, cy - 3.2, cx + 0.9, cy, 'F');
    doc.triangle(cx, cy, cx + 0.9, cy - 2.4, cx + 2.2, cy, 'F');
    doc.rect(cx - 2.2, cy, 4.4, 0.8, 'F');
    doc.setDrawColor(...ORO);
    doc.setLineWidth(0.28);
    doc.line(x + w * 0.08, cy - 0.3, cx - 5, cy - 0.3);
    doc.line(cx + 5, cy - 0.3, x + w * 0.92, cy - 0.3);

    // Lema
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    this._ajustarFontSizeParaAncho(doc, 'COMPROMETIDOS CON LA EXCELENCIA', w * 0.84, 'bold');
    doc.text('COMPROMETIDOS CON LA EXCELENCIA', cx, y + h * 0.958, { align: 'center' });
  },

  /**
   * Calcula y aplica (setFontSize) el tamaño de fuente exacto para que `texto`
   * ocupe `anchoObjetivoMM` de ancho en el documento actual. jsPDF define el
   * tamaño de fuente siempre en puntos, así que se calibra midiendo con un
   * tamaño de referencia y escalando proporcionalmente.
   */
  _ajustarFontSizeParaAncho(doc, texto, anchoObjetivoMM, estiloFuente = 'normal', maximo = 40) {
    const REFERENCIA_PT = 10;
    doc.setFont('helvetica', estiloFuente);
    doc.setFontSize(REFERENCIA_PT);
    const anchoBase = doc.getTextWidth(texto) || 1;
    let tamFinal = REFERENCIA_PT * (anchoObjetivoMM / anchoBase);
    tamFinal = Math.min(Math.max(tamFinal, 5), maximo);
    doc.setFontSize(tamFinal);
    return tamFinal;
  },

  _lineaDorada(doc, x, y, w, colorOro, conRombo) {
    doc.setDrawColor(...colorOro);
    doc.setLineWidth(0.35);
    const margen = w * 0.14;
    if (conRombo) {
      const cx = x + w / 2;
      doc.line(x + margen, y, cx - 2.2, y);
      doc.line(cx + 2.2, y, x + w - margen, y);
      doc.setFillColor(...colorOro);
      doc.triangle(cx - 2.2, y, cx, y - 1.3, cx + 2.2, y, 'F');
      doc.triangle(cx - 2.2, y, cx, y + 1.3, cx + 2.2, y, 'F');
    } else {
      doc.line(x + margen, y, x + w - margen, y);
    }
  }
};


/**


 * attendance.js
 * -----------------------------------------------------------------------
 * Reloj en tiempo real, selección de turno, ficha del trabajador y
 * registro de entrada / salida.
 * -----------------------------------------------------------------------
 */

const Attendance = {

  turnoSeleccionado: null,
  registroAbierto: null,
  registroHoy: null,
  metodoActual: 'DNI',
  trabajadorInactivoActual: false,
  registroEditandoId: null,
  ocultarListaTrasCierre: false,
  _timeoutRegreso: null,
  DELAY_AUTO_REGRESO: 1600,

  /* ---------- Reloj en tiempo real ---------- */

  iniciarReloj() {
    this.actualizarReloj();
    setInterval(() => this.actualizarReloj(), 1000);
  },

  actualizarReloj() {
    const ahora = new Date();
    const hh = String(ahora.getHours()).padStart(2, '0');
    const mm = String(ahora.getMinutes()).padStart(2, '0');
    const ss = String(ahora.getSeconds()).padStart(2, '0');

    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dd = String(ahora.getDate()).padStart(2, '0');
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const aaaa = ahora.getFullYear();

    document.querySelectorAll('.reloj-hh').forEach(el => el.textContent = hh);
    document.querySelectorAll('.reloj-mm').forEach(el => el.textContent = mm);
    document.querySelectorAll('.reloj-ss').forEach(el => el.textContent = ss);
    document.querySelectorAll('.reloj-fecha').forEach(el => el.textContent = `${dd} / ${mes} / ${aaaa}`);
    document.querySelectorAll('.reloj-dia').forEach(el => el.textContent = dias[ahora.getDay()]);

    this.moverManecillas(ahora);
  },

  moverManecillas(ahora) {
    const horas = ahora.getHours() % 12;
    const minutos = ahora.getMinutes();
    const segundos = ahora.getSeconds();

    const gradosHora = horas * 30 + minutos * 0.5;
    const gradosMinuto = minutos * 6 + segundos * 0.1;
    const gradosSegundo = segundos * 6;

    const manecillaHora = document.getElementById('manecilla-hora');
    const manecillaMinuto = document.getElementById('manecilla-minuto');
    const manecillaSegundo = document.getElementById('manecilla-segundo');

    if (manecillaHora) manecillaHora.style.transform = `rotate(${gradosHora}deg)`;
    if (manecillaMinuto) manecillaMinuto.style.transform = `rotate(${gradosMinuto}deg)`;
    if (manecillaSegundo) manecillaSegundo.style.transform = `rotate(${gradosSegundo}deg)`;
  },

  /* ---------- Selección de turno ---------- */

  async renderizarTurnos() {
    const turnos = await DB.obtenerTurnos();
    const contenedor = document.getElementById('lista-turnos');
    if (!contenedor) return;

    const iconos = { sun: '☀️', sunset: '🌇', moon: '🌙' };

    contenedor.innerHTML = turnos.map(t => `
      <button class="tarjeta-turno ${this.turnoSeleccionado === t.id ? 'seleccionado' : ''}" data-turno="${t.id}">
        <span class="tarjeta-turno-check">✓</span>
        <span class="tarjeta-turno-icono">${iconos[t.icono] || '🕐'}</span>
        <span class="tarjeta-turno-nombre">${t.nombre}</span>
        <span class="tarjeta-turno-horario">${t.inicio} - ${t.fin}</span>
      </button>
    `).join('');

    contenedor.querySelectorAll('.tarjeta-turno').forEach(btn => {
      btn.addEventListener('click', () => this.seleccionarTurno(btn.dataset.turno));
    });
  },

  async seleccionarTurno(turnoId) {
    this.turnoSeleccionado = turnoId;
    this.ocultarListaTrasCierre = false;
    await this.renderizarTurnos();
    await this.renderizarRegistrosHoy();
    document.getElementById('panel-busqueda-trabajador').classList.remove('oculto');
  },

  async obtenerTurnoActual() {
    const turnos = await DB.obtenerTurnos();
    return turnos.find(t => t.id === this.turnoSeleccionado) || null;
  },

  /* ---------- Ficha del trabajador y registro automático ---------- */

  async mostrarFichaTrabajador(trabajador, metodo = 'DNI') {
    if (this._timeoutRegreso) {
      clearTimeout(this._timeoutRegreso);
      this._timeoutRegreso = null;
    }

    this.metodoActual = metodo;

    document.getElementById('panel-busqueda').classList.add('oculto');
    document.getElementById('panel-scanner').classList.add('oculto');
    document.getElementById('panel-no-encontrado').classList.add('oculto');
    if (typeof Workers !== 'undefined') Workers.cerrarModalNuevo();

    const panel = document.getElementById('panel-ficha');
    // La ficha completa no se muestra durante el marcado para evitar confusión.
    // Sus elementos permanecen ocultos porque el flujo automático reutiliza
    // algunos de ellos para calcular y comunicar el resultado.
    panel.classList.add('oculto');

    document.getElementById('ficha-avatar').textContent = UI.iniciales(trabajador.nombres, trabajador.apellidos);
    document.getElementById('ficha-nombre').textContent = `${trabajador.nombres} ${trabajador.apellidos}`;
    document.getElementById('ficha-dni').textContent = `DNI: ${trabajador.dni}`;
    document.getElementById('ficha-estado').textContent = trabajador.estado;
    document.getElementById('ficha-estado').className = `badge badge-${trabajador.estado === 'ACTIVO' ? 'verde' : 'rojo'}`;

    const metodoEl = document.getElementById('ficha-metodo');
    metodoEl.textContent = metodo === 'QR' ? '📷 QR' : '🔎 DNI';
    metodoEl.className = `badge badge-${metodo === 'QR' ? 'azul' : 'naranja'}`;

    document.getElementById('ficha-nacimiento').textContent = UI.formatearFecha(trabajador.fechaNacimiento);
    document.getElementById('ficha-edad').textContent = `${UI.calcularEdad(trabajador.fechaNacimiento)} años`;
    document.getElementById('ficha-cargo').textContent = trabajador.cargo;
    document.getElementById('ficha-area').textContent = trabajador.area;
    document.getElementById('ficha-ingreso').textContent = UI.formatearFecha(trabajador.fechaIngreso);
    document.getElementById('ficha-telefono').textContent = trabajador.telefono || '—';
    document.getElementById('ficha-qrid').textContent = trabajador.qrId || '—';

    const turno = await this.obtenerTurnoActual();
    document.getElementById('ficha-turno').textContent = turno ? `${turno.nombre} (${turno.inicio} - ${turno.fin})` : 'Sin turno seleccionado';

    this.trabajadorInactivoActual = trabajador.estado !== 'ACTIVO';
    this.registroHoy = await DB.obtenerAsistenciaDeHoy(trabajador.dni, turno ? turno.id : null);

    await this.procesarRegistroAutomatico(trabajador, turno);
    if (typeof Workers !== 'undefined') Workers.volverABuscar();
  },

  async procesarRegistroAutomatico(trabajador, turno) {
    const bloqueAuto = document.getElementById('bloque-registro-auto');
    const bloqueCompletado = document.getElementById('bloque-jornada-completada');
    const bloqueInactivo = document.getElementById('bloque-trabajador-inactivo');

    bloqueAuto.classList.add('oculto');
    bloqueCompletado.classList.add('oculto');
    bloqueInactivo.classList.add('oculto');
    bloqueInactivo.innerHTML = '❌ TRABAJADOR INACTIVO<br><span style="font-weight:600;font-size:11.5px;">No puede registrar asistencia</span>';
    bloqueAuto.classList.remove('tipo-salida', 'tipo-alerta');

    if (typeof Auth !== 'undefined' && !Auth.puedeEditar()) {
      UI.toast('Tu cuenta tiene permiso de solo lectura', 'alerta');
      return;
    }

    // Trabajador inactivo: no se registra nada
    if (this.trabajadorInactivoActual) {
      bloqueInactivo.classList.remove('oculto');
      UI.toast('❌ TRABAJADOR INACTIVO', 'error');
      return;
    }

    if (!turno) {
      UI.toast('Selecciona un turno primero', 'alerta');
      return;
    }

    const fechaJornada = _fechaOperativaTurno(turno);
    if (await DB.obtenerCierre(fechaJornada, turno.id)) {
      UI.toast('Este turno ya fue finalizado y no admite nuevos registros', 'alerta');
      return;
    }

    // Jornada ya completa hoy: no se registra nada más
    if (this.registroHoy && this.registroHoy.horaSalida) {
      bloqueCompletado.classList.remove('oculto');
      document.getElementById('completado-entrada').textContent = this.registroHoy.horaEntrada.slice(0, 5);
      document.getElementById('completado-salida').textContent = this.registroHoy.horaSalida.slice(0, 5);
      document.getElementById('completado-horas').textContent = this.registroHoy.horasTrabajadas || '—';
      UI.toast('⚠️ Ya completó su jornada hoy', 'alerta');
      return;
    }

    // Ya tiene entrada abierta hoy → registrar salida automáticamente
    if (this.registroHoy && !this.registroHoy.horaSalida) {
      const registro = await DB.registrarSalida(this.registroHoy.id, this.metodoActual);
      this.ocultarListaTrasCierre = false;
      this.registroAbierto = null;
      this.registroHoy = registro;

      bloqueAuto.classList.remove('oculto');
      bloqueAuto.classList.add('tipo-salida');
      document.getElementById('icono-registro-auto').textContent = '👋';
      document.getElementById('titulo-registro-auto').textContent = 'SALIDA REGISTRADA';
      document.getElementById('hora-registro-auto').textContent = registro.horaSalida.slice(0, 8);

      UI.toast(`✅ ${registro.estadoSalida} — Horas trabajadas: ${registro.horasTrabajadas}`, registro.estadoSalida === 'SALIDA ANTICIPADA' ? 'alerta' : 'exito');
      if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
      await this.renderizarRegistrosHoy();
      return;
    }

    // Sin registro hoy → registrar entrada automáticamente
    const registrosMismaJornada = (await DB.obtenerAsistencias()).filter(r =>
      !r.esDemo &&
      r.dni === trabajador.dni &&
      r.fecha === fechaJornada &&
      r.turnoId !== turno.id
    );
    const turnosPrevios = [...new Map(registrosMismaJornada.map(r => [r.turnoId, r.turnoNombre || r.turnoId])).values()];
    const cantidadTurnos = turnosPrevios.length + 1;

    if (cantidadTurnos >= 2) {
      const totalTexto = cantidadTurnos === 2 ? '2 TURNOS' : '3 TURNOS';
      const continuar = confirm(
        `⚠️ ALERTA DE TURNOS ACUMULADOS\n\n` +
        `${trabajador.nombres} ${trabajador.apellidos} ya tiene registro en: ${turnosPrevios.join(', ')}.\n\n` +
        `Al registrarlo en ${turno.nombre}, estará realizando ${totalTexto} en la jornada del ${UI.formatearFecha(fechaJornada)}.\n\n` +
        `¿Deseas continuar con el registro?`
      );
      if (!continuar) {
        UI.toast('Registro cancelado por alerta de turnos acumulados', 'alerta');
        return;
      }
    }

    let registro;
    try {
      registro = await DB.registrarEntrada({
      dni: trabajador.dni,
      nombreCompleto: `${trabajador.nombres} ${trabajador.apellidos}`,
      turnoId: turno.id,
      turnoNombre: turno.nombre,
        metodo: this.metodoActual
      });
    } catch (error) {
      UI.toast(error.message || 'No se pudo registrar la entrada', 'error');
      return;
    }

    this.registroAbierto = registro;
    this.ocultarListaTrasCierre = false;
    this.registroHoy = registro;

    bloqueAuto.classList.remove('oculto');
    if (registro.estadoEntrada === 'TARDANZA') bloqueAuto.classList.add('tipo-alerta');
    document.getElementById('icono-registro-auto').textContent = registro.estadoEntrada === 'TARDANZA' ? '⏰' : '✅';
    document.getElementById('titulo-registro-auto').textContent = registro.estadoEntrada === 'TARDANZA' ? 'ENTRADA CON TARDANZA' : 'ENTRADA PUNTUAL';
    document.getElementById('hora-registro-auto').textContent = registro.horaEntrada.slice(0, 8);

    UI.toast(`${registro.estadoEntrada === 'TARDANZA' ? '⚠️' : '✅'} ${registro.estadoEntrada} — Entrada: ${registro.horaEntrada.slice(0, 5)}`, registro.estadoEntrada === 'TARDANZA' ? 'alerta' : 'exito');
    if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
    await this.renderizarRegistrosHoy();
  },

  programarRegresoAutomatico() {
    if (this._timeoutRegreso) clearTimeout(this._timeoutRegreso);
    this._timeoutRegreso = setTimeout(() => {
      this._timeoutRegreso = null;
      if (typeof Workers !== 'undefined') Workers.volverABuscar();
    }, this.DELAY_AUTO_REGRESO);
  },

  /* ---------- Finalizar registro del turno ---------- */

  async finalizarRegistroTurno() {
    if (typeof Auth !== 'undefined' && !Auth.puedeEditar()) {
      UI.toast('Tu cuenta tiene permiso de solo lectura', 'alerta');
      return;
    }
    if (!this.turnoSeleccionado) {
      UI.toast('Selecciona un turno primero', 'alerta');
      return;
    }
    const supervisorActivo = await DB.obtenerPerfilSupervisor();
    if (!supervisorActivo || !supervisorActivo.nombres || !supervisorActivo.dni) {
      UI.toast('Configura el perfil del supervisor antes de cerrar el turno', 'error');
      App.cambiarPestana('perfil');
      return;
    }

    const turno = await this.obtenerTurnoActual();
    const fechaJornada = _fechaOperativaTurno(turno);
    if (await DB.obtenerCierre(fechaJornada, turno.id)) {
      UI.toast('Este turno ya fue finalizado anteriormente', 'alerta');
      return;
    }
    const registrosHoy = (await DB.obtenerAsistencias()).filter(r => !r.esDemo && !r.finalizado && r.fecha === fechaJornada && r.turnoId === turno.id);
    const presentesSet = new Set(registrosHoy.map(r => r.dni));

    const programado = await DB.obtenerCantidadProgramada(fechaJornada, turno.id);
    if (programado === 0) {
      UI.toast('Primero registra la cantidad programada para este turno y fecha', 'alerta');
      App.cambiarPestana('programacion');
      Programacion.seleccionarFechaUnica(fechaJornada);
      await Programacion.cargarFecha();
      return;
    }
    const presentes = presentesSet.size;
    const ausentes = Math.max(programado - presentes, 0);
    const tardanzas = registrosHoy.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
    const personalProgramado = [];
    const personalAusente = [];

    const confirmado = confirm(
      `¿Finalizar el registro de ${turno.nombre}?\n\n` +
      `Programados: ${programado}\nPresentes: ${presentes}\nAusentes: ${ausentes}\nTardanzas: ${tardanzas}\n\n` +
      `Se guardará este resumen en el Historial.`
    );
    if (!confirmado) return;

    const cierre = await DB.registrarCierreTurno({ fecha: fechaJornada, turnoId: turno.id, turnoNombre: turno.nombre, programado, presentes, ausentes, tardanzas, personalProgramado, personalAusente });
    await DB.marcarRegistrosFinalizados(registrosHoy.map(r => r.id), cierre.id);
    UI.toast(`✅ Registro de ${turno.nombre} finalizado y guardado en Historial`, 'exito');
    this.turnoSeleccionado = null;
    this.registroAbierto = null;
    this.registroHoy = null;
    this.ocultarListaTrasCierre = true;
    document.getElementById('input-dni-buscar').value = '';
    document.getElementById('panel-busqueda-trabajador').classList.add('oculto');
    await this.renderizarTurnos();
    await this.renderizarRegistrosHoy();
    if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
  },

  /* ---------- Lista en vivo de registros del día ---------- */

  async renderizarRegistrosHoy() {
    const contenedor = document.getElementById('lista-registros-hoy');
    if (!contenedor) return;
    if (this.ocultarListaTrasCierre) {
      contenedor.innerHTML = `<div class="estado-vacio">Turno finalizado. No hay registros pendientes.</div>`;
      return;
    }

    const hoy = _hoyISO();
    const turnos = await DB.obtenerTurnos();
    const turnoPorId = {};
    turnos.forEach(t => { turnoPorId[t.id] = t; });
    const registros = (await DB.obtenerAsistencias())
      .filter(r => {
        if (r.esDemo) return false;
        if (this.turnoSeleccionado && r.turnoId !== this.turnoSeleccionado) return false;
        const esDeHoy = r.fecha === hoy;
        // El turno nocturno pertenece a la fecha en la que comenzó. Después de
        // medianoche debe seguir visible aunque ya tenga salida (incluida una
        // salida anticipada) y desaparecer únicamente al finalizar el turno.
        const esNocturnoDeAyer = _sumarDiasISO(r.fecha, 1) === hoy && _esTurnoNocturno(turnoPorId[r.turnoId]);
        return !r.finalizado && (esDeHoy || esNocturnoDeAyer);
      })
      .sort((a, b) => (a.horaEntrada < b.horaEntrada ? 1 : -1));

    if (registros.length === 0) {
      contenedor.innerHTML = `<div class="estado-vacio">Todavía no hay registros hoy</div>`;
      return;
    }

    contenedor.innerHTML = registros.map(r => `
      <div class="tarjeta-historial">
        <div class="avatar-mini">${UI.iniciales(r.nombreCompleto.split(' ')[0], r.nombreCompleto.split(' ')[1] || '')}</div>
        <div class="tarjeta-historial-info">
          <div class="tarjeta-historial-nombre">${UI.escaparHtml(r.nombreCompleto)}</div>
          <div class="tarjeta-historial-meta">DNI: ${UI.escaparHtml(r.dni)} · ${UI.escaparHtml(r.turnoNombre.replace('TURNO ', 'T'))}</div>
          <div class="registro-movimientos">
            <div class="registro-movimiento entrada ${(r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA') ? 'tardia' : ''}">
              <div class="registro-movimiento-titulo">↘ Entrada</div>
              <div class="registro-movimiento-hora">${r.horaEntrada.slice(0, 5)}</div>
              <div class="registro-movimiento-estado">${r.estadoEntrada || (r.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL')}</div>
            </div>
            <div class="registro-movimiento salida ${!r.horaSalida ? 'pendiente' : (r.estadoSalida === 'SALIDA ANTICIPADA' ? 'anticipada' : '')}">
              <div class="registro-movimiento-titulo">↗ Salida</div>
              <div class="registro-movimiento-hora">${r.horaSalida ? r.horaSalida.slice(0, 5) : '--:--'}</div>
              <div class="registro-movimiento-estado">${r.estadoSalida || 'PENDIENTE'}</div>
            </div>
          </div>
          ${r.horasTrabajadas ? `<div class="tarjeta-historial-horas">Total trabajado: <strong>${r.horasTrabajadas}</strong></div>` : ''}
          <div class="tarjeta-historial-meta" style="margin-top:5px;">Entrada por: ${UI.escaparHtml(_nombreSupervisor(r.supervisorEntrada))}${r.horaSalida ? ` · Salida por: ${UI.escaparHtml(_nombreSupervisor(r.supervisorSalida))}` : ''}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;margin-right:22px;">
          <span class="badge badge-${r.metodo === 'QR' ? 'azul' : 'naranja'}">${r.metodo === 'QR' ? '📷 QR' : '🔎 DNI'}</span>
        </div>
        <div class="registro-acciones">
          <button type="button" class="btn-registro-menu" data-registro-menu="${r.id}" aria-label="Opciones del registro" aria-expanded="false">⋮</button>
          <div class="registro-menu oculto" data-menu-registro="${r.id}">
            <button type="button" data-editar-registro="${r.id}">✏️ Editar</button>
            <button type="button" class="accion-eliminar" data-eliminar-registro="${r.id}">🗑️ Eliminar</button>
          </div>
        </div>
      </div>
    `).join('');

    contenedor.querySelectorAll('[data-registro-menu]').forEach(boton => {
      boton.addEventListener('click', (evento) => {
        evento.stopPropagation();
        const menu = contenedor.querySelector(`[data-menu-registro="${boton.dataset.registroMenu}"]`);
        const abrir = menu.classList.contains('oculto');
        contenedor.querySelectorAll('.registro-menu').forEach(m => m.classList.add('oculto'));
        contenedor.querySelectorAll('[data-registro-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
        menu.classList.toggle('oculto', !abrir);
        boton.setAttribute('aria-expanded', String(abrir));
      });
    });
    contenedor.querySelectorAll('[data-editar-registro]').forEach(boton => {
      boton.addEventListener('click', () => this.abrirEditarRegistro(boton.dataset.editarRegistro));
    });
    contenedor.querySelectorAll('[data-eliminar-registro]').forEach(boton => {
      boton.addEventListener('click', () => this.eliminarRegistro(boton.dataset.eliminarRegistro));
    });
  },

  async abrirEditarRegistro(registroId) {
    const supervisorActivo = await DB.obtenerPerfilSupervisor();
    if (!supervisorActivo || !supervisorActivo.nombres || !supervisorActivo.dni) {
      UI.toast('Configura el perfil del supervisor antes de editar', 'error');
      App.cambiarPestana('perfil');
      return;
    }
    const registros = await DB.obtenerAsistencias();
    const registro = registros.find(r => r.id === registroId);
    if (!registro) return UI.toast('Registro no encontrado', 'error');
    const trabajadores = (await DB.obtenerTrabajadores())
      .filter(t => t.estado === 'ACTIVO');
    const select = document.getElementById('editar-registro-dni');
    select.innerHTML = trabajadores.map(t => `<option value="${UI.escaparHtml(t.dni)}">${UI.escaparHtml(t.nombres)} ${UI.escaparHtml(t.apellidos)} · ${UI.escaparHtml(t.dni)}</option>`).join('');
    select.value = registro.dni;
    document.getElementById('editar-registro-entrada').value = registro.horaEntrada.slice(0, 8);
    document.getElementById('editar-registro-salida').value = registro.horaSalida ? registro.horaSalida.slice(0, 8) : '';
    this.registroEditandoId = registroId;
    UI.cerrarTodosLosModales();
    document.getElementById('modal-editar-registro').classList.add('visible');
    document.getElementById('modal-editar-registro-overlay').classList.add('visible');
  },

  cerrarEditarRegistro() {
    this.registroEditandoId = null;
    document.getElementById('modal-editar-registro').classList.remove('visible');
    document.getElementById('modal-editar-registro-overlay').classList.remove('visible');
  },

  async guardarEdicionRegistro(evento) {
    evento.preventDefault();
    if (!this.registroEditandoId) return;
    const form = evento.target;
    try {
      await DB.actualizarRegistroAsistencia(this.registroEditandoId, {
        dni: form.dni.value,
        horaEntrada: form.horaEntrada.value,
        horaSalida: form.horaSalida.value
      });
      this.cerrarEditarRegistro();
      await this.renderizarRegistrosHoy();
      if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
      UI.toast('Registro corregido correctamente', 'exito');
    } catch (error) {
      UI.toast(error.message, 'error');
    }
  },

  async eliminarRegistro(registroId) {
    const supervisorActivo = await DB.obtenerPerfilSupervisor();
    if (!supervisorActivo || !supervisorActivo.nombres || !supervisorActivo.dni) {
      UI.toast('Configura el perfil del supervisor antes de eliminar', 'error');
      App.cambiarPestana('perfil');
      return;
    }
    const registros = await DB.obtenerAsistencias();
    const registro = registros.find(r => r.id === registroId);
    if (!registro) return UI.toast('Registro no encontrado', 'error');
    if (!confirm(`¿Eliminar el registro de ${registro.nombreCompleto}?\n\nEsta acción retirará su entrada y salida de la jornada.`)) return;
    await DB.eliminarRegistroAsistencia(registroId);
    await this.renderizarRegistrosHoy();
    if (typeof Dashboard !== 'undefined') Dashboard.actualizarSiVisible();
    UI.toast('Registro eliminado', 'exito');
  }
};


/**
 * reports.js
 * -----------------------------------------------------------------------
 * Dashboard de KPIs, gráficos (Chart.js) y exportación de reportes
 * (Excel vía SheetJS, CSV nativo, impresión).
 * -----------------------------------------------------------------------
 */

const Reports = {

  /* ---------- Reporte detallado ---------- */

  async renderizarReporteDetallado() {
    const fechaInicio = document.getElementById('filtro-fecha-inicio-reporte').value || null;
    const fechaFin = document.getElementById('filtro-fecha-fin-reporte').value || null;
    const turnoId = document.getElementById('filtro-turno-reporte').value || null;

    const registros = await DB.obtenerReporteDetallado({ fechaInicio, fechaFin, turnoId });
    this._ultimoReporte = registros;

    const tbody = document.getElementById('tabla-reporte-detallado');
    if (registros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" class="tabla-vacia">Sin registros para el filtro seleccionado</td></tr>`;
      return;
    }

    tbody.innerHTML = registros.map(r => `
      <tr>
        <td>${UI.formatearFecha(r.fecha)}</td>
        <td>${UI.escaparHtml(r.nombreCompleto)}</td>
        <td>${r.turnoNombre.replace('TURNO ', 'T')}</td>
        <td>${r.horaEntrada.slice(0, 5)}</td>
        <td>${r.horaSalida ? r.horaSalida.slice(0, 5) : '—'}</td>
        <td>${r.horasTrabajadas || '—'}</td>
        <td>${r.estadoEntrada || (r.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL')}</td>
        <td>${r.estadoSalida || 'SIN SALIDA'}</td>
        <td><span class="badge badge-${r.metodo === 'QR' ? 'azul' : 'naranja'}">${r.metodo || 'DNI'}</span></td>
        <td>${UI.escaparHtml(_nombreSupervisor(r.supervisorEntrada))}</td>
        <td>${UI.escaparHtml(_nombreSupervisor(r.supervisorSalida))}</td>
      </tr>
    `).join('');
  },

  /* ---------- Exportación ---------- */

  _datosParaExportar(registros, paraExcel = false) {
    const supervisorPorTurno = new Map();
    registros.forEach(r => {
      const claveTurno = `${r.fecha || ''}|${r.turnoId || r.turnoNombre || ''}`;
      if (!supervisorPorTurno.has(claveTurno)) supervisorPorTurno.set(claveTurno, new Map());
      const conteo = supervisorPorTurno.get(claveTurno);
      [r.supervisorEntrada, r.supervisorSalida].forEach(supervisor => {
        const nombre = _nombreSupervisor(supervisor);
        if (nombre !== 'No identificado') conteo.set(nombre, (conteo.get(nombre) || 0) + 1);
      });
    });

    const nombreSupervisorTurno = r => {
      const claveTurno = `${r.fecha || ''}|${r.turnoId || r.turnoNombre || ''}`;
      const conteo = supervisorPorTurno.get(claveTurno) || new Map();
      return [...conteo.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || 'No identificado';
    };

    return registros.map(r => ({
      Fecha: paraExcel ? _fechaComoValorExcel(r.fecha) : UI.formatearFecha(r.fecha),
      DNI: r.dni,
      Trabajador: r.nombreCompleto,
      Turno: r.turnoNombre,
      Entrada: paraExcel ? _horaComoValorExcel(r.horaEntrada) : (r.horaEntrada || ''),
      Salida: paraExcel ? _horaComoValorExcel(r.horaSalida) : (r.horaSalida || ''),
      'Horas trabajadas': paraExcel ? _duracionComoValorExcel(r.horasTrabajadas) : (r.horasTrabajadas || ''),
      Método: r.metodo || 'DNI',
      'Estado entrada': r.estadoEntrada || (r.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL'),
      'Estado salida': r.estadoSalida || 'SIN SALIDA',
      Supervisor: nombreSupervisorTurno(r)
    }));
  },

  async exportarExcel(registros, nombreArchivo = 'reporte-asistencia') {
    const fuente = registros || this._ultimoReporte || (typeof Dashboard !== 'undefined' && Dashboard.registrosDia) || await DB.obtenerHistorial();
    const datos = this._datosParaExportar(fuente, true);
    if (datos.length === 0) {
      UI.toast('No hay datos para exportar', 'alerta');
      return;
    }
    const encabezados = Object.keys(datos[0]);
    const fechas = fuente.map(r => r.fecha).filter(Boolean).sort();
    const supervisores = [...new Set(datos.map(r => r.Supervisor).filter(n => n && n !== 'No identificado'))];
    const periodo = fechas.length
      ? `${UI.formatearFecha(fechas[0])} al ${UI.formatearFecha(fechas[fechas.length - 1])}`
      : 'Sin periodo';
    const filas = [
      ['REPORTE DE ASISTENCIA'],
      [`Periodo: ${periodo}`],
      [`Generado: ${UI.formatearFecha(_hoyISO())} ${new Date().toLocaleTimeString('es-PE', { hour12:false })}`],
      [`Supervisor${supervisores.length === 1 ? '' : 'es'}: ${supervisores.join(', ') || 'No identificado'}`],
      [],
      encabezados,
      ...datos.map(fila => encabezados.map(encabezado => fila[encabezado]))
    ];
    const hoja = XLSX.utils.aoa_to_sheet(filas, { cellDates:true });
    const ultimaColumna = encabezados.length - 1;
    const filaEncabezados = 5;
    const primeraFilaDatos = 6;
    const ultimaFilaDatos = primeraFilaDatos + datos.length - 1;
    const formatos = { Fecha: 'dd/mm/yyyy', Entrada: 'hh:mm:ss', Salida: 'hh:mm:ss', 'Horas trabajadas': '[h]:mm' };

    hoja['!merges'] = [
      { s:{ r:0, c:0 }, e:{ r:0, c:ultimaColumna } },
      { s:{ r:1, c:0 }, e:{ r:1, c:ultimaColumna } },
      { s:{ r:2, c:0 }, e:{ r:2, c:ultimaColumna } },
      { s:{ r:3, c:0 }, e:{ r:3, c:ultimaColumna } }
    ];

    const bordeSuave = {
      top:{ style:'thin', color:{ rgb:'D9E2F1' } },
      bottom:{ style:'thin', color:{ rgb:'D9E2F1' } },
      left:{ style:'thin', color:{ rgb:'D9E2F1' } },
      right:{ style:'thin', color:{ rgb:'D9E2F1' } }
    };
    hoja.A1.s = { fill:{ fgColor:{ rgb:'17499A' } }, font:{ name:'Calibri', sz:18, bold:true, color:{ rgb:'FFFFFF' } }, alignment:{ vertical:'center', horizontal:'left' } };
    ['A2','A3','A4'].forEach(ref => {
      hoja[ref].s = { fill:{ fgColor:{ rgb:'EAF1FB' } }, font:{ name:'Calibri', sz:10, color:{ rgb:'334155' } }, alignment:{ vertical:'center', horizontal:'left' } };
    });

    encabezados.forEach((encabezado, columna) => {
      const celda = hoja[XLSX.utils.encode_cell({ r:filaEncabezados, c:columna })];
      celda.s = {
        fill:{ fgColor:{ rgb:'2563EB' } },
        font:{ name:'Calibri', sz:10, bold:true, color:{ rgb:'FFFFFF' } },
        alignment:{ vertical:'center', horizontal:'center', wrapText:true },
        border:bordeSuave
      };
    });

    for (let fila = primeraFilaDatos; fila <= ultimaFilaDatos; fila++) {
      encabezados.forEach((encabezado, columna) => {
        const celda = hoja[XLSX.utils.encode_cell({ r:fila, c:columna })];
        if (!celda) return;
        const esPar = (fila - primeraFilaDatos) % 2 === 0;
        celda.s = {
          fill:{ fgColor:{ rgb:esPar ? 'F4F7FC' : 'FFFFFF' } },
          font:{ name:'Calibri', sz:9, color:{ rgb:'1F2937' } },
          alignment:{ vertical:'center', horizontal:['Entrada','Salida','Horas trabajadas','Método','Estado entrada','Estado salida'].includes(encabezado) ? 'center' : 'left' },
          border:bordeSuave
        };
        if (formatos[encabezado] && celda.v !== '' && celda.v !== null) celda.z = formatos[encabezado];

        if (encabezado === 'Estado entrada' || encabezado === 'Estado salida') {
          const valor = String(celda.v || '').toUpperCase();
          if (valor.includes('PUNTUAL') || valor.includes('HORA')) celda.s.fill = { fgColor:{ rgb:'DCFCE7' } };
          else if (valor.includes('TARDANZA') || valor.includes('SIN SALIDA')) celda.s.fill = { fgColor:{ rgb:'FFEDD5' } };
          else if (valor.includes('ANTICIPADA') || valor.includes('AUSENTE')) celda.s.fill = { fgColor:{ rgb:'FEE2E2' } };
        }
      });
    }

    encabezados.forEach((encabezado, columna) => {
      if (!formatos[encabezado]) return;
      for (let fila = primeraFilaDatos; fila <= ultimaFilaDatos; fila++) {
        const celda = hoja[XLSX.utils.encode_cell({ r: fila, c: columna })];
        if (celda && celda.v !== '' && celda.v !== null) celda.z = formatos[encabezado];
      }
    });
    const anchos = { Fecha:13, DNI:14, Trabajador:30, Turno:24, Entrada:12, Salida:12, 'Horas trabajadas':16, Método:12, 'Estado entrada':20, 'Estado salida':22, Supervisor:28 };
    hoja['!cols'] = encabezados.map(encabezado => ({ wch:anchos[encabezado] || 16 }));
    hoja['!rows'] = [{ hpt:30 }, { hpt:18 }, { hpt:18 }, { hpt:18 }, { hpt:8 }, { hpt:30 }, ...datos.map(() => ({ hpt:20 }))];
    hoja['!autofilter'] = { ref:XLSX.utils.encode_range({ s:{ r:filaEncabezados, c:0 }, e:{ r:ultimaFilaDatos, c:ultimaColumna } }) };
    hoja['!freeze'] = { xSplit:0, ySplit:6, topLeftCell:'A7', activePane:'bottomLeft', state:'frozen' };
    hoja['!margins'] = { left:.3, right:.3, top:.5, bottom:.5, header:.2, footer:.2 };
    hoja['!pageSetup'] = { orientation:'landscape', fitToWidth:1, fitToHeight:0, paperSize:9 };
    const libro = XLSX.utils.book_new();
    libro.Props = { Title:'Reporte de asistencia', Subject:`Periodo ${periodo}`, Author:supervisores.join(', ') || 'Control de Asistencia', Company:'Control de Asistencia', CreatedDate:new Date() };
    XLSX.utils.book_append_sheet(libro, hoja, 'Asistencia');
    XLSX.writeFile(libro, `${nombreArchivo}-profesional-${_fechaArchivo()}.xlsx`, { cellDates:true, bookSST:true });
    UI.toast('Excel profesional generado correctamente', 'exito');
  },

  async exportarCSV(registros, nombreArchivo = 'reporte-asistencia') {
    const datos = this._datosParaExportar(registros || this._ultimoReporte || (typeof Dashboard !== 'undefined' && Dashboard.registrosDia) || await DB.obtenerHistorial());
    if (datos.length === 0) {
      UI.toast('No hay datos para exportar', 'alerta');
      return;
    }
    const columnas = Object.keys(datos[0]);
    const filas = [
      columnas.join(','),
      ...datos.map(fila => columnas.map(c => `"${String(fila[c]).replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob(['\uFEFF' + filas.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombreArchivo}-${_fechaArchivo()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async exportarPDF(registros, nombreArchivo = 'historial-asistencia') {
    const fuente = registros || this._ultimoReporte || (typeof Dashboard !== 'undefined' && Dashboard.registrosDia) || await DB.obtenerHistorial();
    if (!fuente || fuente.length === 0) {
      UI.toast('No hay registros para exportar en PDF', 'alerta');
      return;
    }
    if (!window.jspdf) {
      UI.toast('No se pudo cargar el generador de PDF', 'error');
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const registrosOrdenados = [...fuente].sort((a, b) =>
      String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
      String(a.turnoId || '').localeCompare(String(b.turnoId || '')) ||
      String(a.horaEntrada || '').localeCompare(String(b.horaEntrada || ''))
    );
    const datos = this._datosParaExportar(registrosOrdenados, false);
    const perfil = await DB.obtenerPerfilSupervisor();
    const columnas = [
      { clave:'Fecha', titulo:'FECHA', ancho:18 },
      { clave:'DNI', titulo:'DNI', ancho:18 },
      { clave:'Trabajador', titulo:'TRABAJADOR', ancho:38 },
      { clave:'Turno', titulo:'TURNO', ancho:25 },
      { clave:'Entrada', titulo:'ENTRADA', ancho:18 },
      { clave:'Salida', titulo:'SALIDA', ancho:18 },
      { clave:'Horas trabajadas', titulo:'HORAS', ancho:18 },
      { clave:'Método', titulo:'MÉTODO', ancho:16 },
      { clave:'Estado entrada', titulo:'ESTADO ENTRADA', ancho:27 },
      { clave:'Estado salida', titulo:'ESTADO SALIDA', ancho:28 },
      { clave:'Supervisor', titulo:'SUPERVISOR', ancho:39 }
    ];
    if (typeof doc.autoTable !== 'function') {
      UI.toast('No se pudo cargar el diseñador de tablas PDF. Recarga la página con Ctrl + F5.', 'error');
      return;
    }

    const dibujarCabeceraPagina = () => {
      doc.setFillColor(23, 73, 154);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('HISTORIAL DE ASISTENCIA', 8, 9);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(224, 235, 255);
      doc.text(`Generado: ${UI.formatearFecha(_hoyISO())} ${new Date().toLocaleTimeString('es-PE', { hour12:false })}`, 8, 14.5);
      doc.text(`Supervisor a cargo: ${_nombreSupervisor(perfil)}`, 8, 19);
    };

    const cuerpo = datos.map(fila => columnas.map(c => String(fila[c.clave] ?? '')));
    const estilosColumnas = {};
    columnas.forEach((c, i) => { estilosColumnas[i] = { cellWidth:c.ancho }; });

    doc.autoTable({
      head: [columnas.map(c => c.titulo)],
      body: cuerpo,
      startY: 27,
      margin: { top:27, right:7, bottom:14, left:7 },
      theme: 'grid',
      styles: {
        font:'helvetica', fontSize:6.2, textColor:[31,41,55],
        fillColor:[255,255,255], lineColor:[203,213,225], lineWidth:.15,
        cellPadding:{ top:2, right:1.4, bottom:2, left:1.4 },
        valign:'middle', overflow:'linebreak'
      },
      headStyles: {
        fillColor:[37,99,235], textColor:[255,255,255],
        fontStyle:'bold', fontSize:6.2, halign:'left', lineColor:[255,255,255], lineWidth:.2
      },
      alternateRowStyles: { fillColor:[242,246,252] },
      columnStyles: estilosColumnas,
      showHead:'everyPage',
      rowPageBreak:'avoid',
      didDrawPage: dibujarCabeceraPagina
    });

    const totalPaginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(107, 114, 128);
      doc.setDrawColor(203, 213, 225);
      doc.line(7, 199.5, 290, 199.5);
      doc.text(`${datos.length} registro${datos.length === 1 ? '' : 's'} · Página ${pagina} de ${totalPaginas}`, 290, 204, { align:'right' });
    }

    doc.save(`${nombreArchivo}-tabla-${_fechaArchivo()}.pdf`);
    UI.toast('PDF en formato tabla generado correctamente', 'exito');
  },

  imprimir() {
    window.print();
  }
};

function _fechaArchivo() {
  return _hoyISO();
}

function _fechaComoValorExcel(fechaISO) {
  if (!fechaISO) return '';
  const [aaaa, mm, dd] = fechaISO.split('-').map(Number);
  return new Date(aaaa, mm - 1, dd);
}

function _horaComoValorExcel(hora) {
  if (!hora) return '';
  const [hh, mm, ss = 0] = hora.split(':').map(Number);
  return (hh * 3600 + mm * 60 + ss) / 86400;
}

function _duracionComoValorExcel(duracion) {
  if (!duracion) return '';
  const [hh, mm, ss = 0] = duracion.split(':').map(Number);
  return (hh * 3600 + mm * 60 + ss) / 86400;
}


/**
 * dashboard.js
 * -----------------------------------------------------------------------
 * Dashboard profesional de control de asistencia. Todos los KPIs y
 * gráficos se calculan a partir de trabajadores/asistencias reales
 * guardados en DB — nada de números fijos.
 *
 * Estado de fila (por trabajador programado, para una fecha+turno dados):
 *   AUSENTE     -> no tiene registro ese día
 *   TARDANZA    -> registró entrada tarde y todavía no registra salida
 *   SIN SALIDA  -> registró entrada a tiempo y todavía no registra salida
 *   INCOMPLETO  -> registró salida pero trabajó menos del 87.5% del turno
 *   COMPLETO    -> registró salida y cumplió su jornada
 * -----------------------------------------------------------------------
 */

const UMBRAL_JORNADA_COMPLETA = 0.875; // 87.5% de la duración del turno

const Programacion = {
  turnos: [],
  personalDisponible: 0,
  fechasSeleccionadas: new Set(),

  async init() {
    this.turnos = await DB.obtenerTurnos();
    const semana = document.getElementById('programacion-semana');
    semana.value = this._semanaISODeFecha(_hoyISO());
    this.fechasSeleccionadas = new Set([_hoyISO()]);
    semana.addEventListener('change', () => this.renderizarDiasSemana());
    document.getElementById('form-programacion').addEventListener('submit', e => this.guardar(e));
    document.getElementById('btn-limpiar-programacion').addEventListener('click', () => this.limpiar());
    this.renderizarDiasSemana();
    this.renderizarFechasSeleccionadas();
    await this.cargarFecha();
  },

  _semanaISODeFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    const diaSemana = fecha.getUTCDay() || 7;
    fecha.setUTCDate(fecha.getUTCDate() + 4 - diaSemana);
    const inicio = new Date(Date.UTC(fecha.getUTCFullYear(), 0, 1));
    const numero = Math.ceil((((fecha - inicio) / 86400000) + 1) / 7);
    return `${fecha.getUTCFullYear()}-W${String(numero).padStart(2, '0')}`;
  },

  _lunesDeSemana(valor) {
    const coincidencia = /^(\d{4})-W(\d{2})$/.exec(valor || '');
    if (!coincidencia) return new Date();
    const anio = Number(coincidencia[1]), semana = Number(coincidencia[2]);
    const cuatroEnero = new Date(anio, 0, 4);
    const dia = cuatroEnero.getDay() || 7;
    const lunes = new Date(anio, 0, 4 - dia + 1);
    lunes.setDate(lunes.getDate() + (semana - 1) * 7);
    return lunes;
  },

  renderizarDiasSemana() {
    const lunes = this._lunesDeSemana(document.getElementById('programacion-semana').value);
    const nombres = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const dias = Array.from({ length:7 }, (_, indice) => {
      const fecha = new Date(lunes); fecha.setDate(lunes.getDate() + indice);
      return { iso:_fechaLocalISO(fecha), nombre:nombres[indice], numero:fecha.getDate() };
    });
    const contenedor = document.getElementById('programacion-dias-semana');
    contenedor.innerHTML = dias.map(d => `<button type="button" class="programacion-dia ${this.fechasSeleccionadas.has(d.iso) ? 'seleccionado' : ''}" data-programacion-dia="${d.iso}" aria-pressed="${this.fechasSeleccionadas.has(d.iso)}"><span>${d.nombre}</span><strong>${d.numero}</strong></button>`).join('');
    contenedor.querySelectorAll('[data-programacion-dia]').forEach(btn => btn.addEventListener('click', () => this.toggleFecha(btn.dataset.programacionDia)));
  },

  toggleFecha(fecha) {
    if (this.fechasSeleccionadas.has(fecha)) this.fechasSeleccionadas.delete(fecha);
    else this.fechasSeleccionadas.add(fecha);
    this.renderizarDiasSemana();
    this.renderizarFechasSeleccionadas();
  },

  seleccionarFechaUnica(fecha) {
    this.fechasSeleccionadas = new Set([fecha]);
    document.getElementById('programacion-semana').value = this._semanaISODeFecha(fecha);
    this.renderizarDiasSemana();
    this.renderizarFechasSeleccionadas();
  },

  quitarFecha(fecha) {
    this.fechasSeleccionadas.delete(fecha);
    this.renderizarDiasSemana();
    this.renderizarFechasSeleccionadas();
  },

  renderizarFechasSeleccionadas() {
    const contenedor = document.getElementById('programacion-fechas-elegidas');
    const fechas = [...this.fechasSeleccionadas].sort();
    contenedor.innerHTML = fechas.length ? fechas.map(fecha => `<span class="programacion-fecha-chip">${UI.formatearFecha(fecha)}<button type="button" data-quitar-fecha-programacion="${fecha}" aria-label="Quitar ${UI.formatearFecha(fecha)}">×</button></span>`).join('') : '<span style="color:var(--gris-500);font-size:12px;">Selecciona uno o varios días de la semana.</span>';
    contenedor.querySelectorAll('[data-quitar-fecha-programacion]').forEach(btn => btn.addEventListener('click', () => this.quitarFecha(btn.dataset.quitarFechaProgramacion)));
    const boton = document.getElementById('btn-guardar-programacion');
    if (boton) boton.textContent = fechas.length > 1 ? `GUARDAR PROGRAMACIÓN EN ${fechas.length} FECHAS` : 'GUARDAR PROGRAMACIÓN';
  },

  async cargarFecha() {
    const fecha = [...this.fechasSeleccionadas].sort()[0] || _hoyISO();
    const [existente, trabajadores] = await Promise.all([DB.obtenerProgramacion(fecha), DB.obtenerTrabajadores()]);
    this.personalDisponible = trabajadores.filter(t => t.estado === 'ACTIVO' && !t.esDemo).length;
    const colores = [
      { color:'#2563eb', suave:'#eff6ff' },
      { color:'#f97316', suave:'#fff7ed' },
      { color:'#7c3aed', suave:'#f5f3ff' }
    ];
    document.getElementById('programacion-turnos').innerHTML = this.turnos.map((t, indice) => {
      const tono = colores[indice] || colores[0];
      const numero = String(indice + 1).padStart(2, '0');
      const cantidad = Number(existente?.cantidades?.[t.id] || 0);
      return `<div class="programacion-turno" style="--prog-color:${tono.color};--prog-suave:${tono.suave}">
        <div class="programacion-turno-cabecera"><div class="programacion-turno-numero">${numero}</div><div><div class="programacion-turno-nombre">${UI.escaparHtml(t.nombre)}</div><div class="programacion-turno-horario">${t.inicio} - ${t.fin}</div></div></div>
        <div class="programacion-turno-cuerpo"><div class="programacion-turno-etiqueta">Cantidad de trabajadores</div><div class="programacion-stepper">
          <button type="button" data-programacion-restar="${t.id}" aria-label="Disminuir ${UI.escaparHtml(t.nombre)}">−</button>
          <input type="number" min="0" step="1" inputmode="numeric" data-programacion-turno="${t.id}" value="${cantidad}" aria-label="Cantidad para ${UI.escaparHtml(t.nombre)}">
          <button type="button" data-programacion-sumar="${t.id}" aria-label="Aumentar ${UI.escaparHtml(t.nombre)}">+</button>
        </div></div>
        <div class="programacion-turno-pie"><span>Programados</span><strong data-programacion-reflejo="${t.id}">${cantidad}</strong></div>
      </div>`;
    }).join('');
    document.querySelectorAll('[data-programacion-turno]').forEach(input => {
      input.addEventListener('input', () => this.actualizarTotal());
      input.addEventListener('focus', () => input.select());
      input.addEventListener('click', () => input.select());
    });
    document.querySelectorAll('[data-programacion-restar]').forEach(btn => btn.addEventListener('click', () => this.cambiarCantidad(btn.dataset.programacionRestar, -1)));
    document.querySelectorAll('[data-programacion-sumar]').forEach(btn => btn.addEventListener('click', () => this.cambiarCantidad(btn.dataset.programacionSumar, 1)));
    const t03 = this.turnos.find(t => t.id === 'T03');
    if (t03) document.getElementById('programacion-horario-t03').textContent = `${t03.inicio} - ${t03.fin}`;
    this.actualizarTotal();
    await this.renderizarListado();
  },

  cambiarCantidad(turnoId, delta) {
    const input = document.querySelector(`[data-programacion-turno="${turnoId}"]`);
    input.value = Math.max(0, (parseInt(input.value, 10) || 0) + delta);
    this.actualizarTotal();
  },

  actualizarTotal() {
    const entradas = Array.from(document.querySelectorAll('[data-programacion-turno]'));
    entradas.forEach(input => {
      input.value = Math.max(0, parseInt(input.value, 10) || 0);
      const reflejo = document.querySelector(`[data-programacion-reflejo="${input.dataset.programacionTurno}"]`);
      if (reflejo) reflejo.textContent = input.value;
    });
    const total = entradas.reduce((s, input) => s + Number(input.value), 0);
    const disponible = this.personalDisponible;
    const sinProgramar = Math.max(disponible - total, 0);
    const porcentajeReal = disponible > 0 ? total / disponible * 100 : 0;
    const porcentajeVisual = Math.min(porcentajeReal, 100);
    const excedido = total > disponible;
    const color = excedido || porcentajeReal < 70 ? '#ef4444' : porcentajeReal < 100 ? '#f59e0b' : '#20b864';
    document.getElementById('programacion-kpi-total').textContent = total;
    document.getElementById('programacion-kpi-disponible').textContent = disponible;
    document.getElementById('programacion-kpi-sin').textContent = sinProgramar;
    document.getElementById('programacion-kpi-cumplimiento').textContent = `${porcentajeReal.toFixed(porcentajeReal % 1 ? 1 : 0)}%`;
    document.getElementById('programacion-kpi-cumplimiento').style.color = color;
    document.getElementById('programacion-kpi-sin').style.color = sinProgramar === 0 ? '#20b864' : color;
    const barra = document.getElementById('programacion-progreso-barra');
    barra.style.width = `${porcentajeVisual}%`; barra.style.background = color;
    document.getElementById('programacion-progreso-texto').textContent = `${total} / ${disponible} trabajadores programados`;
    document.getElementById('programacion-advertencia').classList.toggle('visible', excedido);
    return { total, excedido };
  },

  async guardar(e) {
    e.preventDefault();
    const fechas = [...this.fechasSeleccionadas].sort();
    if (!fechas.length) { UI.toast('Agrega al menos una fecha', 'alerta'); return; }
    const validacion = this.actualizarTotal();
    if (validacion.excedido && !confirm(`El total programado (${validacion.total}) supera el personal disponible (${this.personalDisponible}). ¿Deseas guardarlo de todas formas?`)) return;
    const existentes = (await Promise.all(fechas.map(fecha => DB.obtenerProgramacion(fecha)))).filter(Boolean);
    if (existentes.length && !confirm(`Ya existe programación en ${existentes.length} de las fechas seleccionadas. ¿Deseas actualizarla?`)) return;
    const cantidades = {};
    document.querySelectorAll('[data-programacion-turno]').forEach(input => { cantidades[input.dataset.programacionTurno] = input.value; });
    await Promise.all(fechas.map(fecha => DB.guardarProgramacion(fecha, cantidades)));
    await this.renderizarListado();
    if (typeof Dashboard !== 'undefined') await Dashboard.actualizar();
    UI.toast(`Programación guardada en ${fechas.length} fecha${fechas.length === 1 ? '' : 's'} y dashboard actualizado`, 'exito');
  },

  limpiar() {
    document.querySelectorAll('[data-programacion-turno]').forEach(input => { input.value = 0; });
    this.actualizarTotal();
  },

  async abrir(fecha, modo = 'ver') {
    this.seleccionarFechaUnica(fecha);
    await this.cargarFecha();
    document.getElementById('programacion-turnos').scrollIntoView({ behavior:'smooth', block:'center' });
    if (modo === 'editar') {
      const primero = document.querySelector('[data-programacion-turno]');
      if (primero) primero.focus();
      UI.toast('Programación lista para editar', 'info');
    } else {
      UI.toast(`Programación del ${UI.formatearFecha(fecha)}`, 'info');
    }
  },

  async eliminar(fecha) {
    if (!confirm(`¿Eliminar la programación del ${UI.formatearFecha(fecha)}?`)) return;
    await DB.eliminarProgramacion(fecha);
    if (this.fechasSeleccionadas.has(fecha)) this.limpiar();
    await this.renderizarListado();
    if (typeof Dashboard !== 'undefined') await Dashboard.actualizar();
    UI.toast('Programación eliminada', 'exito');
  },

  async renderizarListado() {
    const datos = await DB.obtenerProgramaciones();
    const contenedor = document.getElementById('lista-programaciones');
    contenedor.innerHTML = datos.length ? datos.map(p => {
      const total = Object.values(p.cantidades || {}).reduce((s, n) => s + Number(n || 0), 0);
      return `<tr><td>${UI.formatearFecha(p.fecha)}</td><td class="valor-t01">${Number(p.cantidades?.T01 || 0)}</td><td class="valor-t02">${Number(p.cantidades?.T02 || 0)}</td><td class="valor-t03">${Number(p.cantidades?.T03 || 0)}</td><td class="valor-total">${total}</td><td><div class="programacion-acciones">
        <button type="button" class="programacion-accion ver" data-programacion-ver="${p.fecha}" title="Ver" aria-label="Ver programación"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
        <button type="button" class="programacion-accion editar" data-programacion-editar="${p.fecha}" title="Editar" aria-label="Editar programación"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
        <button type="button" class="programacion-accion eliminar" data-programacion-eliminar="${p.fecha}" title="Eliminar" aria-label="Eliminar programación"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m3 0V4h8v2"/></svg></button>
      </div></td></tr>`;
    }).join('') : '<tr><td colspan="6" class="estado-vacio">Aún no hay programaciones guardadas</td></tr>';
    contenedor.querySelectorAll('[data-programacion-ver]').forEach(btn => btn.addEventListener('click', () => this.abrir(btn.dataset.programacionVer, 'ver')));
    contenedor.querySelectorAll('[data-programacion-editar]').forEach(btn => btn.addEventListener('click', () => this.abrir(btn.dataset.programacionEditar, 'editar')));
    contenedor.querySelectorAll('[data-programacion-eliminar]').forEach(btn => btn.addEventListener('click', () => this.eliminar(btn.dataset.programacionEliminar)));
  }
};

const Dashboard = {

  charts: {},
  autoRefreshId: null,
  programaciones: [],

  /* ---------- Ciclo de vida ---------- */

  init() {
    ['fecha-grafico-asistencia', 'fecha-grafico-cumplimiento'].forEach(id => {
      const input = document.getElementById(id);
      input.value = _hoyISO();
      input.max = _hoyISO();
      input.addEventListener('change', () => this.actualizar());
    });
    document.getElementById('dash-ranking-periodo').addEventListener('change', () => this.actualizar());
    document.getElementById('btn-refrescar-dashboard').addEventListener('click', () => this.actualizar());
    // "En vivo": refresco periódico + al detectar cambios desde otra pestaña del navegador
    window.addEventListener('storage', (e) => {
      if (e.key === 'asistencia_registros' || e.key === 'asistencia_trabajadores' || e.key === 'asistencia_programaciones') {
        this.actualizarSiVisible();
      }
    });
    if (this.autoRefreshId) clearInterval(this.autoRefreshId);
    this.autoRefreshId = setInterval(() => this.actualizarSiVisible(), 20000);
  },

  actualizarSiVisible() {
    if (App.pestanaActual === 'reportes') this.actualizar();
  },

  /* ---------- Utilidades de estado ---------- */

  estadoDeFila(registro, turno) {
    if (!registro) return 'AUSENTE';
    if (!registro.horaSalida) {
      return (registro.estadoEntrada === 'TARDANZA' || registro.estado === 'TARDANZA') ? 'TARDANZA' : 'SIN SALIDA';
    }
    const trabajados = horasTrabajadasAMinutos(registro.horasTrabajadas);
    const esperados = duracionTurnoMinutos(turno);
    return trabajados < esperados * UMBRAL_JORNADA_COMPLETA ? 'INCOMPLETO' : 'COMPLETO';
  },

  minutosTardanza(registro, turno) {
    if (!registro || (registro.estadoEntrada !== 'TARDANZA' && registro.estado !== 'TARDANZA') || !turno) return 0;
    const entradaMin = horaAMinutos(registro.horaEntrada);
    const inicioMin = horaAMinutos(turno.inicio);
    let diff = entradaMin - inicioMin;
    if (diff < 0) diff += 24 * 60;
    return Math.max(diff, 0);
  },

  _registrosUnicos(registros) {
    const mapa = new Map();
    registros.forEach(r => {
      const clave = `${r.fecha}|${r.turnoId}|${r.dni}`;
      if (!mapa.has(clave)) mapa.set(clave, r);
    });
    return Array.from(mapa.values());
  },

  _cantidadProgramada(fecha, turnoId, cierres = []) {
    const programacion = this.programaciones.find(p => p.fecha === fecha);
    if (programacion) {
      if (turnoId) return Math.max(0, Number(programacion.cantidades?.[turnoId]) || 0);
      return Object.values(programacion.cantidades || {}).reduce((s, n) => s + Math.max(0, Number(n) || 0), 0);
    }
    const cierresFecha = cierres.filter(c => c.fecha === fecha && (!turnoId || c.turnoId === turnoId));
    return cierresFecha.reduce((s, c) => s + Math.max(0, Number(c.programado) || 0), 0);
  },

  _programados(activos, cierres, fecha, turnoId = '') {
    const turnosIds = turnoId ? [turnoId] : ['T01', 'T02', 'T03'];
    return turnosIds.flatMap(id => Array.from({ length: this._cantidadProgramada(fecha, id, cierres) }, (_, i) => ({
      dni: `CUPO-${fecha}-${id}-${i + 1}`, nombres: 'Cupo programado', apellidos: '', turnoAsignado: id, estado: 'ACTIVO', esCupo: true
    })));
  },

  /* ---------- Actualización principal ---------- */

  async actualizar() {
    const fecha = _hoyISO();
    const obtenerFechaGrafico = id => {
      const input = document.getElementById(id);
      input.max = fecha;
      return input.value || fecha;
    };
    const fechaAsistencia = obtenerFechaGrafico('fecha-grafico-asistencia');
    const fechaCumplimiento = obtenerFechaGrafico('fecha-grafico-cumplimiento');
    const turnoId = '';
    const estadoFiltro = '';
    const periodo = '7';
    const rankingPeriodo = document.getElementById('dash-ranking-periodo').value;

    const [trabajadores, asistenciasOriginales, turnos, cierres, programaciones] = await Promise.all([
      DB.obtenerTrabajadores(),
      DB.obtenerAsistencias(),
      DB.obtenerTurnos(),
      DB.obtenerCierres(),
      DB.obtenerProgramaciones()
    ]);
    this.programaciones = programaciones;
    const asistencias = this._registrosUnicos(asistenciasOriginales);

    const activos = trabajadores.filter(t => t.estado === 'ACTIVO');
    const turnoPorId = {};
    turnos.forEach(t => { turnoPorId[t.id] = t; });

    const registrosDia = asistencias.filter(r => r.fecha === fecha && (!turnoId || r.turnoId === turnoId));
    const diasPeriodo = new Set(this._rangoDias(periodo, fecha));
    const registrosPeriodo = asistencias.filter(r => diasPeriodo.has(r.fecha) && (!turnoId || r.turnoId === turnoId));
    this.registrosDia = registrosDia;

    const crearFilas = (fechaFilas, registros) => turnos.flatMap(turno => {
      const regs = registros.filter(r => r.turnoId === turno.id);
      const cantidad = this._cantidadProgramada(fechaFilas, turno.id, cierres);
      const filasPresentes = regs.map(r => {
        const trabajador = trabajadores.find(t => t.dni === r.dni) || { dni:r.dni, nombres:r.nombreCompleto, apellidos:'', turnoAsignado:turno.id };
        return { trabajador, registro:r, turno, estadoFila:this.estadoDeFila(r, turno) };
      });
      const faltantes = Math.max(cantidad - regs.length, 0);
      const filasAusentes = Array.from({ length:faltantes }, (_, i) => ({
        trabajador:{ dni:'—', nombres:`Cupo sin registrar ${i + 1}`, apellidos:'', turnoAsignado:turno.id, esCupo:true },
        registro:null, turno, estadoFila:'AUSENTE'
      }));
      return filasPresentes.concat(filasAusentes);
    });

    const filas = crearFilas(fecha, registrosDia);

    this._renderKpis(filas, registrosDia, this._cantidadProgramada(fecha, '', cierres));
    const resumenAsistencia = this._renderChartAsistenciaTurno(activos, asistencias, fechaAsistencia, turnos, cierres, turnoId);
    this._renderChartTendencia(activos, asistencias, periodo, turnoId, fecha, cierres);
    this._renderChartPuntualidad(registrosPeriodo, turnos, turnoId);
    const resumenCumplimiento = this._renderChartCumplimiento(activos, asistencias, fechaCumplimiento, turnos, cierres, turnoId);
    this._renderChartAusentismo(activos, asistencias, turnoId, fecha, cierres);
    this._renderSalidasAnticipadas(asistencias, turnos, periodo, turnoId, fecha);
    this._renderAlertas(filas);
    this._renderMetodoRegistro(registrosPeriodo);
    this._renderRanking(activos, asistencias, turnos, rankingPeriodo, turnoId, fecha, cierres);
    this._renderTablaTiempoReal(filas, estadoFiltro);

    const rangoTexto = this._textoRango(periodo, fecha);
    document.getElementById('sub-asistencia-turno').textContent = resumenAsistencia.programados > 0
      ? `Fecha: ${UI.formatearFecha(fechaAsistencia)} · ${resumenAsistencia.programados} programados · ${resumenAsistencia.presentes} presentes · ${resumenAsistencia.ausentes} ausentes · ${resumenAsistencia.tardanzas} tardanzas`
      : `Fecha: ${UI.formatearFecha(fechaAsistencia)} · Sin cantidades programadas para esta fecha`;
    document.getElementById('sub-tendencia').textContent = `Evolución diaria · ${rangoTexto}`;
    document.getElementById('sub-puntualidad').textContent = `Presentes puntuales · ${rangoTexto}`;
    document.getElementById('sub-cumplimiento').textContent = `Fecha ${UI.formatearFecha(fechaCumplimiento)} · ${resumenCumplimiento}`;
    document.getElementById('sub-salidas').textContent = `Salidas anticipadas · ${rangoTexto}`;
    document.getElementById('sub-metodo-registro').textContent = rangoTexto;

    document.getElementById('dash-ultima-actualizacion').textContent =
      `Última actualización: ${new Date().toLocaleTimeString('es-PE', { hour12: false })}`;
  },

  /* ---------- KPIs ---------- */

  _renderKpis(filas, registrosDia, cantidadProgramada) {
    const programado = cantidadProgramada;
    const presentes = new Set(registrosDia.map(r => `${r.turnoId}|${r.dni}`)).size;
    const incompletas = filas.filter(f => f.estadoFila === 'INCOMPLETO').length;
    const pct = programado > 0 ? Math.min(presentes / programado * 100, 100) : 0;

    const minutosTotales = registrosDia
      .filter(r => r.horaSalida)
      .reduce((acc, r) => acc + horasTrabajadasAMinutos(r.horasTrabajadas), 0);
    const hh = Math.floor(minutosTotales / 60);
    const mm = Math.round(minutosTotales % 60);

    const pct2 = (n) => programado > 0 ? `${Math.min(n / programado * 100, 100).toFixed(1)}% del total` : '0% del total';

    document.getElementById('kpi-programado').textContent = programado;
    document.getElementById('kpi-presentes').textContent = presentes;
    document.getElementById('kpi-presentes-sub').textContent = pct2(presentes);
    document.getElementById('kpi-porcentaje').textContent = `${pct.toFixed(1)}%`;
    document.getElementById('kpi-horas').textContent = `${hh}:${String(mm).padStart(2, '0')} h`;
    document.getElementById('kpi-incompletas').textContent = incompletas;
    document.getElementById('kpi-incompletas-sub').textContent = pct2(incompletas);
  },

  /* ---------- Gráfico 1: Asistencia por turno ---------- */

  _renderChartAsistenciaTurno(activos, asistencias, fecha, turnos, cierres, turnoId = '') {
    const registrosDia = asistencias.filter(r => r.fecha === fecha);
    const turnosVisibles = turnoId ? turnos.filter(t => t.id === turnoId) : turnos;
    const labels = turnosVisibles.map(t => t.nombre.replace('TURNO ', 'T'));
    const programados = [], presentes = [], ausentes = [], tardanzas = [];

    turnosVisibles.forEach(t => {
      const cantidadProgramada = this._cantidadProgramada(fecha, t.id, cierres);
      const registrosTurno = registrosDia.filter(r => r.turnoId === t.id);
      const presentesUnicos = new Set(registrosTurno.map(r => r.dni)).size;
      programados.push(cantidadProgramada);
      presentes.push(presentesUnicos);
      ausentes.push(Math.max(cantidadProgramada - presentesUnicos, 0));
      tardanzas.push(registrosTurno.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length);
    });

    this._crearChart('chart-asistencia-turno', 'bar', {
      labels,
      datasets: [
        { label: 'Programados', data: programados, backgroundColor: '#1687FF', borderRadius: 5 },
        { label: 'Presentes', data: presentes, backgroundColor: '#43C552', borderRadius: 5 },
        { label: 'Ausentes', data: ausentes, backgroundColor: '#F43F4F', borderRadius: 5 },
        { label: 'Tardanzas', data: tardanzas, backgroundColor: '#FF781F', borderRadius: 5 }
      ]
    }, {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    });
    return {
      programados: programados.reduce((s, n) => s + n, 0),
      presentes: presentes.reduce((s, n) => s + n, 0),
      ausentes: ausentes.reduce((s, n) => s + n, 0),
      tardanzas: tardanzas.reduce((s, n) => s + n, 0)
    };
  },

  /* ---------- Gráfico 2: Tendencia de asistencia (%) ---------- */

  _renderChartTendencia(activos, asistencias, periodo, turnoId, fechaBase, cierres) {
    const dias = this._rangoDias(periodo, fechaBase);

    const labels = [];
    const datos = [];
    dias.forEach(fechaISO => {
      const registrosDia = asistencias.filter(r => r.fecha === fechaISO && (!turnoId || r.turnoId === turnoId));
      const presentesUnicos = new Set(registrosDia.map(r => r.dni)).size;
      const programado = this._programados(activos, cierres, fechaISO, turnoId).length;
      labels.push(fechaISO.slice(8, 10) + '/' + fechaISO.slice(5, 7));
      datos.push(programado > 0 ? +Math.min(presentesUnicos / programado * 100, 100).toFixed(1) : 0);
    });

    this._crearChart('chart-tendencia', 'line', {
      labels,
      datasets: [{
        label: '% Asistencia',
        data: datos,
        borderColor: '#1687FF',
        backgroundColor: 'rgba(22,135,255,0.16)',
        areaGradient: ['rgba(22,135,255,0.34)', 'rgba(22,135,255,0.015)'],
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    }, {
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } }
    });
  },

  _rangoDias(periodo, fechaBase = _hoyISO()) {
    const [anio, mes, dia] = fechaBase.split('-').map(Number);
    const hoy = new Date(anio, mes - 1, dia);
    const dias = [];
    if (periodo === 'mes') {
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      for (let d = new Date(inicioMes); d <= hoy; d.setDate(d.getDate() + 1)) {
        dias.push(_fechaLocalISO(new Date(d)));
      }
    } else {
      const n = parseInt(periodo, 10) || 7;
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(hoy);
        d.setDate(hoy.getDate() - i);
        dias.push(_fechaLocalISO(d));
      }
    }
    return dias;
  },

  _textoRango(periodo, fechaBase) {
    const dias = this._rangoDias(periodo, fechaBase);
    if (!dias.length) return 'Periodo sin fechas';
    const etiqueta = String(periodo) === '7' ? 'Últimos 7 días' : 'Periodo seleccionado';
    return `${etiqueta}: ${UI.formatearFecha(dias[0])} al ${UI.formatearFecha(dias[dias.length - 1])}`;
  },

  _numeroSemanaISO(fecha) {
    const dia = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
    dia.setUTCDate(dia.getUTCDate() + 4 - (dia.getUTCDay() || 7));
    const inicioAnio = new Date(Date.UTC(dia.getUTCFullYear(), 0, 1));
    return Math.ceil((((dia - inicioAnio) / 86400000) + 1) / 7);
  },

  /* ---------- Gráfico 3: Puntualidad por turno (%) ---------- */

  _renderChartPuntualidad(registrosPeriodo, turnos, turnoId = '') {
    const turnosVisibles = turnoId ? turnos.filter(t => t.id === turnoId) : turnos;
    const labels = turnosVisibles.map(t => t.nombre.replace('TURNO ', 'T'));
    const datos = turnosVisibles.map(t => {
      const registrosTurno = registrosPeriodo.filter(r => r.turnoId === t.id);
      const tardanzas = registrosTurno.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
      return registrosTurno.length > 0
        ? +((registrosTurno.length - tardanzas) / registrosTurno.length * 100).toFixed(1)
        : 0;
    });

    this._crearChart('chart-puntualidad', 'bar', {
      labels,
      datasets: [{ label: '% Puntualidad', data: datos, backgroundColor: '#1687FF', borderRadius: 6 }]
    }, {
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: { x: { min: 0, max: 100, ticks: { callback: v => v + '%' } } }
    });
  },

  /* ---------- Gráfico 4: Tardanzas por turno ---------- */

  /* ---------- Gráfico 5: Cumplimiento de jornada (horas) ---------- */

  _renderChartCumplimiento(activos, asistencias, fecha, turnos, cierres, turnoId = '') {
    const registrosDia = asistencias.filter(r => r.fecha === fecha);
    const turnosVisibles = turnoId ? turnos.filter(t => t.id === turnoId) : turnos;
    const labels = turnosVisibles.map(t => t.nombre.replace('TURNO ', 'T'));
    const esperadas = [], trabajadas = [];

    turnosVisibles.forEach(t => {
      const programadosTurno = this._cantidadProgramada(fecha, t.id, cierres);
      esperadas.push(programadosTurno > 0 ? +(duracionTurnoMinutos(t) / 60).toFixed(1) : 0);
      const regsTurno = registrosDia.filter(r => r.turnoId === t.id);
      if (regsTurno.length === 0) {
        trabajadas.push(0);
      } else {
        const promedioMin = regsTurno.reduce((acc, r) => acc + (r.horaSalida ? horasTrabajadasAMinutos(r.horasTrabajadas) : 0), 0) / regsTurno.length;
        trabajadas.push(+(promedioMin / 60).toFixed(1));
      }
    });

    this._crearChart('chart-cumplimiento', 'bar', {
      labels,
      datasets: [
        { label: 'Horas esperadas', data: esperadas, backgroundColor: '#A78BFA', borderRadius: 5 },
        { label: 'Horas trabajadas (prom.)', data: trabajadas, backgroundColor: '#7C3AED', borderRadius: 5 }
      ]
    }, {
      indexAxis: 'y',
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => v + 'h' } } }
    });
    return turnosVisibles.map((t, i) => {
      const programadosTurno = this._cantidadProgramada(fecha, t.id, cierres);
      return `${t.nombre.replace('TURNO ', 'T')}: ${programadosTurno} programados, ${esperadas[i]} h esperadas`;
    }).join(' · ');
  },

  /* ---------- Gráfico 6: Ausentismo (%) semanal ---------- */

  _renderChartAusentismo(activos, asistencias, turnoId, fechaBase, cierres) {
    const [anio, mes, diaBase] = fechaBase.split('-').map(Number);
    const hoy = new Date(anio, mes - 1, diaBase);

    // Retrocede al lunes de la semana actual
    const diaSemana = (hoy.getDay() + 6) % 7; // 0 = lunes
    const lunesActual = new Date(hoy);
    lunesActual.setDate(hoy.getDate() - diaSemana);

    const labels = [];
    const datos = [];

    for (let s = 4; s >= 0; s--) {
      const inicioSemana = new Date(lunesActual);
      inicioSemana.setDate(lunesActual.getDate() - s * 7);

      let ausentesTotal = 0, programadoTotal = 0;
      for (let d = 0; d < 7; d++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + d);
        if (dia > hoy) break;
        const fechaISO = _fechaLocalISO(dia);
        const registrosDia = asistencias.filter(r => r.fecha === fechaISO && (!turnoId || r.turnoId === turnoId));
        const presentesUnicos = new Set(registrosDia.map(r => r.dni)).size;
        const programado = this._programados(activos, cierres, fechaISO, turnoId).length;
        ausentesTotal += Math.max(programado - presentesUnicos, 0);
        programadoTotal += programado;
      }

      labels.push(`Sem ${this._numeroSemanaISO(inicioSemana)}`);
      datos.push(programadoTotal > 0 ? +(ausentesTotal / programadoTotal * 100).toFixed(1) : 0);
    }

    this._crearChart('chart-ausentismo', 'line', {
      labels,
      datasets: [{
        label: '% Ausentismo',
        data: datos,
        borderColor: '#F43F4F',
        backgroundColor: 'rgba(244,63,79,0.15)',
        areaGradient: ['rgba(244,63,79,0.34)', 'rgba(244,63,79,0.015)'],
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    }, {
      plugins: { legend: { display: false } },
      scales: { y: { min: 0, ticks: { callback: v => v + '%' } } }
    });
  },

  _renderSalidasAnticipadas(asistencias, turnos, periodo, turnoId, fechaBase) {
    const dias = new Set(this._rangoDias(periodo, fechaBase));
    const turnoPorId = {};
    turnos.forEach(t => { turnoPorId[t.id] = t; });
    const rangos = [0, 0, 0, 0];
    let minutosPerdidos = 0;

    asistencias
      .filter(r => dias.has(r.fecha) && r.horaSalida && (!turnoId || r.turnoId === turnoId))
      .forEach(r => {
        const turno = turnoPorId[r.turnoId];
        if (!turno) return;
        if (r.estadoSalida && r.estadoSalida !== 'SALIDA ANTICIPADA') return;
        const guardados = Number(r.minutosSalidaAnticipada);
        const anticipacion = Number.isFinite(guardados) && guardados > 0
          ? guardados
          : _minutosSalidaAnticipada(r, turno);
        if (anticipacion <= 0) return;
        minutosPerdidos += anticipacion;
        if (anticipacion <= 15) rangos[0]++;
        else if (anticipacion <= 30) rangos[1]++;
        else if (anticipacion <= 60) rangos[2]++;
        else rangos[3]++;
      });

    const etiquetas = ['0 - 15 min', '16 - 30 min', '31 - 60 min', '+ 60 min'];
    const colores = ['#16A34A', '#FBBF24', '#F97316', '#DC2626'];
    const total = rangos.reduce((suma, valor) => suma + valor, 0);
    this._crearChart('chart-salidas-anticipadas', 'doughnut', {
      labels: etiquetas,
      datasets: [{ data: rangos, backgroundColor: colores, borderWidth: 0 }]
    }, { plugins: { legend: { display: false } }, cutout: '62%' }, {
      centerText: String(total), centerLabel: total === 1 ? 'Salida' : 'Salidas'
    });

    document.getElementById('leyenda-salidas-anticipadas').innerHTML = etiquetas.map((etiqueta, i) => {
      const porcentaje = total ? (rangos[i] / total * 100).toFixed(1) : '0.0';
      return `<div class="leyenda-item"><span class="leyenda-punto" style="background:${colores[i]}"></span><div><div class="leyenda-titulo">${etiqueta}</div><div class="leyenda-cantidad">${rangos[i]} (${porcentaje}%)</div></div></div>`;
    }).join('');
    document.getElementById('dash-tiempo-perdido').textContent =
      `${Math.floor(minutosPerdidos / 60)} h ${String(minutosPerdidos % 60).padStart(2, '0')} min`;
  },

  /* ---------- Alertas ---------- */

  _renderAlertas(filas) {
    const ausentes = filas.filter(f => f.estadoFila === 'AUSENTE');
    const tardanzas = filas.filter(f => f.registro && (f.registro.estadoEntrada === 'TARDANZA' || f.registro.estado === 'TARDANZA'));
    const sinSalida = filas.filter(f => f.estadoFila === 'SIN SALIDA' || f.estadoFila === 'TARDANZA');
    const incompletas = filas.filter(f => f.estadoFila === 'INCOMPLETO');

    const alertas = [
      { id: 'ausentes', icono: '🔴', texto: `${ausentes.length} trabajador${ausentes.length === 1 ? '' : 'es'} ausente${ausentes.length === 1 ? '' : 's'}`, lista: ausentes },
      { id: 'tardanzas', icono: '🟠', texto: `${tardanzas.length} trabajador${tardanzas.length === 1 ? '' : 'es'} con tardanza`, lista: tardanzas },
      { id: 'sinsalida', icono: '⚠️', texto: `${sinSalida.length} trabajador${sinSalida.length === 1 ? '' : 'es'} sin registrar salida`, lista: sinSalida },
      { id: 'incompletas', icono: '🔵', texto: `${incompletas.length} trabajador${incompletas.length === 1 ? '' : 'es'} con jornada incompleta`, lista: incompletas }
    ];

    const contenedor = document.getElementById('dash-alertas');
    contenedor.innerHTML = alertas.map(a => `
      <div class="dash-alerta" data-alerta="${a.id}">
        <div class="dash-alerta-fila">
          <span>${a.icono} ${a.texto}</span>
          <span class="dash-alerta-link">Ver detalles ›</span>
        </div>
        <div class="dash-alerta-detalle oculto" id="detalle-alerta-${a.id}">
          ${a.id === 'ausentes'
            ? `<p class="sub">Faltan ${a.lista.length} cupo${a.lista.length === 1 ? '' : 's'} por cubrir. La programación es por cantidades, por eso no se asignan nombres ni DNI a las ausencias.</p>`
            : (a.lista.length === 0
              ? '<p class="sub">Sin trabajadores en esta categoría.</p>'
              : a.lista.map(f => `<div class="dash-alerta-item">${UI.escaparHtml(f.trabajador.nombres)} ${UI.escaparHtml(f.trabajador.apellidos)} <span class="sub">(${UI.escaparHtml(f.trabajador.dni)})</span></div>`).join(''))}
        </div>
      </div>
    `).join('');

    contenedor.querySelectorAll('.dash-alerta-fila').forEach(fila => {
      fila.addEventListener('click', () => {
        const id = fila.closest('.dash-alerta').dataset.alerta;
        const detalle = document.getElementById(`detalle-alerta-${id}`);
        const yaAbierto = !detalle.classList.contains('oculto');
        contenedor.querySelectorAll('.dash-alerta-detalle').forEach(d => d.classList.add('oculto'));
        if (!yaAbierto) detalle.classList.remove('oculto');
      });
    });
  },

  /* ---------- Método de registro (donut) ---------- */

  _renderMetodoRegistro(registrosPeriodo) {
    const metodos = registrosPeriodo.flatMap(r => [r.metodoEntrada || r.metodo || 'DNI', ...(r.horaSalida ? [r.metodoSalida || 'DNI'] : [])]);
    const qr = metodos.filter(m => m === 'QR').length;
    const dni = metodos.filter(m => m !== 'QR').length;
    const total = qr + dni;

    this._crearChart('chart-metodo', 'doughnut', {
      labels: ['QR', 'DNI'],
      datasets: [{ data: [qr, dni], backgroundColor: ['#2563EB', '#F97316'], borderWidth: 0 }]
    }, { plugins: { legend: { display: false } }, cutout: '65%' }, {
      centerText: String(total), centerLabel: total === 1 ? 'Registro' : 'Registros'
    });

    document.getElementById('leyenda-metodo').innerHTML = `
      <div class="leyenda-item"><span class="leyenda-punto" style="background:#2563EB"></span>
        <div><div class="leyenda-titulo">QR</div><div class="leyenda-cantidad">${total > 0 ? (qr / total * 100).toFixed(0) : 0}% (${qr})</div></div></div>
      <div class="leyenda-item"><span class="leyenda-punto" style="background:#F97316"></span>
        <div><div class="leyenda-titulo">DNI</div><div class="leyenda-cantidad">${total > 0 ? (dni / total * 100).toFixed(0) : 0}% (${dni})</div></div></div>
    `;
    document.getElementById('dash-total-registros').textContent = `Total registros del periodo: ${total}`;
  },

  /* ---------- Ranking de incidencias ---------- */

  _renderRanking(activos, asistencias, turnos, periodo, turnoId, fechaBase, cierres) {
    const dias = periodo === 'hoy' ? [fechaBase] : this._rangoDias(periodo === 'mes' ? 'mes' : periodo, fechaBase);
    const diasSet = new Set(dias);
    const turnoPorId = {};
    turnos.forEach(t => { turnoPorId[t.id] = t; });

    // Tardanzas
    const tardanzasPorDni = {};
    asistencias
      .filter(r => diasSet.has(r.fecha) && (r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA') && (!turnoId || r.turnoId === turnoId))
      .forEach(r => {
        if (!tardanzasPorDni[r.dni]) tardanzasPorDni[r.dni] = { nombre: r.nombreCompleto, cantidad: 0, minutos: 0 };
        tardanzasPorDni[r.dni].cantidad++;
        tardanzasPorDni[r.dni].minutos += this.minutosTardanza(r, turnoPorId[r.turnoId]);
      });
    const rankingTardanzas = Object.values(tardanzasPorDni).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    // La programación guarda cantidades, no identidades. No se atribuyen
    // ausencias a trabajadores ficticios.
    const rankingAusencias = [];

    const tbodyT = document.getElementById('ranking-tardanzas');
    const maxTardanzas = Math.max(...rankingTardanzas.map(r => r.cantidad), 1);
    tbodyT.innerHTML = rankingTardanzas.length === 0
      ? '<tr><td colspan="3" class="tabla-vacia">Sin tardanzas en el periodo</td></tr>'
      : rankingTardanzas.map((r, i) => `<tr><td>${i + 1}</td><td>${r.nombre}</td><td><div class="ranking-dato"><span class="ranking-barra"><i style="width:${r.cantidad / maxTardanzas * 100}%"></i></span><span>${r.cantidad} (${r.minutos} min)</span></div></td></tr>`).join('');

    const tbodyA = document.getElementById('ranking-ausencias');
    const maxAusencias = Math.max(...rankingAusencias.map(r => r.dias), 1);
    tbodyA.innerHTML = rankingAusencias.length === 0
      ? '<tr><td colspan="3" class="tabla-vacia">No disponible: la programación se registra por cantidades, no por trabajador</td></tr>'
      : rankingAusencias.map((r, i) => `<tr><td>${i + 1}</td><td>${r.nombre}</td><td><div class="ranking-dato"><span class="ranking-barra"><i style="width:${r.dias / maxAusencias * 100}%"></i></span><span>${r.dias} día${r.dias === 1 ? '' : 's'}</span></div></td></tr>`).join('');
  },

  /* ---------- Tabla de asistencia en tiempo real ---------- */

  _renderTablaTiempoReal(filas, estadoFiltro) {
    const colorEstado = { COMPLETO: 'verde', 'SIN SALIDA': 'naranja', AUSENTE: 'rojo', TARDANZA: 'naranja', INCOMPLETO: 'azul' };
    // Los cupos faltantes se muestran como cantidad, nunca como personas ficticias.
    let filasFiltradas = filas.filter(f => f.registro);
    if (estadoFiltro) filasFiltradas = filasFiltradas.filter(f => f.estadoFila === estadoFiltro);

    filasFiltradas = [...filasFiltradas].sort((a, b) => {
      if (!!a.registro !== !!b.registro) return a.registro ? -1 : 1;
      if (a.registro && b.registro) return a.registro.horaEntrada < b.registro.horaEntrada ? -1 : 1;
      return 0;
    });

    const tbody = document.getElementById('tabla-tiempo-real');
    if (filasFiltradas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="tabla-vacia">Sin registros para este filtro</td></tr>';
      return;
    }

    tbody.innerHTML = filasFiltradas.map((f, i) => {
      const r = f.registro;
      const turnoLabel = r ? r.turnoNombre.replace('TURNO ', 'T') : (f.trabajador.turnoAsignado || '—');
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${UI.escaparHtml(f.trabajador.nombres)} ${UI.escaparHtml(f.trabajador.apellidos)}</td>
          <td>${UI.escaparHtml(f.trabajador.dni)}</td>
          <td>${turnoLabel}</td>
          <td>${r ? r.horaEntrada.slice(0, 5) : '—'}</td>
          <td>${r && r.horaSalida ? r.horaSalida.slice(0, 5) : '—'}</td>
          <td>${r && r.horasTrabajadas ? r.horasTrabajadas : '—'}</td>
          <td><span class="badge badge-${colorEstado[f.estadoFila]}">${f.estadoFila}</span></td>
          <td>${r ? `<span class="badge badge-${r.metodo === 'QR' ? 'azul' : 'naranja'}">${r.metodo === 'QR' ? '📷 QR' : '🔎 DNI'}</span>` : '—'}</td>
        </tr>
      `;
    }).join('');
  },

  /* ---------- Utilidad genérica para crear/recrear gráficos Chart.js ---------- */

  _crearChartNativo(canvas, tipo, data, opciones = {}, centro = null) {
    const esDona = tipo === 'doughnut';
    const ladoDona = Math.max(120, Math.min(canvas.parentElement?.clientWidth || 168, canvas.parentElement?.clientHeight || 168, 168));
    const ancho = esDona ? ladoDona : Math.max(canvas.clientWidth || canvas.parentElement.clientWidth || 300, 220);
    const alto = esDona ? ladoDona : Math.max(canvas.clientHeight || canvas.parentElement.clientHeight || 240, 160);
    const escala = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = ancho * escala;
    canvas.height = alto * escala;
    const ctx = canvas.getContext('2d');
    const oscuro = ['oscuro', 'gris'].includes(document.documentElement.dataset.temaFondo);
    const textoGrafico = oscuro ? '#DCE9F8' : '#475569';
    const textoSuave = oscuro ? '#9FB6CF' : '#64748B';
    const lineaGrafico = oscuro ? 'rgba(116,161,207,.19)' : '#E2E8F0';
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    const datasets = data.datasets || [];
    const labels = data.labels || [];
    const color = (d, i, defecto = '#2563EB') => {
      const valor = d.backgroundColor || d.borderColor || defecto;
      return Array.isArray(valor) ? valor[i % valor.length] : valor;
    };

    if (tipo === 'doughnut') {
      const valores = datasets[0]?.data || [];
      const total = valores.reduce((s, v) => s + Number(v || 0), 0);
      const radio = Math.min(ancho, alto) * .3;
      const cx = ancho / 2, cy = alto / 2, grosor = radio * .4;
      let angulo = -Math.PI / 2;
      if (!total) {
        ctx.beginPath(); ctx.arc(cx, cy, radio, 0, Math.PI * 2); ctx.strokeStyle = lineaGrafico; ctx.lineWidth = grosor; ctx.stroke();
      } else valores.forEach((v, i) => {
        const porcion = Number(v || 0) / total * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx, cy, radio, angulo, angulo + porcion); ctx.strokeStyle = color(datasets[0], i); ctx.lineWidth = grosor; ctx.stroke();
        if (Number(v || 0) > 0 && porcion > 0.16) {
          const medio = angulo + porcion / 2;
          const etiquetaRadio = radio;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 10px system-ui'; ctx.fillStyle = '#FFFFFF';
          ctx.fillText(String(v), cx + Math.cos(medio) * etiquetaRadio, cy + Math.sin(medio) * etiquetaRadio);
        }
        angulo += porcion;
      });
      if (centro) {
        ctx.textAlign = 'center'; ctx.fillStyle = oscuro ? '#FFFFFF' : '#0F172A'; ctx.font = '700 15px system-ui'; ctx.fillText(centro.centerText, cx, cy - 3);
        ctx.fillStyle = textoSuave; ctx.font = '9px system-ui'; ctx.fillText(centro.centerLabel, cx, cy + 11);
      }
      return;
    }

    const horizontal = opciones.indexAxis === 'y';
    const margen = { izq: horizontal ? 76 : 46, der: 18, sup: datasets.length > 2 ? 58 : (datasets.length > 1 ? 42 : 24), inf: 40 };
    const w = ancho - margen.izq - margen.der, h = alto - margen.sup - margen.inf;
    const valores = datasets.flatMap(d => (d.data || []).map(Number));
    const limite = opciones.scales?.y?.max || opciones.scales?.x?.max || 0;
    const maximo = Math.max(Number(limite), ...valores, 1);
    if (datasets.length > 1) {
      let leyendaX = margen.izq, leyendaY = 12;
      ctx.font = '9px system-ui'; ctx.textAlign = 'left';
      datasets.forEach((d, i) => {
        const texto = d.label || `Serie ${i + 1}`;
        const espacio = ctx.measureText(texto).width + 30;
        if (leyendaX + espacio > ancho - margen.der) { leyendaX = margen.izq; leyendaY += 18; }
        ctx.fillStyle = color(d, i); ctx.fillRect(leyendaX, leyendaY, 9, 9);
        ctx.fillStyle = textoGrafico; ctx.fillText(texto, leyendaX + 13, leyendaY + 8);
        leyendaX += espacio;
      });
    }
    ctx.strokeStyle = lineaGrafico; ctx.lineWidth = 1; ctx.font = '9px system-ui'; ctx.fillStyle = textoSuave;
    for (let i = 0; i <= 4; i++) {
      const proporcion = i / 4;
      if (horizontal) {
        const x = margen.izq + w * proporcion;
        ctx.beginPath(); ctx.moveTo(x, margen.sup); ctx.lineTo(x, margen.sup + h); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillText(String(Math.round(maximo * proporcion)), x, alto - 18);
      } else {
        const y = margen.sup + h * proporcion;
        ctx.beginPath(); ctx.moveTo(margen.izq, y); ctx.lineTo(ancho - margen.der, y); ctx.stroke();
        const valor = maximo * (1 - proporcion);
        const esPorcentaje = canvas.id.includes('tendencia') || canvas.id.includes('puntualidad') || canvas.id.includes('ausentismo');
        ctx.textAlign = 'right'; ctx.fillText(`${Number.isInteger(valor) ? valor : valor.toFixed(1)}${esPorcentaje ? '%' : ''}`, margen.izq - 6, y + 3);
      }
    }
    ctx.strokeStyle = oscuro ? 'rgba(159,182,207,.46)' : '#94A3B8';
    ctx.beginPath(); ctx.moveTo(margen.izq, margen.sup); ctx.lineTo(margen.izq, margen.sup + h); ctx.lineTo(ancho - margen.der, margen.sup + h); ctx.stroke();

    const tituloEje = canvas.id.includes('cumplimiento') ? 'Horas' :
      (canvas.id.includes('puntualidad') || canvas.id.includes('tendencia') || canvas.id.includes('ausentismo')) ? 'Porcentaje' : 'Trabajadores / registros';
    ctx.save(); ctx.fillStyle = textoSuave; ctx.font = '600 9px system-ui';
    if (horizontal) {
      ctx.textAlign = 'center'; ctx.fillText(tituloEje, margen.izq + w / 2, alto - 3);
    } else {
      ctx.translate(10, margen.sup + h / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText(tituloEje, 0, 0);
    }
    ctx.restore();

    if (tipo === 'line') {
      datasets.forEach(d => {
        const puntos = (d.data || []).map((v, i, arr) => ({
          x: margen.izq + (arr.length < 2 ? w / 2 : w * i / (arr.length - 1)),
          y: margen.sup + h - Number(v || 0) / maximo * h,
          valor: v
        }));
        if (d.fill && d.areaGradient && puntos.length) {
          ctx.beginPath();
          puntos.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
          ctx.lineTo(puntos[puntos.length - 1].x, margen.sup + h);
          ctx.lineTo(puntos[0].x, margen.sup + h);
          ctx.closePath();
          const degradado = ctx.createLinearGradient(0, margen.sup, 0, margen.sup + h);
          degradado.addColorStop(0, d.areaGradient[0]);
          degradado.addColorStop(1, d.areaGradient[1]);
          ctx.fillStyle = degradado;
          ctx.fill();
        }
        ctx.beginPath();
        puntos.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.strokeStyle = d.borderColor || '#2563EB'; ctx.lineWidth = 2.5; ctx.stroke();
        puntos.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fillStyle = d.borderColor || '#2563EB'; ctx.fill();
          ctx.textAlign = 'center'; ctx.font = '700 9px system-ui'; ctx.fillStyle = oscuro ? '#F4F8FF' : '#334155'; ctx.fillText(String(p.valor), p.x, p.y - 9);
        });
      });
      const paso = Math.max(1, Math.ceil(labels.length / 7));
      ctx.textAlign = 'center'; ctx.font = '9px system-ui'; ctx.fillStyle = textoSuave;
      labels.forEach((l, i) => { if (i % paso === 0 || i === labels.length - 1) ctx.fillText(l, margen.izq + (labels.length < 2 ? w / 2 : w * i / (labels.length - 1)), alto - 10); });
      return;
    }

    if (horizontal) {
      const gh = h / Math.max(labels.length, 1), bh = Math.min(18, gh / Math.max(datasets.length, 1) * .75);
      labels.forEach((l, li) => {
        ctx.textAlign = 'right'; ctx.font = '10px system-ui'; ctx.fillStyle = textoGrafico; ctx.fillText(l, margen.izq - 6, margen.sup + gh * (li + .5) + 3);
        datasets.forEach((d, di) => { const v = Number(d.data?.[li] || 0), y = margen.sup + gh * li + (gh - bh * datasets.length) / 2 + di * bh; ctx.fillStyle = color(d, li); ctx.fillRect(margen.izq, y, v / maximo * w, Math.max(bh - 2, 2)); ctx.textAlign = 'left'; ctx.font = '600 9px system-ui'; ctx.fillStyle = oscuro ? '#F4F8FF' : '#334155'; ctx.fillText(String(v), margen.izq + v / maximo * w + 4, y + bh - 5); });
      });
    } else {
      const gw = w / Math.max(labels.length, 1), bw = Math.min(26, gw / Math.max(datasets.length, 1) * .75);
      labels.forEach((l, li) => {
        datasets.forEach((d, di) => { const v = Number(d.data?.[li] || 0), bh = v / maximo * h, x = margen.izq + gw * li + (gw - bw * datasets.length) / 2 + di * bw; ctx.fillStyle = color(d, li); ctx.fillRect(x, margen.sup + h - bh, Math.max(bw - 2, 2), bh); ctx.textAlign = 'center'; ctx.font = '600 9px system-ui'; ctx.fillStyle = oscuro ? '#F4F8FF' : '#334155'; ctx.fillText(String(v), x + bw / 2, margen.sup + h - bh - 4); });
        ctx.textAlign = 'center'; ctx.font = '10px system-ui'; ctx.fillStyle = textoGrafico; ctx.fillText(l, margen.izq + gw * (li + .5), alto - 10);
      });
    }
  },

  _crearChart(canvasId, tipo, data, opciones = {}, centro = null) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    const modoDashboardOscuro = ['oscuro', 'gris'].includes(document.documentElement.dataset.temaFondo);
    if (typeof Chart === 'undefined') {
      this._crearChartNativo(ctx, tipo, data, opciones, centro);
      return;
    }
    if (this.charts[canvasId] && typeof this.charts[canvasId].destroy === 'function') this.charts[canvasId].destroy();

    const plugins = [];
    if (centro) {
      plugins.push({
        id: `centro-${canvasId}`,
        beforeDraw(chart) {
          const { ctx, chartArea: { left, right, top, bottom } } = chart;
          ctx.save();
          const cx = (left + right) / 2;
          const cy = (top + bottom) / 2;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '700 15px sans-serif';
          ctx.fillStyle = modoDashboardOscuro ? '#FFFFFF' : '#111827';
          ctx.fillText(centro.centerText, cx, cy - 4);
          ctx.font = '600 8px sans-serif';
          ctx.fillStyle = modoDashboardOscuro ? '#9FB6CF' : '#6B7280';
          ctx.fillText(centro.centerLabel, cx, cy + 9);
          ctx.restore();
        }
      });
    }

    plugins.push({
      id: `etiquetas-datos-${canvasId}`,
      afterDatasetsDraw(chart) {
        const contexto = chart.ctx;
        contexto.save();
        contexto.font = '700 10px system-ui, sans-serif';
        contexto.textAlign = 'center';
        contexto.textBaseline = 'middle';
        chart.data.datasets.forEach((dataset, indiceDataset) => {
          const meta = chart.getDatasetMeta(indiceDataset);
          if (meta.hidden) return;
          meta.data.forEach((elemento, indice) => {
            const valor = Number(dataset.data[indice] || 0);
            if (!Number.isFinite(valor) || (chart.config.type === 'doughnut' && valor === 0)) return;
            const posicion = elemento.tooltipPosition();
            if (chart.config.type === 'doughnut') {
              contexto.fillStyle = '#FFFFFF';
              contexto.shadowColor = 'rgba(15,23,42,.65)';
              contexto.shadowBlur = 3;
              contexto.fillText(String(valor), posicion.x, posicion.y);
              contexto.shadowBlur = 0;
            } else if (chart.options.indexAxis === 'y') {
              contexto.textAlign = 'left'; contexto.fillStyle = modoDashboardOscuro ? '#EAF3FF' : '#334155';
              contexto.fillText(String(valor), posicion.x + 7, posicion.y);
            } else {
              contexto.fillStyle = modoDashboardOscuro ? '#EAF3FF' : '#334155';
              contexto.fillText(String(valor), posicion.x, posicion.y - 9);
            }
          });
        });
        contexto.restore();
      }
    });

    const esDona = tipo === 'doughnut';
    if (tipo === 'line') {
      data.datasets.forEach(dataset => {
        if (!dataset.areaGradient) return;
        const [colorSuperior, colorInferior] = dataset.areaGradient;
        dataset.backgroundColor = contexto => {
          const area = contexto.chart.chartArea;
          if (!area) return colorSuperior;
          const degradado = contexto.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
          degradado.addColorStop(0, colorSuperior);
          degradado.addColorStop(1, colorInferior);
          return degradado;
        };
        dataset.fill = true;
      });
    }
    if (esDona) {
      data.datasets.forEach(dataset => {
        dataset.borderColor = '#FFFFFF';
        dataset.borderWidth = 3;
        dataset.hoverOffset = 0;
        dataset.spacing = 1;
      });
    }
    const tituloValor = canvasId.includes('cumplimiento') ? 'Horas' :
      (canvasId.includes('puntualidad') || canvasId.includes('tendencia') || canvasId.includes('ausentismo')) ? 'Porcentaje (%)' : 'Cantidad';
    const horizontal = opciones.indexAxis === 'y';
    const escalasProfesionales = esDona ? undefined : {};
    if (!esDona) {
      ['x', 'y'].forEach(eje => {
        const original = (opciones.scales && opciones.scales[eje]) || {};
        const esEjeValor = horizontal ? eje === 'x' : eje === 'y';
        escalasProfesionales[eje] = {
          ...original,
          border: { color: modoDashboardOscuro ? 'rgba(144,180,216,.34)' : '#94A3B8', ...(original.border || {}) },
          grid: { color: modoDashboardOscuro ? (esEjeValor ? 'rgba(116,161,207,.18)' : 'rgba(116,161,207,.08)') : (esEjeValor ? 'rgba(148,163,184,.22)' : 'rgba(148,163,184,.10)'), drawTicks: true, ...(original.grid || {}) },
          ticks: { color: modoDashboardOscuro ? '#B9CAE0' : '#64748B', font: { size: 9 }, padding: 7, ...(original.ticks || {}) },
          title: esEjeValor ? { display: true, text: tituloValor, color: modoDashboardOscuro ? '#9FB6CF' : '#475569', font: { size: 9, weight: '600' }, ...(original.title || {}) } : original.title
        };
      });
    }
    const opcionesFinales = {
      responsive: !esDona,
      maintainAspectRatio: false,
      animation: modoDashboardOscuro ? { duration: 280, easing: 'easeOutQuart' } : false,
      resizeDelay: 120,
      ...opciones,
      ...(esDona ? { responsive:false, maintainAspectRatio:true, aspectRatio:1, radius:'84%', hover:{ mode:null } } : { scales: escalasProfesionales }),
      plugins: {
        ...(opciones.plugins || {}),
        legend: {
          position: 'bottom',
          ...(opciones.plugins?.legend || {}),
          labels: { usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 8, boxHeight: 8, padding: 12, color: modoDashboardOscuro ? '#C9D8E9' : '#475569', font: { size: 9 }, ...(opciones.plugins?.legend?.labels || {}) }
        },
        tooltip: {
          backgroundColor: modoDashboardOscuro ? 'rgba(2,15,32,.96)' : 'rgba(17,24,39,.94)',
          borderColor: modoDashboardOscuro ? 'rgba(68,148,230,.55)' : 'transparent',
          borderWidth: 1,
          titleColor: '#FFFFFF', bodyColor: '#DDEBFA', padding: 10, cornerRadius: 7,
          ...(opciones.plugins?.tooltip || {})
        }
      }
    };

    if (esDona) {
      const lado = 168;
      ctx.style.width = `${lado}px`;
      ctx.style.height = `${lado}px`;
      ctx.width = lado;
      ctx.height = lado;
    }
    this.charts[canvasId] = new Chart(ctx, {
      type: tipo,
      data,
      options: opcionesFinales,
      plugins
    });
  }
};


/**
 * app.js
 * -----------------------------------------------------------------------
 * Controlador principal: navegación entre pestañas sin recarga,
 * pestaña Historial, pestaña Ajustes, e inicialización general.
 * -----------------------------------------------------------------------
 */



const App = {

  pestanaActual: 'asistencia',
  _ultimoHistorialFiltrado: [],
  _ultimoHistorialGrupos: [],
  historialSeleccionActiva: false,
  historialSeleccionados: new Set(),
  _inicializada: false,

  async init() {
    if (this._inicializada) return;
    this._inicializada = true;
    Theme.init();
    Idioma.init();
    UI.cerrarTodosLosModales(); // salvaguarda: ningún modal debe iniciar visible
    await DB.init();
    await DB.eliminarSimulacion(false);

    this.configurarNavegacion();
    this.configurarMenu();
    this.configurarFormularios();
    this.configurarModales();
    this.configurarAjustes();
    await Programacion.init();
    Dashboard.init();

    Attendance.iniciarReloj();
    await Attendance.renderizarTurnos();
    await this.renderizarPerfilSupervisor();

    await this.renderizarContadorGlobal();
    const tabInicial = new URLSearchParams(location.search).get('tab');
    const tabPermitida = ['asistencia','historial','programacion','trabajadores','reportes','ajustes','perfil'].includes(tabInicial) ? tabInicial : 'asistencia';
    await this.cambiarPestana(tabPermitida);
  },

  async renderizarContadorGlobal() {
    const trabajadores = await DB.obtenerTrabajadores();
    document.querySelectorAll('.contador-global').forEach(el => {
      el.textContent = `${trabajadores.length} Trabajadores`;
    });
  },

  /* ---------- Navegación entre pestañas ---------- */

  configurarNavegacion() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => this.cambiarPestana(item.dataset.tab));
    });
  },

  async cambiarPestana(nombre) {
    if (Auth.usuarioActual && !Auth.puedeVer(nombre)) {
      UI.toast('No tienes permiso para visualizar esta pestaña', 'alerta');
      return;
    }
    UI.cerrarTodosLosModales();
    if (this.pestanaActual === 'asistencia' && nombre !== 'asistencia' && typeof Scanner !== 'undefined') {
      Scanner.cerrar();
      if (typeof Attendance !== 'undefined' && Attendance._timeoutRegreso) {
        clearTimeout(Attendance._timeoutRegreso);
        Attendance._timeoutRegreso = null;
      }
    }

    this.pestanaActual = nombre;

    document.querySelectorAll('.vista').forEach(v => v.classList.remove('activa'));
    document.getElementById(`vista-${nombre}`).classList.add('activa');

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('activo', item.dataset.tab === nombre);
    });
    document.querySelectorAll('.menu-lateral-item').forEach(item => {
      item.classList.toggle('activo', item.dataset.tab === nombre);
    });

    this.cerrarMenu();

    if (nombre === 'historial') {
      await this.renderizarHistorial();
    } else if (nombre === 'trabajadores') {
      await Workers.renderizarListado();
    } else if (nombre === 'programacion') {
      await Programacion.cargarFecha();
    } else if (nombre === 'reportes') {
      await Dashboard.actualizar();
    } else if (nombre === 'reporte-detallado') {
      await Reports.renderizarReporteDetallado();
    } else if (nombre === 'asistencia') {
      await Attendance.renderizarRegistrosHoy();
    } else if (nombre === 'perfil') {
      await this.renderizarPerfilSupervisor();
    }
  },

  /* ---------- Menú hamburguesa ---------- */

  configurarMenu() {
    document.querySelectorAll('.btn-menu').forEach(btn => {
      btn.addEventListener('click', () => this.toggleMenu());
    });
    document.getElementById('menu-overlay').addEventListener('click', () => this.cerrarMenu());
    document.querySelectorAll('.menu-lateral-item').forEach(item => {
      item.addEventListener('click', () => {
        if (item.dataset.tab) this.cambiarPestana(item.dataset.tab);
      });
    });
    const cerrarSesionMenu = document.getElementById('btn-cerrar-sesion-menu');
    cerrarSesionMenu.addEventListener('click', () => this.cerrarSesion());
    cerrarSesionMenu.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.cerrarSesion(); } });
  },

  toggleMenu() {
    document.getElementById('menu-lateral').classList.toggle('visible');
    document.getElementById('menu-overlay').classList.toggle('visible');
  },

  cerrarMenu() {
    document.getElementById('menu-lateral').classList.remove('visible');
    document.getElementById('menu-overlay').classList.remove('visible');
  },

  /* ---------- Historial ---------- */

  async renderizarHistorial() {
    await this.filtrarHistorial();
  },

  async filtrarHistorial() {
    const fechaInicio = document.getElementById('filtro-fecha-inicio').value || null;
    const fechaFin = document.getElementById('filtro-fecha-fin').value || null;

    const registros = await DB.obtenerHistorial({ fechaInicio, fechaFin });
    const cierres = await DB.obtenerCierres({ fechaInicio, fechaFin });
    const contenedor = document.getElementById('lista-historial');
    this._ultimoHistorialFiltrado = registros;

    if (registros.length === 0 && cierres.length === 0) {
      contenedor.innerHTML = `<div class="estado-vacio">No hay registros para este filtro</div>`;
      return;
    }

    const turnos = await DB.obtenerTurnos();
    const turnoPorId = {};
    turnos.forEach(t => { turnoPorId[t.id] = t; });

    // Agrupar registros por FECHA + TURNO
    const grupos = {};
    registros.forEach(r => {
      const key = `${r.fecha}|${r.turnoId}`;
      if (!grupos[key]) {
        grupos[key] = { fecha: r.fecha, turnoId: r.turnoId, turnoNombre: r.turnoNombre, registros: [], dnis: new Set() };
      }
      grupos[key].registros.push(r);
      grupos[key].dnis.add(r.dni);
    });

    // Adjuntar cierres de turno (y crear tarjeta aunque no haya registros, salvo si se filtra por un trabajador puntual)
    cierres.forEach(c => {
      const key = `${c.fecha}|${c.turnoId}`;
      if (!grupos[key]) {
        grupos[key] = { fecha: c.fecha, turnoId: c.turnoId, turnoNombre: c.turnoNombre, registros: [], dnis: new Set() };
      }
      if (grupos[key]) grupos[key].cierre = c;
    });

    if (Object.keys(grupos).length === 0) {
      contenedor.innerHTML = `<div class="estado-vacio">No hay registros para este filtro</div>`;
      return;
    }

    const listaGrupos = Object.values(grupos).sort((a, b) => {
      if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
      return a.turnoId.localeCompare(b.turnoId);
    });
    this._ultimoHistorialGrupos = listaGrupos;

    // Segundo nivel de agrupación: una tarjeta principal por fecha.
    const fechas = {};
    listaGrupos.forEach((g, i) => {
      if (!fechas[g.fecha]) fechas[g.fecha] = { fecha: g.fecha, turnos: [] };
      fechas[g.fecha].turnos.push({ ...g, indiceGrupo: i });
    });

    const renderizarTurno = (g) => {
      const turno = turnoPorId[g.turnoId];
      const horario = turno ? `${turno.inicio} - ${turno.fin}` : '';
      const clave = `${g.fecha}|${g.turnoId}`;
      const tardanzasRegistros = g.registros.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
      const tardanzas = g.cierre ? Number(g.cierre.tardanzas || tardanzasRegistros) : tardanzasRegistros;
      const ausentes = g.cierre ? Number(g.cierre.ausentes || 0) : g.registros.filter(r => r.estado === 'AUSENTE').length;
      const sinSalida = g.registros.filter(r => !r.horaSalida && r.estado !== 'AUSENTE').length;
      const salidasAnticipadas = g.registros.filter(r => r.estadoSalida === 'SALIDA ANTICIPADA').length;
      const salidasTarde = g.registros.filter(r => r.estadoSalida === 'SALIDA DESPUÉS DE HORA').length;
      const sinAlertas = tardanzas === 0 && ausentes === 0 && sinSalida === 0 && salidasAnticipadas === 0 && salidasTarde === 0;

      return `
        <div class="tarjeta-grupo-historial" data-grupo="${g.indiceGrupo}" data-clave="${clave}">
          <div class="grupo-historial-fila">
            ${this.historialSeleccionActiva ? `<input type="checkbox" class="check-grupo-historial" data-clave="${clave}" ${this.historialSeleccionados.has(clave) ? 'checked' : ''}>` : ''}
            <div class="grupo-historial-icono">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="grupo-historial-info">
              <div class="grupo-historial-turno">${g.turnoNombre}<span class="grupo-historial-horario"> · ${horario}</span></div>
              ${g.cierre ? `<div class="grupo-historial-cierre">✅ Cerrado ${g.cierre.horaCierre} · ${g.cierre.presentes}/${g.cierre.programado} presentes · ${g.cierre.ausentes} ausentes<br>Supervisor: ${UI.escaparHtml(_nombreSupervisor(g.cierre.supervisorCierre))}</div>` : ''}
            </div>
            <div class="grupo-historial-cantidad">
              <div class="grupo-historial-cantidad-num">${g.cierre ? g.cierre.programado : g.dnis.size}</div>
              <div class="grupo-historial-cantidad-label">personal</div>
            </div>
            <span class="grupo-historial-flecha">›</span>
          </div>
          <div class="grupo-historial-detalle oculto" id="detalle-grupo-${g.indiceGrupo}">
            <div class="historial-alertas">
              ${sinAlertas ? '<span class="historial-alerta historial-alerta-verde">✓ Sin alertas</span>' : ''}
              ${tardanzas ? `<span class="historial-alerta historial-alerta-naranja">⚠ ${tardanzas} tardanza${tardanzas === 1 ? '' : 's'}</span>` : ''}
              ${ausentes ? `<span class="historial-alerta historial-alerta-roja">✕ ${ausentes} ausente${ausentes === 1 ? '' : 's'}</span>` : ''}
              ${sinSalida ? `<span class="historial-alerta historial-alerta-naranja">⏱ ${sinSalida} sin salida</span>` : ''}
              ${salidasAnticipadas ? `<span class="historial-alerta historial-alerta-roja">↙ ${salidasAnticipadas} salida${salidasAnticipadas === 1 ? '' : 's'} anticipada${salidasAnticipadas === 1 ? '' : 's'}</span>` : ''}
              ${salidasTarde ? `<span class="historial-alerta historial-alerta-naranja">↗ ${salidasTarde} salida${salidasTarde === 1 ? '' : 's'} después de hora</span>` : ''}
            </div>
            <div class="historial-trabajadores-titulo">Trabajadores</div>
            ${g.registros.length === 0
              ? '<p class="sub" style="padding:12px 0;">Sin trabajadores registrados en este turno.</p>'
              : g.registros.map(r => `
              <div class="tarjeta-historial">
                <div class="avatar-mini">${UI.iniciales(r.nombreCompleto.split(' ')[0], r.nombreCompleto.split(' ')[1] || '')}</div>
                <div class="tarjeta-historial-info">
                  <div class="tarjeta-historial-nombre">${UI.escaparHtml(r.nombreCompleto)}</div>
                  <div class="tarjeta-historial-meta">DNI: ${UI.escaparHtml(r.dni)}</div>
                  <div class="registro-movimientos">
                    <div class="registro-movimiento entrada ${(r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA') ? 'tardia' : ''}">
                      <div class="registro-movimiento-titulo">↘ Entrada</div>
                      <div class="registro-movimiento-hora">${r.horaEntrada.slice(0, 5)}</div>
                      <div class="registro-movimiento-estado">${r.estadoEntrada || (r.estado === 'TARDANZA' ? 'TARDANZA' : 'PUNTUAL')}</div>
                    </div>
                    <div class="registro-movimiento salida ${!r.horaSalida ? 'pendiente' : (r.estadoSalida === 'SALIDA ANTICIPADA' ? 'anticipada' : '')}">
                      <div class="registro-movimiento-titulo">↗ Salida</div>
                      <div class="registro-movimiento-hora">${r.horaSalida ? r.horaSalida.slice(0, 5) : '--:--'}</div>
                      <div class="registro-movimiento-estado">${r.estadoSalida || 'PENDIENTE'}</div>
                    </div>
                  </div>
                  ${r.horasTrabajadas ? `<div class="tarjeta-historial-horas">Total trabajado: <strong>${r.horasTrabajadas}</strong></div>` : ''}
                  <div class="tarjeta-historial-meta" style="margin-top:5px;">Entrada registrada por: ${UI.escaparHtml(_nombreSupervisor(r.supervisorEntrada))}${r.horaSalida ? ` · Salida por: ${UI.escaparHtml(_nombreSupervisor(r.supervisorSalida))}` : ''}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
                  <span class="badge badge-${r.metodo === 'QR' ? 'azul' : 'naranja'}">${r.metodo === 'QR' ? '📷 QR' : '🔎 DNI'}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    contenedor.innerHTML = Object.values(fechas)
      .sort((a, b) => a.fecha < b.fecha ? 1 : -1)
      .map((grupoFecha, indiceFecha) => {
        const fechaObj = new Date(grupoFecha.fecha + 'T00:00:00');
        const nombreDia = fechaObj.toLocaleDateString('es-PE', { weekday: 'long' });
        const mes = fechaObj.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '');
        const totalTrabajadores = new Set(grupoFecha.turnos.flatMap(g =>
          g.cierre && g.cierre.personalProgramado ? g.cierre.personalProgramado.map(p => p.dni) : Array.from(g.dnis)
        )).size;
        const totalAlertas = grupoFecha.turnos.reduce((total, g) => {
          const tardanzas = g.cierre ? Number(g.cierre.tardanzas || 0) : g.registros.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
          const ausentes = g.cierre ? Number(g.cierre.ausentes || 0) : g.registros.filter(r => r.estado === 'AUSENTE').length;
          const sinSalida = g.registros.filter(r => !r.horaSalida && r.estado !== 'AUSENTE').length;
          const salidasIrregulares = g.registros.filter(r => r.estadoSalida === 'SALIDA ANTICIPADA' || r.estadoSalida === 'SALIDA DESPUÉS DE HORA').length;
          return total + tardanzas + ausentes + sinSalida + salidasIrregulares;
        }, 0);
        const clavesFecha = grupoFecha.turnos.map(g => `${g.fecha}|${g.turnoId}`);
        const fechaSeleccionada = clavesFecha.length > 0 && clavesFecha.every(clave => this.historialSeleccionados.has(clave));
        return `
          <div class="tarjeta-fecha-historial" data-fecha="${indiceFecha}">
            <div class="fecha-historial-fila">
              ${this.historialSeleccionActiva ? `<input type="checkbox" class="check-fecha-historial" data-fecha-iso="${grupoFecha.fecha}" ${fechaSeleccionada ? 'checked' : ''} aria-label="Seleccionar todos los turnos de ${UI.formatearFecha(grupoFecha.fecha)}">` : ''}
              <div class="fecha-historial-calendario">
                <span class="fecha-historial-dia-num">${String(fechaObj.getDate()).padStart(2, '0')}</span>
                <span class="fecha-historial-mes">${mes}</span>
              </div>
              <div class="fecha-historial-info">
                <div class="fecha-historial-titulo">${nombreDia} · ${UI.formatearFecha(grupoFecha.fecha)}</div>
                <div class="fecha-historial-resumen">${grupoFecha.turnos.length} turno${grupoFecha.turnos.length === 1 ? '' : 's'} · ${totalTrabajadores} trabajadores · ${totalAlertas} alertas</div>
              </div>
              <span class="fecha-historial-flecha">›</span>
            </div>
            <div class="fecha-historial-detalle oculto">${grupoFecha.turnos.map(renderizarTurno).join('')}</div>
          </div>`;
      }).join('');

    contenedor.querySelectorAll('.fecha-historial-fila').forEach(fila => {
      fila.addEventListener('click', (evento) => {
        if (evento.target.closest('.check-fecha-historial')) return;
        const tarjeta = fila.closest('.tarjeta-fecha-historial');
        const detalle = tarjeta.querySelector(':scope > .fecha-historial-detalle');
        const abrir = detalle.classList.contains('oculto');
        detalle.classList.toggle('oculto', !abrir);
        tarjeta.classList.toggle('expandido', abrir);
      });
    });

    contenedor.querySelectorAll('.check-fecha-historial').forEach(check => {
      check.addEventListener('click', evento => evento.stopPropagation());
      check.addEventListener('change', () => this.toggleSeleccionFechaHistorial(check.dataset.fechaIso, check.checked));
      const gruposFecha = listaGrupos.filter(g => g.fecha === check.dataset.fechaIso);
      const seleccionados = gruposFecha.filter(g => this.historialSeleccionados.has(`${g.fecha}|${g.turnoId}`)).length;
      check.indeterminate = seleccionados > 0 && seleccionados < gruposFecha.length;
    });

    contenedor.querySelectorAll('.grupo-historial-fila').forEach(fila => {
      fila.addEventListener('click', (e) => {
        if (e.target.closest('.check-grupo-historial')) return;
        const grupo = fila.closest('.tarjeta-grupo-historial');
        const detalle = document.getElementById(`detalle-grupo-${grupo.dataset.grupo}`);
        const estabaAbierto = !detalle.classList.contains('oculto');
        detalle.classList.toggle('oculto');
        grupo.classList.toggle('expandido', !estabaAbierto);
      });
    });

    contenedor.querySelectorAll('.check-grupo-historial').forEach(chk => {
      chk.addEventListener('click', (e) => e.stopPropagation());
      chk.addEventListener('change', () => this.toggleSeleccionGrupoHistorial(chk.dataset.clave));
    });

    this._actualizarBarraSeleccionHistorial();
  },

  /* ---------- Selección de tarjetas de Historial para exportar ---------- */

  toggleModoSeleccionHistorial() {
    this.historialSeleccionActiva = !this.historialSeleccionActiva;
    if (!this.historialSeleccionActiva) this.historialSeleccionados.clear();

    const boton = document.getElementById('btn-modo-seleccion-historial');
    boton.textContent = this.historialSeleccionActiva ? 'Cancelar selección' : '☑️ Seleccionar fechas y turnos';
    document.getElementById('label-seleccionar-todos-historial').classList.toggle('oculto', !this.historialSeleccionActiva);

    this.filtrarHistorial();
  },

  toggleSeleccionGrupoHistorial(clave) {
    if (this.historialSeleccionados.has(clave)) {
      this.historialSeleccionados.delete(clave);
    } else {
      this.historialSeleccionados.add(clave);
    }
    this._actualizarBarraSeleccionHistorial();
  },

  toggleSeleccionFechaHistorial(fecha, marcar) {
    (this._ultimoHistorialGrupos || [])
      .filter(g => g.fecha === fecha)
      .forEach(g => {
        const clave = `${g.fecha}|${g.turnoId}`;
        if (marcar) this.historialSeleccionados.add(clave);
        else this.historialSeleccionados.delete(clave);
      });
    this.filtrarHistorial();
  },

  toggleSeleccionarTodosHistorial(marcar) {
    (this._ultimoHistorialGrupos || []).forEach(g => {
      const clave = `${g.fecha}|${g.turnoId}`;
      if (marcar) this.historialSeleccionados.add(clave);
      else this.historialSeleccionados.delete(clave);
    });
    this.filtrarHistorial();
  },

  _actualizarBarraSeleccionHistorial() {
    const texto = document.getElementById('texto-seleccion-historial');
    if (!texto) return;
    const cantidad = this.historialSeleccionados.size;
    texto.textContent = this.historialSeleccionActiva
      ? (cantidad > 0 ? `${cantidad} tarjeta${cantidad === 1 ? '' : 's'} seleccionada${cantidad === 1 ? '' : 's'}` : 'Seleccionar visibles')
      : 'Seleccionar visibles';

    const checkTodos = document.getElementById('check-seleccionar-todos-historial');
    const grupos = this._ultimoHistorialGrupos || [];
    const todosSeleccionados = grupos.length > 0 && grupos.every(g => this.historialSeleccionados.has(`${g.fecha}|${g.turnoId}`));
    if (checkTodos) checkTodos.checked = todosSeleccionados;

    document.querySelectorAll('.check-fecha-historial').forEach(checkFecha => {
      const gruposFecha = grupos.filter(g => g.fecha === checkFecha.dataset.fechaIso);
      const cantidadSeleccionada = gruposFecha.filter(g => this.historialSeleccionados.has(`${g.fecha}|${g.turnoId}`)).length;
      checkFecha.checked = gruposFecha.length > 0 && cantidadSeleccionada === gruposFecha.length;
      checkFecha.indeterminate = cantidadSeleccionada > 0 && cantidadSeleccionada < gruposFecha.length;
    });
  },

  /* ---------- Formularios y modales ---------- */

  configurarFormularios() {
    document.getElementById('form-buscar-dni').addEventListener('submit', (e) => {
      e.preventDefault();
      Workers.buscarPorDni();
    });

    document.getElementById('input-dni-buscar').addEventListener('input', (e) => {
      Workers.mostrarSugerenciasDni(e.target.value);
    });
    document.getElementById('input-dni-buscar').addEventListener('keydown', (e) => Workers.navegarSugerenciasDni(e));
    document.getElementById('input-dni-buscar').addEventListener('focus', (e) => {
      if (e.target.value) Workers.mostrarSugerenciasDni(e.target.value);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#panel-busqueda')) Workers.ocultarSugerenciasDni();
      if (!e.target.closest('.registro-acciones')) {
        document.querySelectorAll('.registro-menu').forEach(menu => menu.classList.add('oculto'));
        document.querySelectorAll('[data-registro-menu]').forEach(boton => boton.setAttribute('aria-expanded', 'false'));
      }
    });

    document.getElementById('form-nuevo-trabajador').addEventListener('submit', (e) => Workers.guardarNuevoTrabajador(e));
    document.getElementById('btn-guardar-nuevo-trabajador').addEventListener('click', (e) => {
      e.preventDefault();
      Workers.guardarNuevoTrabajador({ preventDefault: () => {}, target: document.getElementById('form-nuevo-trabajador') });
    });
    document.getElementById('form-editar-perfil').addEventListener('submit', (e) => Workers.guardarPerfil(e));

    document.getElementById('btn-finalizar-turno').addEventListener('click', () => Attendance.finalizarRegistroTurno());

    document.getElementById('btn-metodo-qr').addEventListener('click', () => Workers.cambiarMetodo('QR'));
    document.getElementById('btn-metodo-dni').addEventListener('click', () => Workers.cambiarMetodo('DNI'));
    document.getElementById('btn-cancelar-scanner').addEventListener('click', () => Workers.cambiarMetodo('DNI'));
    document.getElementById('btn-seleccionar-imagen-qr').addEventListener('click', () => document.getElementById('input-imagen-qr').click());
    document.getElementById('input-imagen-qr').addEventListener('change', (e) => Scanner.cargarImagen(e.target.files && e.target.files[0]));

    document.getElementById('btn-generar-carnets').addEventListener('click', () => Workers.generarCarnets());
    document.getElementById('btn-descargar-qr').addEventListener('click', () => QRManager.descargarQrActual());
    document.getElementById('btn-generar-qr-perfil').addEventListener('click', () => {
      if (Workers.perfilActualId) QRManager.abrirModalQr(Workers.perfilActualId);
    });

    document.getElementById('btn-ir-registro-nuevo').addEventListener('click', () => Workers.abrirRegistroNuevo());
    document.getElementById('btn-registrar-nuevo-directo').addEventListener('click', () => Workers.abrirRegistroDirecto());
    document.getElementById('btn-cancelar-registro').addEventListener('click', () => Workers.cancelarRegistroNuevo());
    document.getElementById('btn-volver-buscar').addEventListener('click', () => Workers.volverABuscar());

    document.getElementById('input-buscar-listado').addEventListener('input', (e) => Workers.buscarEnListado(e.target.value));
    document.querySelectorAll('.chip-filtro').forEach(chip => {
      chip.addEventListener('click', () => Workers.filtrarPorEstado(chip.dataset.estado));
    });

    document.getElementById('check-seleccionar-todos').addEventListener('change', (e) => Workers.toggleSeleccionarTodosVisibles(e.target.checked));
    document.getElementById('btn-limpiar-seleccion').addEventListener('click', () => Workers.limpiarSeleccion());

    ['filtro-fecha-inicio', 'filtro-fecha-fin']
      .forEach(id => document.getElementById(id).addEventListener('change', () => this.filtrarHistorial()));

    document.getElementById('btn-exportar-historial-excel').addEventListener('click', () => {
      if (this.historialSeleccionActiva && this.historialSeleccionados.size > 0) {
        const gruposSeleccionados = (this._ultimoHistorialGrupos || [])
          .filter(g => this.historialSeleccionados.has(`${g.fecha}|${g.turnoId}`));
        const registros = gruposSeleccionados.flatMap(g => g.registros);
        Reports.exportarExcel(registros, 'historial-seleccionado');
      } else {
        Reports.exportarExcel(this._ultimoHistorialFiltrado, 'historial-filtrado');
      }
    });

    document.getElementById('btn-exportar-historial-pdf').addEventListener('click', () => {
      if (this.historialSeleccionActiva && this.historialSeleccionados.size > 0) {
        const gruposSeleccionados = (this._ultimoHistorialGrupos || [])
          .filter(g => this.historialSeleccionados.has(`${g.fecha}|${g.turnoId}`));
        const registros = gruposSeleccionados.flatMap(g => g.registros);
        Reports.exportarPDF(registros, 'historial-seleccionado');
      } else {
        Reports.exportarPDF(this._ultimoHistorialFiltrado, 'historial-filtrado');
      }
    });
    document.getElementById('btn-compartir-whatsapp').addEventListener('click', () => this.compartirCierreWhatsApp());
    document.getElementById('btn-enviar-outlook').addEventListener('click', () => this.enviarCierreOutlook());

    document.getElementById('btn-modo-seleccion-historial').addEventListener('click', () => this.toggleModoSeleccionHistorial());
    document.getElementById('check-seleccionar-todos-historial').addEventListener('change', (e) => this.toggleSeleccionarTodosHistorial(e.target.checked));

    document.getElementById('btn-volver-reportes').addEventListener('click', () => this.cambiarPestana('reportes'));

    ['filtro-fecha-inicio-reporte', 'filtro-fecha-fin-reporte', 'filtro-turno-reporte']
      .forEach(id => document.getElementById(id).addEventListener('change', () => Reports.renderizarReporteDetallado()));

    document.getElementById('btn-exportar-excel').addEventListener('click', () => Reports.exportarExcel(Dashboard.registrosDia || [], 'reporte-dia'));
    document.getElementById('btn-imprimir').addEventListener('click', () => Reports.imprimir());
    document.getElementById('btn-exportar-excel-detallado').addEventListener('click', () => Reports.exportarExcel(Reports._ultimoReporte || [], 'reporte-detallado'));

    document.getElementById('btn-cerrar-sesion').addEventListener('click', () => this.cerrarSesion());
    document.getElementById('form-perfil-supervisor').addEventListener('submit', (e) => this.guardarPerfilSupervisor(e));

    document.getElementById('fab-nuevo-trabajador').addEventListener('click', () => {
      Workers.abrirRegistroDirecto();
    });
  },

  async renderizarPerfilSupervisor() {
    const perfil = await DB.obtenerPerfilSupervisor();
    const form = document.getElementById('form-perfil-supervisor');
    if (!form) return;
    form.nombres.value = perfil ? perfil.nombres : '';
    form.apellidos.value = perfil ? perfil.apellidos : '';
    form.dni.value = perfil ? perfil.dni : '';
    form.cargo.value = perfil ? perfil.cargo : 'Supervisor';
    form.area.value = perfil ? perfil.area : '';
    document.getElementById('perfil-supervisor-avatar').textContent = perfil ? UI.iniciales(perfil.nombres, perfil.apellidos) : 'SP';
    document.getElementById('perfil-supervisor-resumen').textContent = perfil ? _nombreSupervisor(perfil) : 'Supervisor no configurado';
  },

  async guardarPerfilSupervisor(evento) {
    evento.preventDefault();
    const form = evento.target;
    const perfil = await DB.guardarPerfilSupervisor({
      nombres: form.nombres.value,
      apellidos: form.apellidos.value,
      dni: form.dni.value,
      cargo: form.cargo.value,
      area: form.area.value
    });
    await this.renderizarPerfilSupervisor();
    UI.toast(`Perfil guardado: ${_nombreSupervisor(perfil)}`, 'exito');
  },

  _fechaCierreParaCompartir() {
    return document.getElementById('filtro-fecha-fin').value || document.getElementById('filtro-fecha-inicio').value || _hoyISO();
  },

  async _resumenCierreDia(fecha) {
    const [turnos, registros, cierres] = await Promise.all([
      DB.obtenerTurnos(),
      DB.obtenerHistorial({ fechaInicio:fecha, fechaFin:fecha }),
      DB.obtenerCierres({ fechaInicio:fecha, fechaFin:fecha })
    ]);
    const lineas = turnos.map(turno => {
      const registrosTurno = registros.filter(r => r.turnoId === turno.id);
      const presentes = new Set(registrosTurno.map(r => r.dni)).size;
      const cierre = cierres.find(c => c.turnoId === turno.id);
      const programados = cierre ? Number(cierre.programado || 0) : 0;
      const ausentes = cierre ? Number(cierre.ausentes || 0) : Math.max(programados - presentes, 0);
      const tardanzas = registrosTurno.filter(r => r.estadoEntrada === 'TARDANZA' || r.estado === 'TARDANZA').length;
      return `${turno.nombre} (${turno.inicio}-${turno.fin}): ${presentes}/${programados} presentes, ${ausentes} ausentes, ${tardanzas} tardanzas`;
    });
    return { turnos, registros, cierres, texto:`CIERRE DE ASISTENCIA - ${UI.formatearFecha(fecha)}\n\n${lineas.join('\n')}` };
  },

  async compartirCierreWhatsApp() {
    const fecha = this._fechaCierreParaCompartir();
    const resumen = await this._resumenCierreDia(fecha);
    if (!resumen.registros.length && !resumen.cierres.length) {
      UI.toast('No hay información de cierre para la fecha seleccionada', 'alerta');
      return;
    }
    const guardado = localStorage.getItem('asistencia_whatsapp_destino') || '';
    const telefono = prompt('Número de WhatsApp con código de país (ej. 51999999999):', guardado);
    if (telefono === null) return;
    const limpio = telefono.replace(/\D/g, '');
    if (!limpio) { UI.toast('Ingresa un número de WhatsApp válido', 'alerta'); return; }
    localStorage.setItem('asistencia_whatsapp_destino', limpio);
    window.open(`https://wa.me/${limpio}?text=${encodeURIComponent(resumen.texto)}`, '_blank', 'noopener');
  },

  async enviarCierreOutlook() {
    window.open('https://outlook.office.com/mail/', '_blank', 'noopener');
  },

  configurarModales() {
    document.getElementById('btn-cerrar-tema').addEventListener('click', () => this.cerrarModalTema());
    document.getElementById('modal-tema-overlay').addEventListener('click', () => this.cerrarModalTema());
    document.getElementById('btn-cerrar-nuevo').addEventListener('click', () => Workers.cerrarModalNuevo());
    document.getElementById('modal-nuevo-overlay').addEventListener('click', () => Workers.cerrarModalNuevo());

    document.getElementById('btn-cerrar-perfil').addEventListener('click', () => Workers.cerrarPerfil());
    document.getElementById('modal-perfil-overlay').addEventListener('click', () => Workers.cerrarPerfil());

    document.getElementById('btn-cerrar-editar-registro').addEventListener('click', () => Attendance.cerrarEditarRegistro());
    document.getElementById('modal-editar-registro-overlay').addEventListener('click', () => Attendance.cerrarEditarRegistro());
    document.getElementById('form-editar-registro').addEventListener('submit', (e) => Attendance.guardarEdicionRegistro(e));

    document.getElementById('btn-cerrar-turnos').addEventListener('click', () => this.cerrarModalTurnos());
    document.getElementById('modal-turnos-overlay').addEventListener('click', () => this.cerrarModalTurnos());
    document.getElementById('form-turnos').addEventListener('submit', (e) => this.guardarTurnos(e));

    document.getElementById('btn-cerrar-qr').addEventListener('click', () => QRManager.cerrarModalQr());
    document.getElementById('modal-qr-overlay').addEventListener('click', () => QRManager.cerrarModalQr());
    document.querySelectorAll('[data-cerrar-modal]').forEach(btn => btn.addEventListener('click', () => AjustesAvanzados.cerrar(btn.dataset.cerrarModal)));
    ['idioma','borrar','info'].forEach(nombre => document.getElementById(`modal-${nombre}-overlay`).addEventListener('click', () => AjustesAvanzados.cerrar(nombre)));
    document.querySelectorAll('input[name="idioma-app"]').forEach(radio => radio.addEventListener('change', () => { Idioma.aplicar(radio.value); UI.toast('Idioma actualizado','exito'); }));
    document.getElementById('borrar-tipo').addEventListener('change', () => AjustesAvanzados.actualizarRango());
    document.getElementById('form-borrar-informacion').addEventListener('submit', e => AjustesAvanzados.borrar(e));
  },

  /* ---------- Ajustes ---------- */

  configurarAjustes() {
    document.getElementById('item-tema').addEventListener('click', () => this.abrirModalTema());
    document.getElementById('item-idioma').addEventListener('click', () => AjustesAvanzados.abrir('idioma'));
    document.getElementById('item-horarios').addEventListener('click', () => this.abrirModalTurnos());
    document.getElementById('item-borrar-informacion').addEventListener('click', () => AjustesAvanzados.abrirBorrado());
    document.getElementById('item-info').addEventListener('click', () => AjustesAvanzados.abrir('info'));
  },

  abrirModalTema() {
    UI.cerrarTodosLosModales();
    Theme.renderizarSelector();
    document.getElementById('modal-tema').classList.add('visible');
    document.getElementById('modal-tema-overlay').classList.add('visible');
  },

  cerrarModalTema() {
    document.getElementById('modal-tema').classList.remove('visible');
    document.getElementById('modal-tema-overlay').classList.remove('visible');
  },

  async abrirModalTurnos() {
    UI.cerrarTodosLosModales();
    const turnos = await DB.obtenerTurnos();
    const contenedor = document.getElementById('filas-turnos');
    contenedor.innerHTML = turnos.map(t => `
      <div class="campo">
        <label>${t.nombre}</label>
        <div class="form-grid">
          <input type="time" name="inicio-${t.id}" value="${t.inicio}" required>
          <input type="time" name="fin-${t.id}" value="${t.fin}" required>
        </div>
      </div>
    `).join('');
    document.getElementById('modal-turnos').classList.add('visible');
    document.getElementById('modal-turnos-overlay').classList.add('visible');
  },

  cerrarModalTurnos() {
    document.getElementById('modal-turnos').classList.remove('visible');
    document.getElementById('modal-turnos-overlay').classList.remove('visible');
  },

  async guardarTurnos(evento) {
    evento.preventDefault();
    const form = evento.target;
    const turnos = await DB.obtenerTurnos();
    const actualizados = turnos.map(t => ({
      ...t,
      inicio: form[`inicio-${t.id}`].value,
      fin: form[`fin-${t.id}`].value
    }));
    await DB.guardarTurnos(actualizados);
    await Attendance.renderizarTurnos();
    UI.toast('Turnos actualizados correctamente', 'exito');
    this.cerrarModalTurnos();
  },

  cerrarSesion() {
    Auth.cerrarSesion();
  },

  async descargarRespaldo() {
    const trabajadores = await DB.obtenerTrabajadores();
    const asistencias = await DB.obtenerAsistencias();
    const turnos = await DB.obtenerTurnos();
    const cierres = await DB.obtenerCierres();
    const programaciones = await DB.obtenerProgramaciones();
    const perfilSupervisor = await DB.obtenerPerfilSupervisor();

    const respaldo = { trabajadores, asistencias, turnos, cierres, programaciones, perfilSupervisor, tema: Theme.actual, fecha: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo-asistencia-${_hoyISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Respaldo descargado', 'exito');
  }
};

function _validarDependenciasApp() {
  const requeridas = {
    Supabase: typeof window.supabase?.createClient === 'function',
    Chart: typeof window.Chart === 'function',
    Excel: typeof window.XLSX?.writeFile === 'function',
    LectorQR: typeof window.jsQR === 'function',
    GeneradorQR: typeof window.QRCode === 'function',
    PDF: typeof window.jspdf?.jsPDF === 'function',
    TablaPDF: typeof window.jspdf?.jsPDF?.API?.autoTable === 'function'
  };
  const faltantes = Object.entries(requeridas).filter(([, disponible]) => !disponible).map(([nombre]) => nombre);
  document.documentElement.dataset.dependencias = faltantes.length ? `faltan:${faltantes.join(',')}` : 'listas';
  if (faltantes.length) console.error(`Dependencias no disponibles: ${faltantes.join(', ')}`);
}

document.addEventListener('DOMContentLoaded', () => {
  _validarDependenciasApp();
  Auth.init();
});


