const OperadoresVista = {
  intervaloReloj: null,

  init() {
    this.iniciarReloj();
    this.detectarTurnoVisual();
    this.controlarConexion();
    this.configurarModal();
    this.configurarDni();
    this.configurarQr();
  },

  iniciarReloj() {
    const actualizar = () => {
      const ahora = new Date();

      const hora = ahora.toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      const fecha = ahora.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const relojHora = document.getElementById('reloj-hora');
      const relojFecha = document.getElementById('reloj-fecha');

      if (relojHora) {
        relojHora.textContent = hora;
      }

      if (relojFecha) {
        relojFecha.textContent = fecha;
      }
    };

    actualizar();

    this.intervaloReloj = window.setInterval(actualizar, 1000);
  },

  detectarTurnoVisual() {
    const ahora = new Date();
    const minutos = ahora.getHours() * 60 + ahora.getMinutes();

    let nombre;
    let horario;

    if (minutos >= 360 && minutos < 840) {
      nombre = 'Turno 1';
      horario = '06:00 a 14:00';
    } else if (minutos >= 840 && minutos < 1320) {
      nombre = 'Turno 2';
      horario = '14:00 a 22:00';
    } else {
      nombre = 'Turno 3';
      horario = '22:00 a 06:00';
    }

    document.getElementById('turno-actual').textContent = nombre;
    document.getElementById('turno-horario').textContent = horario;
  },

  controlarConexion() {
    const actualizar = () => {
      const conectado = navigator.onLine;

      const estado = document.getElementById('estado-conexion');
      const texto = document.getElementById(
        'estado-conexion-texto'
      );

      estado.dataset.estado = conectado
        ? 'conectado'
        : 'desconectado';

      texto.textContent = conectado
        ? 'EN LÍNEA'
        : 'SIN CONEXIÓN';
    };

    actualizar();

    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
  },

  configurarModal() {
    const botonSalir =
      document.getElementById('btn-cerrar-sesion');

    const botonCerrar =
      document.getElementById('btn-cerrar-modal');

    const botonCancelar =
      document.getElementById('btn-cancelar-salida');

    const overlay =
      document.getElementById('modal-salir-overlay');

    const formulario =
      document.getElementById('form-cerrar-sesion');

    botonSalir.addEventListener('click', () => {
      this.mostrarModalSalida();
    });

    botonCerrar.addEventListener('click', () => {
      this.ocultarModalSalida();
    });

    botonCancelar.addEventListener('click', () => {
      this.ocultarModalSalida();
    });

    overlay.addEventListener('click', () => {
      this.ocultarModalSalida();
    });

    formulario.addEventListener('submit', evento => {
      evento.preventDefault();

      document.getElementById(
        'error-cerrar-sesion'
      ).textContent =
        'La validación con Supabase se conectará después de aprobar el diseño.';
    });
  },

  mostrarModalSalida() {
    document
      .getElementById('modal-salir')
      .classList.remove('oculto');

    document
      .getElementById('modal-salir-overlay')
      .classList.remove('oculto');

    window.setTimeout(() => {
      document
        .getElementById('clave-cerrar-sesion')
        .focus();
    }, 100);
  },

  ocultarModalSalida() {
    document
      .getElementById('modal-salir')
      .classList.add('oculto');

    document
      .getElementById('modal-salir-overlay')
      .classList.add('oculto');

    document
      .getElementById('form-cerrar-sesion')
      .reset();

    document.getElementById(
      'error-cerrar-sesion'
    ).textContent = '';
  },

  configurarDni() {
    const formulario = document.getElementById('form-dni');
    const entrada = document.getElementById('operador-dni');
    const mensaje = document.getElementById('mensaje-dni');

    entrada.addEventListener('input', () => {
      entrada.value = entrada.value.replace(/\D/g, '');
      mensaje.textContent = '';
    });

    formulario.addEventListener('submit', evento => {
      evento.preventDefault();

      const dni = entrada.value.trim();

      if (dni.length < 8) {
        mensaje.textContent =
          'Ingresa un número de documento válido.';
        entrada.focus();
        return;
      }

      mensaje.textContent =
        'El registro real se conectará después de aprobar el diseño.';
    });
  },

  configurarQr() {
    document
      .getElementById('btn-escanear-qr')
      .addEventListener('click', () => {
        const mensaje = document.getElementById('mensaje-dni');

        mensaje.textContent =
          'La cámara QR se conectará después de aprobar el diseño.';
      });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OperadoresVista.init();
});
