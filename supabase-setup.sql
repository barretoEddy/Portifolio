-- =============================================
-- SETUP INICIAL DO BANCO DE DADOS SUPABASE
-- Execute estes comandos no SQL Editor do Supabase
-- =============================================

-- 1. CRIAR TABELA DE PERFIS (estende auth.users)
-- Esta tabela armazena informações adicionais dos usuários
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company text,
  role text default 'user' check (role in ('admin', 'user')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CRIAR TABELA DE MENSAGENS DE CONTATO
-- Esta tabela substitui o localStorage para mensagens
create table public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  message text not null,
  project_type text,
  budget text,
  deadline date,
  status text default 'new' check (status in ('new', 'read', 'replied')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- Habilitar RLS nas tabelas
alter table public.profiles enable row level security;
alter table public.contact_messages enable row level security;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA

-- Política para perfis: usuários podem ver e editar seu próprio perfil
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Política para perfis: admins podem ver todos os perfis
create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Política para mensagens: usuários podem criar suas próprias mensagens
create policy "Users can create own messages" on public.contact_messages
  for insert with check (auth.uid() = user_id);

create policy "Users can view own messages" on public.contact_messages
  for select using (auth.uid() = user_id);

-- Política para mensagens: admins podem ver e gerenciar todas as mensagens
create policy "Admins can view all messages" on public.contact_messages
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all messages" on public.contact_messages
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete all messages" on public.contact_messages
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. CRIAR FUNÇÃO PARA ATUALIZAR UPDATED_AT AUTOMATICAMENTE
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 6. CRIAR TRIGGERS PARA UPDATED_AT
create trigger handle_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.contact_messages
  for each row execute function public.handle_updated_at();

-- 7. CRIAR FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- Esta função é executada sempre que um novo usuário se cadastra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- 8. CRIAR TRIGGER PARA CRIAÇÃO AUTOMÁTICA DE PERFIL
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 9. CRIAR USUÁRIO ADMIN PADRÃO (OPCIONAL)
-- Substitua 'admin@eduardobarreto.dev' pelo email que você quer como admin
-- ATENÇÃO: Execute apenas DEPOIS de criar um usuário com este email via interface
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users
--   WHERE email = 'admin@eduardobarreto.dev'
-- );

-- 10. CRIAR ÍNDICES PARA PERFORMANCE
create index profiles_role_idx on public.profiles(role);
create index contact_messages_user_id_idx on public.contact_messages(user_id);
create index contact_messages_status_idx on public.contact_messages(status);
create index contact_messages_created_at_idx on public.contact_messages(created_at desc);

-- =============================================
-- FIM DO SETUP - EXECUTE TUDO DE UMA VEZ
-- =============================================
