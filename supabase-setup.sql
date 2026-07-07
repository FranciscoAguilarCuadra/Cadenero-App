create table if not exists public.prestamos (
    id text primary key,
    dias integer not null,
    pago text not null,
    observaciones text default '',
    foto_vehiculo text default '',
    foto_garantia text default '',
    estado text not null default 'Activo',
    fecha_ingreso timestamptz not null default now(),
    fecha_devolucion timestamptz,
    fecha_actualizacion timestamptz not null default now()
);

alter table public.prestamos enable row level security;

drop policy if exists "Permitir lectura publica de prestamos" on public.prestamos;
drop policy if exists "Permitir creacion publica de prestamos" on public.prestamos;
drop policy if exists "Permitir edicion publica de prestamos" on public.prestamos;

create policy "Permitir lectura publica de prestamos"
on public.prestamos
for select
using (true);

create policy "Permitir creacion publica de prestamos"
on public.prestamos
for insert
with check (true);

create policy "Permitir edicion publica de prestamos"
on public.prestamos
for update
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('prestamos', 'prestamos', true)
on conflict (id) do update set public = true;

drop policy if exists "Permitir lectura publica de fotos" on storage.objects;
drop policy if exists "Permitir subida publica de fotos" on storage.objects;

create policy "Permitir lectura publica de fotos"
on storage.objects
for select
using (bucket_id = 'prestamos');

create policy "Permitir subida publica de fotos"
on storage.objects
for insert
with check (bucket_id = 'prestamos');
