-- v5 migration
-- 1) MAIN 편집용 설정 테이블
create table if not exists public.site_settings (
  id integer primary key,
  title text,
  intro_text text,
  profile_image_url text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read site settings" on public.site_settings;
drop policy if exists "Admin manages site settings" on public.site_settings;

create policy "Anyone can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

-- 2) PAIR 안에서 독립적으로 작성하는 프로필
create table if not exists public.pair_profiles (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  name text not null,
  profile_text text,
  image_url text,
  sort_order integer not null default 0 check (sort_order between 0 and 7),
  created_at timestamptz not null default now(),
  unique(pair_id, sort_order)
);

alter table public.pair_profiles enable row level security;

drop policy if exists "Anyone can read pair profiles" on public.pair_profiles;
drop policy if exists "Admin manages pair profiles" on public.pair_profiles;

create policy "Anyone can read pair profiles"
on public.pair_profiles
for select
to anon, authenticated
using (true);

-- 아래 ADMIN_UID를 기존 관리자 UID로 모두 변경하세요.
create policy "Admin manages site settings"
on public.site_settings
for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');

create policy "Admin manages pair profiles"
on public.pair_profiles
for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');

insert into public.site_settings (id, title, intro_text)
values (1, 'MAIN', '자캐와 커뮤니티 활동을 정리하는 개인 홈페이지입니다.')
on conflict (id) do nothing;
