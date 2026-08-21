-- v7 migration: MAIN YouTube BGM playlist
-- 아래 ADMIN_UID를 기존 관리자 UID로 바꾼 후 Supabase SQL Editor에서 한 번 실행하세요.

create table if not exists public.bgm_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text not null,
  video_id text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bgm_tracks enable row level security;

drop policy if exists "Anyone can read bgm tracks" on public.bgm_tracks;
drop policy if exists "Admin manages bgm tracks" on public.bgm_tracks;

create policy "Anyone can read bgm tracks"
on public.bgm_tracks
for select
to anon, authenticated
using (true);

create policy "Admin manages bgm tracks"
on public.bgm_tracks
for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');
