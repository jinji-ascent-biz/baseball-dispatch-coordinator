create table if not exists public.dispatch_board_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.dispatch_board_state enable row level security;

drop policy if exists "dispatch_board_state_public_read" on public.dispatch_board_state;
create policy "dispatch_board_state_public_read"
  on public.dispatch_board_state
  for select
  using (true);

drop policy if exists "dispatch_board_state_public_insert" on public.dispatch_board_state;
create policy "dispatch_board_state_public_insert"
  on public.dispatch_board_state
  for insert
  with check (id = 'default');

drop policy if exists "dispatch_board_state_public_update" on public.dispatch_board_state;
create policy "dispatch_board_state_public_update"
  on public.dispatch_board_state
  for update
  using (id = 'default')
  with check (id = 'default');

insert into public.dispatch_board_state (id, state)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
