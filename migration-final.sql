-- FINAL MIGRATION
-- v3 + v4 통합
-- 아래 ADMIN_UID를 기존 관리자 UID로 모두 바꾼 후 한 번만 실행하세요.

-- v3 migration
-- PROFILE / LOG / GALLERY 게시물에 여러 이미지와 이미지별 캡션 지원

-- 1) PROFILE 게시물에도 제목을 선택적으로 저장
alter table public.profile_blocks
add column if not exists title text;

-- 2) GALLERY도 텍스트 게시물로 사용할 수 있도록 제목/본문 추가
alter table public.gallery
add column if not exists title text;

alter table public.gallery
add column if not exists body text;

-- 기존 gallery.image_url은 과거 데이터 호환용으로 그대로 유지

-- 3) 세 영역의 게시물 이미지들을 공통으로 저장하는 테이블
create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  section text not null check (section in ('profile','log','gallery')),
  post_id uuid not null,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.post_images enable row level security;

drop policy if exists "Anyone can read post images" on public.post_images;
drop policy if exists "Admin manages post images" on public.post_images;

create policy "Anyone can read post images"
on public.post_images
for select
to anon, authenticated
using (true);

-- 아래 ADMIN_UID를 기존 관리자 UID로 바꾼 후 실행하세요.
create policy "Admin manages post images"
on public.post_images
for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');


-- v4 migration
-- MAIN / CHARACTER / PAIR 대분류 추가를 위한 PAIR 데이터 구조

create table if not exists public.pairs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text,
  relationship_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.pair_members (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  profile_text text,
  sort_order integer not null default 0 check (sort_order between 0 and 3),
  created_at timestamptz not null default now(),
  unique(pair_id, character_id),
  unique(pair_id, sort_order)
);

create table if not exists public.pair_posts (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  section text not null check (section in ('log','gallery')),
  title text,
  body text,
  created_at timestamptz not null default now()
);

create table if not exists public.pair_post_images (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references public.pairs(id) on delete cascade,
  post_id uuid not null references public.pair_posts(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pairs enable row level security;
alter table public.pair_members enable row level security;
alter table public.pair_posts enable row level security;
alter table public.pair_post_images enable row level security;

drop policy if exists "Anyone can read pairs" on public.pairs;
drop policy if exists "Anyone can read pair members" on public.pair_members;
drop policy if exists "Anyone can read pair posts" on public.pair_posts;
drop policy if exists "Anyone can read pair post images" on public.pair_post_images;

drop policy if exists "Admin manages pairs" on public.pairs;
drop policy if exists "Admin manages pair members" on public.pair_members;
drop policy if exists "Admin manages pair posts" on public.pair_posts;
drop policy if exists "Admin manages pair post images" on public.pair_post_images;

create policy "Anyone can read pairs"
on public.pairs for select
to anon, authenticated
using (true);

create policy "Anyone can read pair members"
on public.pair_members for select
to anon, authenticated
using (true);

create policy "Anyone can read pair posts"
on public.pair_posts for select
to anon, authenticated
using (true);

create policy "Anyone can read pair post images"
on public.pair_post_images for select
to anon, authenticated
using (true);

-- 아래 ADMIN_UID를 기존 관리자 UID로 바꿔서 실행하세요.
create policy "Admin manages pairs"
on public.pairs for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');

create policy "Admin manages pair members"
on public.pair_members for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');

create policy "Admin manages pair posts"
on public.pair_posts for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');

create policy "Admin manages pair post images"
on public.pair_post_images for all
to authenticated
using (auth.uid() = 'ADMIN_UID')
with check (auth.uid() = 'ADMIN_UID');
