alter table public.prestamos
add column if not exists danio_previo boolean not null default false;
