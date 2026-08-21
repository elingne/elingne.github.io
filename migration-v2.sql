-- v2 migration: 프로필에 텍스트/이미지 블록을 섞어 넣기 위한 테이블
create table if not exists public.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  block_type text not null default 'text' check (block_type in ('text','image')),
  body text,
  image_url text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profile_blocks enable row level security;

drop policy if exists "Anyone can read profile blocks" on public.profile_blocks;
drop policy if exists "Admin manages profile blocks" on public.profile_blocks;

create policy "Anyone can read profile blocks"
on public.profile_blocks
for select
to anon, authenticated
using (true);

-- 아래 ADMIN_UID를 현재 관리자 UID로 바꿔서 실행하세요.
create policy "Admin manages profile blocks"
on public.profile_blocks
for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');
