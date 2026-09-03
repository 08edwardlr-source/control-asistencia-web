/* Conexión Supabase y persistencia remota */
const DB_KEYS = {
  TRABAJADORES: 'asistencia_trabajadores',
  ASISTENCIAS: 'asistencia_registros',
  TURNOS: 'asistencia_turnos',
  CIERRES: 'asistencia_cierres',
  PROGRAMACIONES: 'asistencia_programaciones',
  PERFIL: 'asistencia_perfil_supervisor'
};

const SUPABASE_URL = 'https://wnizcvoisbcqbuccaqpk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2xTqFgoAnAyJenH2KImruA_YwKtPGGv';

const Cloud = {
  client: null,
  usuarioId: null,
  almacenId: null,
  almacenNombre: '',
  rolAlmacen: null,
  suspendido: false,
  temporizadores: new Map(),
  pendientes: new Map(),
  asistenciasMemoria: [],
  asistenciasCambiosPendientes: new Set(),
  asistenciasEliminadasPendientes: new Set(),
  CACHE_DIAS: 14,
  CLAVE_ELIMINADOS: 'asistencia_eliminados_pendientes_v1',
  clavesSincronizadas: () => [DB_KEYS.TRABAJADORES, DB_KEYS.TURNOS, DB_KEYS.CIERRES, DB_KEYS.PROGRAMACIONES, DB_KEYS.PERFIL],
  clavesGestionadas: () => [...Cloud.clavesSincronizadas(), DB_KEYS.ASISTENCIAS],
  puedeEscribirAlmacen: () => ['administrador','supervisor'].includes(Cloud.rolAlmacen),

  init() {
    if (!window.supabase?.createClient) throw new Error('No se pudo cargar la conexión con Supabase. Revisa tu conexión a internet.');
    this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    if (!this._eventosRedRegistrados) {
      window.addEventListener('online', () => this.sincronizarPendientes());
      window.addEventListener('offline', () => this.actualizarEstadoSync('sin-conexion'));
      this._eventosRedRegistrados = true;
    }
    this.actualizarEstadoSync(navigator.onLine ? 'local' : 'sin-conexion');
    return this.client;
  },

  actualizarEstadoSync(estado, detalle = '') {
    const indicador = document.getElementById('estado-sincronizacion');
    if (!indicador) return;
    const textos = { guardado:'GUARDADO', sincronizando:'SINCRONIZANDO', 'sin-conexion':'SIN CONEXIÓN', local:'LOCAL' };
    indicador.dataset.estado = estado;
    indicador.textContent = detalle || textos[estado] || String(estado).toUpperCase();
    indicador.setAttribute('aria-label', `Estado de sincronización: ${indicador.textContent}`);
    indicador.title = indicador.getAttribute('aria-label');
  },

  async obtenerPerfilAcceso(usuario) {
    const nombre = String(usuario?.user_metadata?.nombre || usuario?.email || '').trim();
    const consulta = await this.client.from('perfiles').select('id,nombre,permisos').eq('id', usuario.id).maybeSingle();
    if (consulta.error) throw consulta.error;
    if (consulta.data) return consulta.data;

    // Una cuenta nueva puede crear su propio perfil con los permisos limitados
    // definidos por defecto en Supabase. Nunca se sobrescriben permisos al entrar.
    const creacion = await this.client
      .from('perfiles')
      .insert({ id: usuario.id, nombre })
      .select('id,nombre,permisos')
      .single();
    if (creacion.error) throw creacion.error;
    return creacion.data;
  },

  async listarAlmacenesActivos() {
    const { data, error } = await this.client.from('almacenes').select('id,codigo,nombre').eq('activo', true).order('nombre');
    if (error) throw error;
    return data || [];
  },

  async resolverAlmacen(usuario) {
    const { data, error } = await this.client
      .from('usuarios_almacenes')
      .select('almacen_id,rol,activo,almacenes(id,codigo,nombre,activo)')
      .eq('usuario_id', usuario.id)
      .eq('activo', true);
    if (error) throw error;
    const asignaciones = (data || []).filter(item => item.almacenes?.activo !== false);
    if (asignaciones.length) {
      const clave = `asistencia_almacen_preferido_${usuario.id}`;
      const preferido = localStorage.getItem(clave);
      const elegida = asignaciones.find(item => item.almacen_id === preferido) || asignaciones[0];
      localStorage.setItem(clave, elegida.almacen_id);
      return {
        almacenId: elegida.almacen_id,
        almacenNombre: elegida.almacenes?.nombre || 'Almacén asignado',
        almacenCodigo: elegida.almacenes?.codigo || '',
        rol: elegida.rol || 'lector'
      };
    }

    const solicitado = String(usuario?.user_metadata?.almacen_solicitado_id || '').trim();
    if (solicitado) {
      const { error: solicitudError } = await this.client.from('solicitudes_almacen').insert({
        usuario_id: usuario.id,
        almacen_id: solicitado,
        estado: 'pendiente'
      });
      if (solicitudError && solicitudError.code !== '23505') throw solicitudError;
    }
    const pendiente = new Error('Tu cuenta está pendiente de asignación a un almacén. Un administrador debe aprobarla en Supabase.');
    pendiente.code = 'ALMACEN_PENDIENTE';
    throw pendiente;
  },

  async cargarEstado(usuarioId, asignacion) {
    this.usuarioId = usuarioId;
    this.almacenId = asignacion.almacenId;
    this.almacenNombre = asignacion.almacenNombre;
    this.rolAlmacen = asignacion.rol;
    this.actualizarEstadoSync('sincronizando');
    this.asistenciasCambiosPendientes.clear();
    this.asistenciasEliminadasPendientes = new Set(this.leerEliminadosLocales());
    const cacheLocal = _leer(DB_KEYS.ASISTENCIAS, []);
    const alcanceActual = `${usuarioId}:${this.almacenId}`;
    const alcanceAnterior = localStorage.getItem('asistencia_supabase_alcance_inicial');
    const cachePerteneceAlUsuario = !alcanceAnterior || alcanceAnterior === alcanceActual;
    if (!navigator.onLine) {
      this.asistenciasMemoria = cachePerteneceAlUsuario ? cacheLocal.map(registro => ({ ...registro })) : [];
      this.actualizarEstadoSync('sin-conexion');
      return;
    }
    const { data, error } = await this.client.from('estado_almacen').select('clave,datos').eq('almacen_id', this.almacenId);
    if (error) throw error;
    this.suspendido = true;
    try {
      if (data?.length) {
        const estadoNormal = data.filter(item => item.clave !== DB_KEYS.ASISTENCIAS);
        const recibidas = new Set(estadoNormal.map(item => item.clave));
        this.clavesSincronizadas().forEach(clave => { if (!recibidas.has(clave)) localStorage.removeItem(clave); });
        estadoNormal.forEach(item => localStorage.setItem(item.clave, JSON.stringify(item.datos)));
      } else {
        if (cachePerteneceAlUsuario && this.puedeEscribirAlmacen()) {
          await this.subirCacheEstadoActual();
        } else {
          this.clavesSincronizadas().forEach(clave => localStorage.removeItem(clave));
        }
      }

      const remotos = await this.consultarAsistenciasRemotas();
      const combinados = new Map(remotos.map(registro => [String(registro.id), registro]));
      let requiereSincronizar = false;
      if (cachePerteneceAlUsuario && this.puedeEscribirAlmacen()) {
        cacheLocal.forEach(registroLocal => {
          if (!registroLocal?.id) return;
          const id = String(registroLocal.id);
          const remoto = combinados.get(id);
          const fechaLocal = Date.parse(registroLocal._modificadoEn || registroLocal._remotoActualizadoEn || 0) || 0;
          const fechaRemota = Date.parse(remoto?._remotoActualizadoEn || 0) || 0;
          if (!remoto || fechaLocal > fechaRemota) {
            combinados.set(id, { ...registroLocal });
            requiereSincronizar = true;
          }
        });
      }
      this.asistenciasEliminadasPendientes.forEach(id => {
        if (combinados.delete(String(id))) requiereSincronizar = true;
      });
      this.asistenciasMemoria = [...combinados.values()];
      this.guardarCacheReciente(this.asistenciasMemoria);
      localStorage.setItem('asistencia_supabase_alcance_inicial', alcanceActual);

      if (this.puedeEscribirAlmacen() && (requiereSincronizar || (!remotos.length && this.asistenciasMemoria.length))) {
        await this.sincronizarAsistencias(this.asistenciasMemoria, [...this.asistenciasEliminadasPendientes]);
        this.asistenciasEliminadasPendientes.clear();
        this.guardarEliminadosLocales();
      }
    } finally {
      this.suspendido = false;
    }
    this.actualizarEstadoSync('guardado');
  },

  async subirCacheEstadoActual() {
    const filas = this.clavesSincronizadas().flatMap(clave => {
      const raw = localStorage.getItem(clave);
      if (raw === null) return [];
      try { return [{ almacen_id: this.almacenId, actualizado_por: this.usuarioId, clave, datos: JSON.parse(raw), actualizado_en: new Date().toISOString() }]; }
      catch (_) { return []; }
    });
    if (filas.length) {
      const { error } = await this.client.from('estado_almacen').upsert(filas, { onConflict: 'almacen_id,clave' });
      if (error) throw error;
    }
  },

  programar(clave, valor) {
    if (!this.client || !this.usuarioId || !this.almacenId || !this.puedeEscribirAlmacen() || this.suspendido || !this.clavesGestionadas().includes(clave)) return;
    this.pendientes.set(clave, valor);
    this.actualizarEstadoSync(navigator.onLine ? 'sincronizando' : 'sin-conexion');
    clearTimeout(this.temporizadores.get(clave));
    this.temporizadores.set(clave, setTimeout(() => this.sincronizarPendiente(clave), 450));
  },

  async sincronizarPendiente(clave) {
    if (!this.pendientes.has(clave) || !this.usuarioId) return;
    const valor = this.pendientes.get(clave);
    try {
      if (clave === DB_KEYS.ASISTENCIAS) {
        const cambios = [...this.asistenciasCambiosPendientes];
        const eliminados = [...this.asistenciasEliminadasPendientes];
        await this.sincronizarAsistencias(valor, eliminados, cambios);
        cambios.forEach(id => this.asistenciasCambiosPendientes.delete(id));
        eliminados.forEach(id => this.asistenciasEliminadasPendientes.delete(id));
        this.guardarEliminadosLocales();
      } else {
        const { error } = await this.client.from('estado_almacen').upsert({ almacen_id: this.almacenId, actualizado_por: this.usuarioId, clave, datos: valor, actualizado_en: new Date().toISOString() }, { onConflict: 'almacen_id,clave' });
        if (error) throw error;
      }
      if (this.pendientes.get(clave) === valor) this.pendientes.delete(clave);
      this.actualizarEstadoSync(this.pendientes.size ? 'sincronizando' : 'guardado');
    } catch (error) {
      console.error('Error sincronizando con Supabase', error);
      this.actualizarEstadoSync('sin-conexion');
      if (typeof UI !== 'undefined') UI.toast('Los datos recientes están seguros en este equipo y se sincronizarán al recuperar la conexión', 'alerta');
    }
  },

  async sincronizarPendientes() {
    if (!this.usuarioId || !this.almacenId || !this.puedeEscribirAlmacen() || !navigator.onLine) return;
    this.actualizarEstadoSync('sincronizando');
    for (const clave of [...this.pendientes.keys()]) await this.sincronizarPendiente(clave);
    if (!this.pendientes.size) this.actualizarEstadoSync('guardado');
  },

  horasAMinutos(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') return Math.max(0, Math.round(valor * 60));
    const partes = String(valor).split(':').map(Number);
    return partes.length >= 2 && partes.every(Number.isFinite) ? Math.max(0, partes[0] * 60 + partes[1]) : null;
  },

  minutosAHoras(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    const minutos = Math.max(0, Number(valor) || 0);
    return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(Math.round(minutos % 60)).padStart(2, '0')}`;
  },

  registroAFila(registro, actualizadoEn = new Date().toISOString()) {
    const extra = { ...registro };
    delete extra._modificadoEn;
    delete extra._remotoActualizadoEn;
    return {
      almacen_id: this.almacenId, id: String(registro.id), propietario_id: this.usuarioId, fecha: registro.fecha, dni: String(registro.dni || ''),
      trabajador: String(registro.nombreCompleto || ''), turno_id: String(registro.turnoId || ''), turno: String(registro.turnoNombre || registro.turnoId || ''),
      entrada: registro.horaEntrada || null, salida: registro.horaSalida || null, horas_trabajadas_minutos: this.horasAMinutos(registro.horasTrabajadas),
      metodo: registro.metodoEntrada || registro.metodo || 'DNI', metodo_salida: registro.metodoSalida || null,
      estado_entrada: registro.estadoEntrada || null, estado_salida: registro.estadoSalida || null,
      supervisor: _nombreSupervisor(registro.supervisorSalida || registro.supervisorEntrada), finalizado: registro.finalizado === true,
      cierre_id: registro.cierreId || null, minutos_salida_anticipada: Math.max(0, Number(registro.minutosSalidaAnticipada) || 0),
      datos_extra: extra, actualizado_en: actualizadoEn
    };
  },

  filaARegistro(fila) {
    const extra = fila?.datos_extra && typeof fila.datos_extra === 'object' ? { ...fila.datos_extra } : {};
    return {
      ...extra,
      id: String(fila.id),
      fecha: fila.fecha || extra.fecha,
      dni: String(fila.dni || extra.dni || ''),
      nombreCompleto: fila.trabajador || extra.nombreCompleto || '',
      turnoId: fila.turno_id || extra.turnoId || '',
      turnoNombre: fila.turno || extra.turnoNombre || fila.turno_id || '',
      horaEntrada: fila.entrada || extra.horaEntrada || null,
      horaSalida: fila.salida ?? extra.horaSalida ?? null,
      horasTrabajadas: fila.horas_trabajadas_minutos === null || fila.horas_trabajadas_minutos === undefined ? (extra.horasTrabajadas || null) : this.minutosAHoras(fila.horas_trabajadas_minutos),
      metodo: fila.metodo || extra.metodo || 'DNI',
      metodoEntrada: fila.metodo || extra.metodoEntrada || extra.metodo || 'DNI',
      metodoSalida: fila.metodo_salida || extra.metodoSalida || null,
      estadoEntrada: fila.estado_entrada || extra.estadoEntrada || null,
      estadoSalida: fila.estado_salida ?? extra.estadoSalida ?? null,
      finalizado: fila.finalizado === true,
      cierreId: fila.cierre_id || extra.cierreId || null,
      minutosSalidaAnticipada: Math.max(0, Number(fila.minutos_salida_anticipada ?? extra.minutosSalidaAnticipada) || 0),
      _remotoActualizadoEn: fila.actualizado_en || null
    };
  },

  async consultarAsistenciasRemotas(filtros = {}) {
    if (!this.client || !this.usuarioId || !this.almacenId) return [];
    const columnas = 'id,fecha,dni,trabajador,turno_id,turno,entrada,salida,horas_trabajadas_minutos,metodo,metodo_salida,estado_entrada,estado_salida,finalizado,cierre_id,minutos_salida_anticipada,datos_extra,actualizado_en';
    const filas = [];
    let cursor = null;
    while (true) {
      let consulta = this.client.from('asistencias_almacen').select(columnas).eq('almacen_id', this.almacenId);
      if (filtros.finalizado !== undefined) consulta = consulta.eq('finalizado', filtros.finalizado);
      if (filtros.fechaInicio) consulta = consulta.gte('fecha', filtros.fechaInicio);
      if (filtros.fechaFin) consulta = consulta.lte('fecha', filtros.fechaFin);
      if (filtros.dni) consulta = consulta.eq('dni', filtros.dni);
      if (filtros.turnoId) consulta = consulta.eq('turno_id', filtros.turnoId);
      if (cursor) consulta = consulta.gt('id', cursor);
      const { data, error } = await consulta.order('id', { ascending:true }).limit(1000);
      if (error) throw error;
      filas.push(...(data || []));
      if (!data || data.length < 1000) break;
      cursor = data[data.length - 1].id;
    }
    return filas.map(fila => this.filaARegistro(fila));
  },

  async sincronizarAsistencias(registros = null, eliminados = [], soloIds = null) {
    if (!this.client || !this.usuarioId || !this.almacenId || !this.puedeEscribirAlmacen()) return;
    const listaCompleta = Array.isArray(registros) ? registros : this.asistenciasMemoria;
    const idsPermitidos = Array.isArray(soloIds) && soloIds.length ? new Set(soloIds.map(String)) : null;
    const lista = idsPermitidos ? listaCompleta.filter(r => idsPermitidos.has(String(r.id))) : listaCompleta;
    const marca = new Date().toISOString();
    const filas = lista.map(r => this.registroAFila(r, marca));
    for (let i = 0; i < filas.length; i += 500) {
      const { error } = await this.client.from('asistencias_almacen').upsert(filas.slice(i, i + 500), { onConflict:'almacen_id,id' });
      if (error) throw error;
    }
    const idsEliminados = [...new Set((eliminados || []).map(String))];
    for (let i = 0; i < idsEliminados.length; i += 200) {
      const { error } = await this.client.from('asistencias_almacen').delete().eq('almacen_id', this.almacenId).in('id', idsEliminados.slice(i, i + 200));
      if (error) throw error;
    }
    const sincronizados = new Set(lista.map(r => String(r.id)));
    this.asistenciasMemoria.forEach(registro => {
      if (!sincronizados.has(String(registro.id))) return;
      registro._remotoActualizadoEn = marca;
      delete registro._modificadoEn;
    });
    this.guardarCacheReciente(this.asistenciasMemoria);
  },

  sinMarcas(registro) {
    const copia = { ...registro };
    delete copia._modificadoEn;
    delete copia._remotoActualizadoEn;
    return copia;
  },

  actualizarMemoriaAsistencias(registros) {
    const anteriores = new Map(this.asistenciasMemoria.map(r => [String(r.id), r]));
    const ahora = new Date().toISOString();
    const nuevos = (Array.isArray(registros) ? registros : []).map(registro => {
      const copia = { ...registro };
      const anterior = anteriores.get(String(copia.id));
      const cambio = !anterior || JSON.stringify(this.sinMarcas(anterior)) !== JSON.stringify(this.sinMarcas(copia));
      if (cambio) {
        copia._modificadoEn = ahora;
        this.asistenciasCambiosPendientes.add(String(copia.id));
      }
      anteriores.delete(String(copia.id));
      return copia;
    });
    anteriores.forEach((_, id) => this.asistenciasEliminadasPendientes.add(String(id)));
    this.asistenciasMemoria = nuevos;
    this.guardarEliminadosLocales();
    this.guardarCacheReciente(nuevos);
    return nuevos;
  },

  obtenerAsistenciasMemoria() {
    return this.asistenciasMemoria.map(registro => ({ ...registro }));
  },

  guardarCacheReciente(registros) {
    const guardar = dias => {
      const limite = _sumarDiasISO(_hoyISO(), -dias);
      const recientes = (registros || []).filter(r => !r.finalizado || !r.fecha || r.fecha >= limite);
      localStorage.setItem(DB_KEYS.ASISTENCIAS, JSON.stringify(recientes));
    };
    try { guardar(this.CACHE_DIAS); }
    catch (error) {
      console.warn('La caché local se redujo por falta de espacio', error);
      try { guardar(3); } catch (errorReducido) { console.warn('No se pudo guardar la caché local', errorReducido); }
    }
  },

  leerEliminadosLocales() {
    try {
      const porUsuario = JSON.parse(localStorage.getItem(this.CLAVE_ELIMINADOS) || '{}');
      const alcance = `${this.usuarioId}:${this.almacenId}`;
      return Array.isArray(porUsuario[alcance]) ? porUsuario[alcance].map(String) : [];
    } catch (_) { return []; }
  },

  guardarEliminadosLocales() {
    if (!this.usuarioId || !this.almacenId) return;
    try {
      const porUsuario = JSON.parse(localStorage.getItem(this.CLAVE_ELIMINADOS) || '{}');
      porUsuario[`${this.usuarioId}:${this.almacenId}`] = [...this.asistenciasEliminadasPendientes];
      localStorage.setItem(this.CLAVE_ELIMINADOS, JSON.stringify(porUsuario));
    } catch (error) { console.warn('No se pudo guardar la cola de eliminaciones', error); }
  },

  async cerrarSesion() {
    if (this.client) await this.client.auth.signOut();
    this.usuarioId = null;
    this.almacenId = null;
    this.almacenNombre = '';
    this.rolAlmacen = null;
    this.asistenciasMemoria = [];
    this.asistenciasCambiosPendientes.clear();
    this.asistenciasEliminadasPendientes.clear();
    this.pendientes.clear();
    this.actualizarEstadoSync('local');
  }
};

// Puente opcional para que la capa TypeScript de Capacitor pueda solicitar
// sincronización al volver la aplicación al primer plano.
window.Cloud = Cloud;

/* ------------------------------------------------------------------- */
/* Utilidades internas de almacenamiento                                */
/* ------------------------------------------------------------------- */
