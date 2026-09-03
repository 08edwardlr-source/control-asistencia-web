# Control de Asistencia — estructura mi-web

## Nueva conexión Supabase

Conectado al proyecto `control-asistencia-web` mediante una clave publicable apta para frontend.

Código repartido desde `control-asistencia-redisenado (1).html`.

## Páginas
- `index.html`: entrada → login.
- `pages/login.html`: inicio de sesión.
- `pages/register.html`: registro.
- `pages/dashboard.html`: aplicación principal con asistencia, historial, programación, base de datos, reportes, ajustes y perfil.
- `pages/profile.html`: acceso directo al perfil dentro del dashboard.

## JavaScript
- `js/services/supabase.js`: conexión y persistencia remota.
- `js/services/auth.js`: autenticación y permisos.
- `js/services/users.js`: gestión de trabajadores.
- `js/main.js`: UI, tema, base de datos local/caché, QR, asistencia, reportes, programación, dashboard y App.
- `js/components/`: auxiliares de navegación/pie.
- `js/utils/`: validaciones y helpers.

## CSS
- `variables.css`: variables de diseño.
- `main.css`: layout y navegación.
- `components.css`: componentes.
- `responsive.css`: media queries.

## Dependencias
Las librerías originales (Supabase, Chart.js, XLSX, jsQR, QRCode y jsPDF) se cargan desde CDN en las páginas.
