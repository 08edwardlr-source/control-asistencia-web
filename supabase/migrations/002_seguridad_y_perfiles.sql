-- SEGURIDAD, PERFILES PERSONALES Y PROTECCIÓN DE REGISTROS
-- Ejecutar después de 001_configuracion_completa.sql.

-- =====================================================
-- 1. PERFIL INDIVIDUAL PARA CADA SUPERVISOR
-- =====================================================

alter table public.perfiles
  add column if not exists nombres text not null default '',
  add column if not exists apellidos text not null default '',
  add column if not exists dni varchar(8) not null default '',
  add column if not exists cargo text not null default 'Supervisor',
  add column if not exists area text not null default '',
  add column if not exists perfil_completo boolean not null default false;

create or replace function public.guardar_mi_perfil_supervisor(
  p_nombres text,
  p_apellidos text,
  p_dni text,
  p_cargo text,
  p_area text default ''
)
returns public.perfiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.perfiles;
begin
  if auth.uid() is null then
    raise exception 'Sesión no válida';
  end if;

  if trim(coalesce(p_nombres, '')) = ''
     or trim(coalesce(p_apellidos, '')) = '' then
    raise exception 'Nombres y apellidos son obligatorios';
  end if;

  if coalesce(p_dni, '') !~ '^[0-9]{8}$' then
    raise exception 'El DNI debe tener 8 dígitos';
  end if;

  if trim(coalesce(p_cargo, '')) = '' then
    raise exception 'El cargo es obligatorio';
  end if;

  update public.perfiles
  set nombres = trim(p_nombres),
      apellidos = trim(p_apellidos),
      dni = p_dni,
      cargo = trim(p_cargo),
      area = trim(coalesce(p_area, '')),
      nombre = trim(p_nombres || ' ' || p_apellidos),
      perfil_completo = true,
      actualizado_en = now()
  where id = auth.uid()
  returning * into v_perfil;

  if v_perfil.id is null then
    raise exception 'No existe el perfil del usuario';
  end if;

  return v_perfil;
end;
$$;

revoke all on function public.guardar_mi_perfil_supervisor(
  text,
  text,
  text,
  text,
  text
) from public;

grant execute on function public.guardar_mi_perfil_supervisor(
  text,
  text,
  text,
  text,
  text
) to authenticated;

-- Los datos personales se actualizan mediante la función segura.
revoke update on public.perfiles from authenticated;

-- =====================================================
-- 2. NUMERACIÓN DE LAS DOS JORNADAS
-- =====================================================

alter table public.asistencias_almacen
add column if not exists numero_jornada smallint;

-- Detener la migración si existen más de dos registros
-- para una misma persona, fecha y turno.
do $$
begin
  if exists (
    select 1
    from public.asistencias_almacen
    group by almacen_id, fecha, dni, turno_id
    having count(*) > 2
  ) then
    raise exception
      'Hay trabajadores con más de dos registros en la misma fecha y turno.';
  end if;
end
$$;

-- Asignar jornada 1 al primer registro y jornada 2 al segundo.
with registros_ordenados as (
  select
    almacen_id,
    id,
    row_number() over (
      partition by almacen_id, fecha, dni, turno_id
      order by entrada nulls last, actualizado_en, id
    )::smallint as nueva_jornada
  from public.asistencias_almacen
)
update public.asistencias_almacen as asistencia
set numero_jornada = orden.nueva_jornada
from registros_ordenados as orden
where asistencia.almacen_id = orden.almacen_id
  and asistencia.id = orden.id;

alter table public.asistencias_almacen
alter column numero_jornada set default 1;

alter table public.asistencias_almacen
alter column numero_jornada set not null;

alter table public.asistencias_almacen
drop constraint if exists asistencias_numero_jornada_valido;

alter table public.asistencias_almacen
add constraint asistencias_numero_jornada_valido
check (numero_jornada between 1 and 2);

-- =====================================================
-- 3. PROTECCIÓN CONTRA REGISTROS DUPLICADOS
-- =====================================================

drop index if exists public.uq_asistencia_jornada_persona;

create unique index uq_asistencia_jornada_persona
on public.asistencias_almacen (
  almacen_id,
  fecha,
  dni,
  turno_id,
  numero_jornada
);

-- =====================================================
-- 4. SEGURIDAD RLS PARA TRABAJADORES
-- =====================================================

do $$
begin
  if to_regclass('public.trabajadores') is not null then

    execute '
      alter table public.trabajadores
      enable row level security
    ';

    execute '
      drop policy if exists
      "leer trabajadores del almacen"
      on public.trabajadores
    ';

    execute '
      create policy "leer trabajadores del almacen"
      on public.trabajadores
      for select
      to authenticated
      using (
        public.tiene_acceso_almacen(almacen_id)
      )
    ';

    execute '
      drop policy if exists
      "editar trabajadores del almacen"
      on public.trabajadores
    ';

    execute '
      create policy "editar trabajadores del almacen"
      on public.trabajadores
      for all
      to authenticated
      using (
        public.puede_editar_almacen(almacen_id)
      )
      with check (
        public.puede_editar_almacen(almacen_id)
      )
    ';

    execute '
      revoke all
      on public.trabajadores
      from anon
    ';

    execute '
      grant select, insert, update, delete
      on public.trabajadores
      to authenticated
    ';

  end if;
end
$$;

-- =====================================================
-- 5. RESULTADO
-- =====================================================

select
  'SEGURIDAD_Y_PERFILES_OK' as resultado,
  (
    select count(*)
    from public.asistencias_almacen
  ) as asistencias_conservadas,
  (
    select count(*)
    from public.perfiles
  ) as perfiles_conservados;
