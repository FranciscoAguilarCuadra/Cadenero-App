create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    nombre text,
    rol text not null default 'cadenero' check (rol in ('admin', 'cadenero')),
    activo boolean not null default false,
    fecha_creacion timestamptz not null default now(),
    fecha_actualizacion timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and activo = true
    );
$$;

create or replace function public.usuario_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and activo = true
          and rol = 'admin'
    );
$$;

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, nombre)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'nombre', new.email)
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists crear_perfil_usuario on auth.users;

create trigger crear_perfil_usuario
after insert on auth.users
for each row execute function public.crear_perfil_usuario();

insert into public.profiles (id, email, nombre)
select
    id,
    email,
    coalesce(raw_user_meta_data->>'nombre', email)
from auth.users
on conflict (id) do nothing;

drop policy if exists "Los usuarios activos pueden leer su perfil" on public.profiles;
drop policy if exists "Los admins pueden leer perfiles" on public.profiles;
drop policy if exists "Los admins pueden actualizar perfiles" on public.profiles;

create policy "Los usuarios activos pueden leer su perfil"
on public.profiles
for select
using (id = auth.uid());

create policy "Los admins pueden leer perfiles"
on public.profiles
for select
using (public.usuario_admin());

create policy "Los admins pueden actualizar perfiles"
on public.profiles
for update
using (public.usuario_admin())
with check (public.usuario_admin());

create table if not exists public.prestamos (
    id text primary key,
    dias integer not null,
    pago text not null,
    observaciones text default '',
    foto_vehiculo text default '',
    foto_garantia text default '',
    estado text not null default 'Activo',
    usuario_id uuid references public.profiles(id),
    fecha_ingreso timestamptz not null default now(),
    fecha_devolucion timestamptz,
    fecha_actualizacion timestamptz not null default now()
);

alter table public.prestamos add column if not exists usuario_id uuid references public.profiles(id);
alter table public.prestamos enable row level security;

drop policy if exists "Permitir lectura publica de prestamos" on public.prestamos;
drop policy if exists "Permitir creacion publica de prestamos" on public.prestamos;
drop policy if exists "Permitir edicion publica de prestamos" on public.prestamos;
drop policy if exists "Usuarios activos pueden leer prestamos" on public.prestamos;
drop policy if exists "Usuarios activos pueden crear prestamos" on public.prestamos;
drop policy if exists "Usuarios activos pueden editar prestamos" on public.prestamos;
drop policy if exists "Usuarios activos pueden eliminar prestamos" on public.prestamos;

create policy "Usuarios activos pueden leer prestamos"
on public.prestamos
for select
using (
    public.usuario_admin()
    or (public.usuario_activo() and usuario_id = auth.uid())
);

create policy "Usuarios activos pueden crear prestamos"
on public.prestamos
for insert
with check (
    public.usuario_activo()
    and usuario_id = auth.uid()
);

create policy "Usuarios activos pueden editar prestamos"
on public.prestamos
for update
using (
    public.usuario_admin()
    or (public.usuario_activo() and usuario_id = auth.uid())
)
with check (
    public.usuario_admin()
    or (public.usuario_activo() and usuario_id = auth.uid())
);

create policy "Usuarios activos pueden eliminar prestamos"
on public.prestamos
for delete
using (
    public.usuario_admin()
    or (public.usuario_activo() and usuario_id = auth.uid())
);

insert into storage.buckets (id, name, public)
values ('prestamos', 'prestamos', true)
on conflict (id) do update set public = true;

drop policy if exists "Permitir lectura publica de fotos" on storage.objects;
drop policy if exists "Permitir subida publica de fotos" on storage.objects;
drop policy if exists "Usuarios activos pueden leer fotos" on storage.objects;
drop policy if exists "Usuarios activos pueden subir fotos" on storage.objects;
drop policy if exists "Usuarios activos pueden actualizar fotos" on storage.objects;
drop policy if exists "Usuarios activos pueden eliminar fotos" on storage.objects;

create policy "Usuarios activos pueden leer fotos"
on storage.objects
for select
using (bucket_id = 'prestamos' and public.usuario_activo());

create policy "Usuarios activos pueden subir fotos"
on storage.objects
for insert
with check (bucket_id = 'prestamos' and public.usuario_activo());

create policy "Usuarios activos pueden actualizar fotos"
on storage.objects
for update
using (bucket_id = 'prestamos' and public.usuario_activo())
with check (bucket_id = 'prestamos' and public.usuario_activo());

create policy "Usuarios activos pueden eliminar fotos"
on storage.objects
for delete
using (bucket_id = 'prestamos' and public.usuario_activo());

-- Después de crear una cuenta en Authentication > Users,
-- actívala manualmente con una consulta como esta:
--
-- update public.profiles
-- set activo = true,
--     rol = 'cadenero',
--     nombre = 'Nombre Apellido'
-- where email = 'correo@ejemplo.cl';
--
-- Para el primer administrador:
--
-- update public.profiles
-- set activo = true,
--     rol = 'admin',
--     nombre = 'Administrador'
-- where email = 'admin@ejemplo.cl';
--
-- Si tienes préstamos antiguos sin usuario asignado, puedes asignarlos
-- manualmente a una cuenta específica con:
--
-- update public.prestamos
-- set usuario_id = (
--     select id
--     from public.profiles
--     where email = 'correo@ejemplo.cl'
-- )
-- where usuario_id is null;
