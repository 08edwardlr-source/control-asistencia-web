/* Navegación y configuración de la interfaz */
const Idioma = {
  CLAVE: 'asistencia_idioma_v1',
  actual: 'es',
  textos: {
    en: { asistencia:'Attendance', historial:'History', programacion:'Scheduling', trabajadores:'Database', reportes:'Reports', ajustes:'Settings', perfil:'Profile', tituloAjustes:'SETTINGS', tema:'Theme', idioma:'Language', turnos:'Shift configuration', horarios:'Work schedules', notificaciones:'Notifications', gestion:'Database management', respaldo:'Data backup', borrar:'Delete information', informacion:'Application information', cerrar:'Sign out', tituloProgramacion:'DAILY SCHEDULING', tituloHistorial:'ATTENDANCE HISTORY', tituloBase:'DATABASE', tituloDashboard:'DASHBOARD', tituloPerfil:'SUPERVISOR PROFILE' },
    pt: { asistencia:'Frequência', historial:'Histórico', programacion:'Programação', trabajadores:'Base de dados', reportes:'Relatórios', ajustes:'Configurações', perfil:'Perfil', tituloAjustes:'CONFIGURAÇÕES', tema:'Tema', idioma:'Idioma', turnos:'Configuração de turnos', horarios:'Horários de trabalho', notificaciones:'Notificações', gestion:'Gestão da base de dados', respaldo:'Backup de dados', borrar:'Excluir informações', informacion:'Informações do aplicativo', cerrar:'Sair', tituloProgramacion:'PROGRAMAÇÃO DIÁRIA', tituloHistorial:'HISTÓRICO DE FREQUÊNCIA', tituloBase:'BASE DE DADOS', tituloDashboard:'PAINEL', tituloPerfil:'PERFIL DO SUPERVISOR' }
  },
  base: { asistencia:'Asistencia', historial:'Historial', programacion:'Programación', trabajadores:'Base Datos', reportes:'Reportes', ajustes:'Ajustes', perfil:'Perfil', tituloAjustes:'AJUSTES', tema:'Tema', idioma:'Idioma', turnos:'Configuración de turnos', horarios:'Horarios de trabajo', notificaciones:'Notificaciones', gestion:'Gestión de base de datos', respaldo:'Respaldo de datos', borrar:'Borrar información', informacion:'Información de la aplicación', cerrar:'Cerrar sesión', tituloProgramacion:'PROGRAMACIÓN DIARIA', tituloHistorial:'HISTORIAL DE ASISTENCIAS', tituloBase:'BASE DATOS', tituloDashboard:'DASHBOARD', tituloPerfil:'PERFIL DEL SUPERVISOR' },
  init() { this.aplicar(localStorage.getItem(this.CLAVE) || 'es', false); },
  _textoItem(selector, texto) {
    const elemento = document.querySelector(selector); if (!elemento) return;
    const nodo = [...elemento.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
    if (nodo) nodo.nodeValue = `\n          ${texto}\n          `;
  },
  aplicar(codigo, guardar = true) {
    this.actual = ['es','en','pt'].includes(codigo) ? codigo : 'es';
    const t = this.actual === 'es' ? this.base : this.textos[this.actual];
    document.documentElement.lang = this.actual;
    const menu = { asistencia:t.asistencia, historial:t.historial, programacion:t.programacion, trabajadores:t.trabajadores, reportes:t.reportes, ajustes:t.ajustes, perfil:t.perfil };
    Object.entries(menu).forEach(([tab,texto]) => this._textoItem(`.menu-lateral-item[data-tab="${tab}"]`, texto));
    const ajustes = { '#item-tema':t.tema, '#item-idioma':t.idioma, '#item-config-turnos':t.turnos, '#item-horarios':t.horarios, '#item-notificaciones':t.notificaciones, '#item-gestion-trabajadores':t.gestion, '#btn-respaldo-datos':t.respaldo, '#item-borrar-informacion':t.borrar, '#item-info':t.informacion, '#btn-cerrar-sesion':t.cerrar, '#btn-cerrar-sesion-menu':t.cerrar };
    Object.entries(ajustes).forEach(([selector,texto]) => this._textoItem(selector, texto));
    const titulo = document.querySelector('#vista-ajustes .titulo-vista'); if (titulo) titulo.textContent = t.tituloAjustes;
    const titulos={'#vista-programacion .titulo-vista':t.tituloProgramacion,'#vista-historial .titulo-vista':t.tituloHistorial,'#vista-trabajadores .titulo-vista':t.tituloBase,'#vista-reportes .titulo-vista':t.tituloDashboard,'#vista-perfil .titulo-vista':t.tituloPerfil};
    Object.entries(titulos).forEach(([selector,texto])=>{const el=document.querySelector(selector);if(el)el.textContent=texto;});
    document.querySelectorAll('input[name="idioma-app"]').forEach(r => r.checked = r.value === this.actual);
    if (guardar) localStorage.setItem(this.CLAVE, this.actual);
  }
};

const AjustesAvanzados = {
  abrir(nombre) { UI.cerrarTodosLosModales(); document.getElementById(`modal-${nombre}`).classList.add('visible'); document.getElementById(`modal-${nombre}-overlay`).classList.add('visible'); },
  cerrar(nombre) { document.getElementById(`modal-${nombre}`).classList.remove('visible'); document.getElementById(`modal-${nombre}-overlay`).classList.remove('visible'); },
  abrirBorrado() { if (!Auth.puedeAdministrar()) return UI.toast('No tienes permiso para borrar información', 'alerta'); const hoy=_hoyISO(); document.getElementById('borrar-fecha-inicio').value=hoy; document.getElementById('borrar-fecha-fin').value=hoy; document.getElementById('borrar-confirmacion').value=''; document.getElementById('borrar-clave-admin').value=''; this.actualizarRango(); this.abrir('borrar'); },
  actualizarRango() { const porRango=document.getElementById('borrar-tipo').value==='registros'; document.getElementById('borrar-rango').classList.toggle('oculto',!porRango); document.getElementById('borrar-fecha-inicio').required=porRango; document.getElementById('borrar-fecha-fin').required=porRango; },
  async borrar(evento) {
    evento.preventDefault();
    if (!Auth.puedeAdministrar()) return UI.toast('Acción no autorizada', 'alerta');
    if (!await Auth.validarClaveActual(document.getElementById('borrar-clave-admin').value)) return UI.toast('Contraseña de administrador incorrecta', 'error');
    if (document.getElementById('borrar-confirmacion').value.trim().toUpperCase()!=='BORRAR') return UI.toast('Escribe BORRAR para confirmar', 'alerta');
    const tipo=document.getElementById('borrar-tipo').value;
    if (tipo==='registros') {
      const inicio=document.getElementById('borrar-fecha-inicio').value, fin=document.getElementById('borrar-fecha-fin').value;
      if (!inicio||!fin||inicio>fin) return UI.toast('El rango de fechas no es válido','alerta');
      const fuera = item => !item.fecha || item.fecha<inicio || item.fecha>fin;
      _escribir(DB_KEYS.ASISTENCIAS,(await DB.obtenerAsistencias()).filter(fuera));
      _escribir(DB_KEYS.CIERRES,_leer(DB_KEYS.CIERRES,[]).filter(fuera));
      UI.toast(`Registros eliminados del ${UI.formatearFecha(inicio)} al ${UI.formatearFecha(fin)}`,'exito');
    } else if (tipo==='trabajadores') {
      _escribir(DB_KEYS.TRABAJADORES,[]); UI.toast('Base de datos de trabajadores eliminada','exito');
    } else {
      [DB_KEYS.TRABAJADORES,DB_KEYS.ASISTENCIAS,DB_KEYS.CIERRES,DB_KEYS.PROGRAMACIONES].forEach(k=>_escribir(k,[]));
      UI.toast('Datos operativos eliminados','exito');
    }
    this.cerrar('borrar');
    await App.renderizarContadorGlobal();
    if (App.pestanaActual==='asistencia') await Attendance.renderizarRegistrosHoy();
  }
};



window.Navbar = {
  ir(tab) { window.location.href = `dashboard.html?tab=${encodeURIComponent(tab)}`; }
};
