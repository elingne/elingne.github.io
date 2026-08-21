-- v6 migration
-- 여러 이미지 구조와 기존 gallery 테이블의 호환 문제 해결

-- 기존 gallery.image_url은 예전 단일이미지 방식에서 필수였지만,
-- 이제 이미지는 post_images 테이블에 여러 장 저장하므로 NULL 허용
alter table public.gallery
alter column image_url drop not null;
