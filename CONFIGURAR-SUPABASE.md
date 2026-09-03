# Configurar la nueva base de datos

Proyecto: `wnizcvoisbcqbuccaqpk`

1. Revoca la clave `sb_secret_...` que compartiste y genera otra. Nunca coloques una clave secreta en HTML o JavaScript.
2. Abre `supabase/migrations/001_configuracion_completa.sql`.
3. Cambia los cuatro correos `administrador1@empresa.com` a `administrador4@empresa.com` por los correos reales.
4. En Supabase abre **SQL Editor > New query**, pega el SQL completo y presiona **Run**.
5. El resultado debe mostrar `CONFIGURACION_COMPLETA`, al menos un almacén y cuatro administradores configurados.
6. En **Authentication > Users > Add user**, crea las cuatro cuentas con esos mismos correos y contraseñas seguras diferentes.

Las cuentas que se registren desde `pages/register.html` entrarán normalmente como usuarios de lectura. Para permitir que una cuenta registre o modifique asistencias, conviértela en supervisor:

```sql
update public.usuarios_almacenes ua
set rol = 'supervisor', activo = true
from auth.users u
where ua.usuario_id = u.id
  and lower(u.email) = lower('supervisor@empresa.com');
```

## Usar cualquier conexión

No existe ningún filtro por IP o Wi-Fi. El sistema funciona desde el Wi-Fi empresarial, otra red o datos móviles siempre que haya Internet. Para probarlo, abre una terminal dentro de `mi-web`, ejecuta `python -m http.server 8080` y entra a `http://localhost:8080`.

Si publicas la web, agrega su dirección en **Authentication > URL Configuration > Redirect URLs**. La disponibilidad desde otras redes depende también de que el firewall o proxy de esa red permita HTTPS hacia `supabase.co`.
