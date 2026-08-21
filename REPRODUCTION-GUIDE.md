# elingne archive — SPA v11 재현 가이드

## 핵심 변경
사이트의 MAIN / CHARACTER / PAIR / ADMIN 화면을 `index.html` 하나의 SPA 셸 안에서 전환하도록 재구성했습니다. 화면 전환 시 `#spa-view` 내부만 교체되고, 좌측의 YouTube BGM 패널과 iframe은 DOM에서 제거되지 않습니다. 따라서 사이트 내부 화면을 이동해도 음악이 끊기거나 처음부터 다시 로드되지 않습니다.

## 주소
- 메인: `index.html#/`
- 캐릭터 목록: `index.html#/characters`
- 페어 목록: `index.html#/pairs`
- 캐릭터 상세: `index.html#/character/캐릭터ID`
- 페어 상세: `index.html#/pair/페어ID`
- 관리자: `index.html#/admin`

기존 `character.html?id=...`, `pair.html?id=...`, `admin.html` 주소도 호환용 파일이 SPA 주소로 자동 이동시킵니다.

## GitHub에 올릴 때
ZIP 안 파일을 저장소 루트에 그대로 업로드해 기존 파일을 덮어씁니다. `spa-v11.js`는 새 파일이므로 반드시 추가합니다. 기존 `app-v7.js`는 삭제해도 됩니다.

## Supabase
기존 v10에서 BGM과 사이트 데이터가 정상 동작하고 있었다면 새로운 SQL 실행은 필요하지 않습니다. 기존 테이블/Storage/Auth 설정을 그대로 사용합니다.

## 자동재생 제한
SPA로 바뀌어 페이지 이동 중 BGM은 끊기지 않지만, 최초 사이트 접속 시 소리 자동재생은 브라우저 정책에 의해 막힐 수 있습니다. 그 경우 방문자가 재생 버튼을 한 번 누르면 이후 SPA 내부 이동 중에는 계속 유지됩니다.
