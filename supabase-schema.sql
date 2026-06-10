-- Execute no Supabase SQL Editor

create type perfil_tipo as enum ('diretor', 'gerente_contrato', 'gerente_obra', 'engenheiro', 'mestre');

create table usuarios (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  perfil perfil_tipo not null default 'gerente_obra',
  avatar_iniciais text not null default 'AW',
  created_at timestamptz default now()
);

create table obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'Outro',
  local text,
  pct_avanco integer default 0,
  data_inicio date,
  data_entrega date,
  status text default 'ok',
  created_at timestamptz default now()
);

create table usuarios_obras (
  usuario_id uuid references usuarios on delete cascade,
  obra_id uuid references obras on delete cascade,
  primary key (usuario_id, obra_id)
);

alter table usuarios enable row level security;
alter table obras enable row level security;

create policy "usuario_proprio" on usuarios for all using (auth.uid() = id);
create policy "obras_acesso" on obras for select using (
  id in (select obra_id from usuarios_obras where usuario_id = auth.uid())
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into usuarios (id, nome, email, avatar_iniciais)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    upper(left(coalesce(new.raw_user_meta_data->>'nome', new.email), 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
