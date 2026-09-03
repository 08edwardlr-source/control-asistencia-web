-- La migración 001_configuracion_completa.sql crea el almacén inicial.
-- Ejecuta la migración completa desde Supabase SQL Editor.
insert into public.almacenes (codigo, nombre, activo)
values ('ALM-01', 'Almacén principal', true)
on conflict (codigo) do update set nombre = excluded.nombre, activo = true;
