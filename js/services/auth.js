const Auth = {
  CLAVE_USUARIOS: 'asistencia_usuarios_v2',
  usuarioActual: null,

  permisosPredeterminados(administrador = false) {
    return { editar:administrador, administrar:administrador, tabs:administrador?['asistencia','historial','programacion','trabajadores','reportes','ajustes','perfil']:['asistencia','historial','reportes','perfil'] };
  },

  obtenerUsuarios() {
    try { return JSON.parse(localStorage.getItem(this.CLAVE_USUARIOS) || '[]'); }
    catch (_) { return []; }
  },

  normalizarUsuario(valor) {
    return String(valor || '').trim().toLowerCase();
  },

  cambiarVista(registro) {
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');
    formLogin?.classList.toggle('oculto', registro);
    formRegistro?.classList.toggle('oculto', !registro);
    const titulo = document.getElementById('login-titulo');
    const subtitulo = document.getElementById('login-subtitulo');
    if (titulo) titulo.textContent = registro ? 'Crear cuenta' : 'Iniciar sesión';
    if (subtitulo) subtitulo.textContent = registro ? 'Registra un usuario para acceder a la aplicación' : 'Ingresa para administrar la asistencia';
    const errorLogin = document.getElementById('login-error');
    const errorRegistro = document.getElementById('registro-error');
    if (errorLogin) errorLogin.textContent = '';
    if (errorRegistro) errorRegistro.textContent = '';
    if (registro) this.cargarAlmacenesRegistro();
    setTimeout(() => document.getElementById(registro ? 'registro-nombre' : 'login-usuario')?.focus(), 0);
  },

  async cargarAlmacenesRegistro() {
    const selector = document.getElementById('registro-almacen');
    if (!selector || !Cloud.client) return;
    selector.disabled = true;
    try {
      const almacenes = await Cloud.listarAlmacenesActivos();
      selector.innerHTML = '<option value="">Selecciona el almacén</option>' + almacenes
        .map(almacen => `<option value="${almacen.id}">${String(almacen.nombre || '').replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}</option>`)
        .join('');
      if (almacenes.length === 1) selector.value = almacenes[0].id;
    } catch (error) {
      selector.innerHTML = '<option value="">No se pudieron cargar los almacenes</option>';
      document.getElementById('registro-error').textContent = 'No se pudo consultar la lista de almacenes. Revisa tu conexión.';
    } finally {
      selector.disabled = false;
    }
  },

  mostrarAcceso() {
    if (!document.getElementById('pantalla-login')) {
      window.location.replace('login.html');
      return;
    }
    document.body.classList.add('auth-bloqueado');
    document.getElementById('pantalla-login').classList.remove('oculto');
    this.cambiarVista(false);
  },

  async iniciarAplicacion(usuarioSupabase) {
    let perfil;
    let asignacion;
    try {
      perfil = await Cloud.obtenerPerfilAcceso(usuarioSupabase);
    } catch (error) {
      if (navigator.onLine) throw error;
      const cache = this.obtenerUsuarios().find(u => u.id === usuarioSupabase.id || u.usuario === usuarioSupabase.email);
      perfil = { nombre: cache?.nombre || usuarioSupabase.user_metadata?.nombre || usuarioSupabase.email, permisos: cache?.permisos || this.permisosPredeterminados(false) };
    }
    try {
      asignacion = await Cloud.resolverAlmacen(usuarioSupabase);
    } catch (error) {
      const cache = this.obtenerUsuarios().find(u => u.id === usuarioSupabase.id || u.usuario === usuarioSupabase.email);
      if (!navigator.onLine && cache?.almacenId) {
        asignacion = { almacenId:cache.almacenId, almacenNombre:cache.almacenNombre, almacenCodigo:cache.almacenCodigo, rol:cache.rolAlmacen };
      } else throw error;
    }
    const permisosPerfil = perfil.permisos || this.permisosPredeterminados(false);
    const permisos = asignacion.rol === 'administrador'
      ? this.permisosPredeterminados(true)
      : asignacion.rol === 'supervisor'
        ? { ...permisosPerfil, editar:true, administrar:false, tabs:[...new Set([...(permisosPerfil.tabs || []),'asistencia','historial','programacion','trabajadores','reportes','perfil'])] }
        : { ...permisosPerfil, editar:false, administrar:false };
    const usuario = {
      id: usuarioSupabase.id,
      nombre: perfil.nombre || usuarioSupabase.user_metadata?.nombre || usuarioSupabase.email,
      usuario: usuarioSupabase.email,
      email: usuarioSupabase.email,
      permisos,
      almacenId: asignacion.almacenId,
      almacenNombre: asignacion.almacenNombre,
      almacenCodigo: asignacion.almacenCodigo,
      rolAlmacen: asignacion.rol
    };
    this.usuarioActual = usuario;
    localStorage.setItem(this.CLAVE_USUARIOS, JSON.stringify([usuario]));
    await Cloud.cargarEstado(usuarioSupabase.id, asignacion);
    document.body.classList.remove('auth-bloqueado');
    document.getElementById('pantalla-login')?.classList.add('oculto');
    const etiqueta = document.getElementById('menu-usuario-activo');
    if (etiqueta) etiqueta.textContent = usuario?.nombre || usuario?.usuario || 'Panel administrativo';
    const almacenEtiqueta = document.getElementById('menu-almacen-activo');
    if (almacenEtiqueta) almacenEtiqueta.textContent = `${usuario.almacenNombre} · ${String(usuario.rolAlmacen || '').toUpperCase()}`;
    if (!App._inicializada) {
      await App.init();
    } else {
      await DB.init();
      await Attendance.renderizarTurnos();
      await App.renderizarContadorGlobal();
      await App.cambiarPestana('asistencia');
    }
    this.aplicarPermisos();
  },

  async init() {
    document.body.classList.add('auth-bloqueado');
    const esDashboard = !!document.querySelector('.app');
    const esLogin = !!document.getElementById('form-login');
    const esRegistro = !!document.getElementById('form-registro');
    try { Cloud.init(); }
    catch (error) {
      const errorLogin = document.getElementById('login-error');
      if (errorLogin) errorLogin.textContent = error.message;
      else console.error(error);
      return;
    }
    await this.cargarAlmacenesRegistro();
    const btnMostrarRegistro = document.getElementById('mostrar-registro');
    const btnMostrarLogin = document.getElementById('mostrar-login');
    if (btnMostrarRegistro) btnMostrarRegistro.addEventListener('click', () => this.cambiarVista(true));
    if (btnMostrarLogin) btnMostrarLogin.addEventListener('click', () => this.cambiarVista(false));

    document.addEventListener('click', (evento) => {
      const selector='#btn-finalizar-turno,#btn-registrar-nuevo-directo,#btn-ir-registro-nuevo,#fab-nuevo-trabajador,#btn-guardar-nuevo-trabajador,#btn-guardar-programacion,#btn-generar-carnets,[data-registro-menu],.programacion-accion.editar,.programacion-accion.eliminar';
      if(evento.target.closest(selector)&&!this.puedeEditar()){evento.preventDefault();evento.stopImmediatePropagation();UI.toast('Tu cuenta tiene permiso de solo lectura','alerta');}
    }, true);
    document.addEventListener('submit', evento => {
      const protegidos=['form-programacion','form-nuevo-trabajador','form-editar-perfil','form-perfil-supervisor','form-editar-registro','form-turnos'];
      if(protegidos.includes(evento.target.id)&&!this.puedeEditar()){evento.preventDefault();evento.stopImmediatePropagation();UI.toast('Tu cuenta tiene permiso de solo lectura','alerta');}
    }, true);

    if (document.getElementById('form-login')) document.getElementById('form-login').addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const usuario = this.normalizarUsuario(document.getElementById('login-usuario').value);
      const clave = document.getElementById('login-clave').value;
      const error = document.getElementById('login-error');
      error.textContent = '';
      try {
        const { data, error: accesoError } = await Cloud.client.auth.signInWithPassword({ email: usuario, password: clave });
        if (accesoError) throw accesoError;
        document.getElementById('form-login').reset();
        if (esDashboard) await this.iniciarAplicacion(data.user); else window.location.href = 'dashboard.html';
      } catch (e) {
        if (e?.code === 'ALMACEN_PENDIENTE') {
          await Cloud.client.auth.signOut();
          error.textContent = e.message;
        } else {
          error.textContent = e?.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : `No se pudo iniciar sesión: ${e.message}`;
        }
      }
    });

    if (document.getElementById('form-registro')) document.getElementById('form-registro').addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const nombre = document.getElementById('registro-nombre').value.trim();
      const usuario = this.normalizarUsuario(document.getElementById('registro-usuario').value);
      const almacenSolicitadoId = document.getElementById('registro-almacen').value;
      const clave = document.getElementById('registro-clave').value;
      const confirmar = document.getElementById('registro-confirmar').value;
      const error = document.getElementById('registro-error');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario)) {
        error.textContent = 'Ingresa un correo electrónico válido.';
        return;
      }
      if (clave.length < 6) { error.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
      if (clave !== confirmar) { error.textContent = 'Las contraseñas no coinciden.'; return; }
      if (!almacenSolicitadoId) { error.textContent = 'Selecciona el almacén al que solicitas acceso.'; return; }
      error.textContent = '';
      try {
        const { data, error: registroError } = await Cloud.client.auth.signUp({ email: usuario, password: clave, options: { data: { nombre, almacen_solicitado_id: almacenSolicitadoId } } });
        if (registroError) throw registroError;
        document.getElementById('form-registro').reset();
        if (data.session && data.user) {
          try {
            if (esDashboard) { await this.iniciarAplicacion(data.user); UI.toast(`Bienvenido, ${nombre}`, 'exito'); }
            else window.location.href = 'dashboard.html';
          } catch (inicioError) {
            if (inicioError?.code !== 'ALMACEN_PENDIENTE') throw inicioError;
            await Cloud.client.auth.signOut();
            this.cambiarVista(false);
            document.getElementById('login-error').textContent = inicioError.message;
          }
        } else {
          if (esDashboard) {
            this.cambiarVista(false);
            document.getElementById('login-error').textContent = 'Cuenta creada. Confirma tu correo; al iniciar sesión se enviará la solicitud del almacén seleccionado.';
          } else {
            window.location.href = 'login.html?registro=ok';
          }
        }
      } catch (e) {
        error.textContent = `No se pudo crear la cuenta: ${e.message}`;
      }
    });

    const { data: { session } } = await Cloud.client.auth.getSession();
    if (session?.user) {
      if (esDashboard) {
        try { await this.iniciarAplicacion(session.user); }
        catch (e) { if (e?.code === 'ALMACEN_PENDIENTE') await Cloud.client.auth.signOut(); throw e; }
      } else {
        window.location.href = 'dashboard.html';
      }
    } else if (esDashboard) {
      window.location.href = 'login.html';
    }
  },

  async cerrarSesion() {
    await Cloud.cerrarSesion();
    if (typeof Scanner !== 'undefined') Scanner.cerrar();
    if (typeof App !== 'undefined') App.cerrarMenu();
    this.usuarioActual=null;
    if (document.querySelector('.app')) window.location.replace('login.html');
    else this.mostrarAcceso();
  },

  puedeEditar() { return !!this.usuarioActual?.permisos?.editar || !!this.usuarioActual?.permisos?.administrar; },
  puedeAdministrar() { return !!this.usuarioActual?.permisos?.administrar; },
  async validarClaveActual(clave) {
    if (!this.usuarioActual?.email) return false;
    const { error } = await Cloud.client.auth.signInWithPassword({ email: this.usuarioActual.email, password: clave });
    return !error;
  },
  puedeVer(tab) { return !!this.usuarioActual?.permisos?.tabs?.includes(tab) || this.puedeAdministrar(); },
  aplicarPermisos() {
    const usuarios=this.obtenerUsuarios();
    this.usuarioActual=usuarios.find(u=>u.usuario===this.usuarioActual?.usuario)||this.usuarioActual;
    document.querySelectorAll('.menu-lateral-item[data-tab]').forEach(item=>item.classList.toggle('acceso-oculto',!this.puedeVer(item.dataset.tab)));
    document.body.classList.toggle('solo-lectura',!this.puedeEditar());
    if(!this.puedeVer(App.pestanaActual)){ const primera=this.usuarioActual?.permisos?.tabs?.[0]||'asistencia'; App.cambiarPestana(primera); }
  }
};
