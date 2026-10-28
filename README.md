# elingne 갠홈

운영 주소: https://elingne-home.ielingkk.workers.dev/

이 저장소는 갠홈 전용입니다. 캘린더 프로젝트 파일을 업로드하지 마세요.

- `public/`: 갠홈 화면. 메인 코드는 `public/app.js`입니다.
- `src/`: 갠홈 서버와 인증 처리
- `wrangler.jsonc`: `elingne-home` 배포 설정
- 루트 HTML 4개: 기존 GitHub Pages 주소를 운영 갠홈으로 연결

## 배포

이 저장소의 `main` 브랜치는 Cloudflare Workers Builds와 연결되어 있어서, `main`에 올리면 운영 사이트가 자동으로 빌드·배포됩니다. GitHub 업로드와 운영 배포가 한 번에 일어나므로 올리기 전에 `node scripts/check-home.mjs`로 먼저 검사하세요. `wrangler.jsonc`의 빌드 단계에도 같은 검사가 연결되어 있어, 검사에 실패하면 배포가 중단됩니다.

수동으로 배포해야 하면 Node.js가 설치된 컴퓨터에서 `deploy.cmd`를 실행하세요. 갠홈 전용 코드와 화면 요소를 검사한 뒤에만 배포하며, 검사 실패 시 중단합니다. 어느 방법으로 배포해도 데이터베이스와 이미지 저장소를 초기화하거나 가져오지 않습니다.

수동 확인: `node scripts/check-home.mjs`

GitHub Actions(`check-home.yml`)도 같은 검사와 배포 사전 검사(`--dry-run`)를 실행하지만 운영 배포는 하지 않습니다. GitHub 업로드 자체를 차단하는 검사는 아니므로 실패한 실행을 확인하고 수정하세요.

## 데이터 보존

- 캐릭터, 페어, 페어 게시물을 삭제하면 그에 딸린 DB 기록(게시물, 이미지 연결 등)도 함께 삭제됩니다.
- 삭제하거나 교체한 이미지·첨부 파일은 복구를 위해 R2에서 지우지 않습니다.
- 잠기지 않은 게시물의 파일은 방문자 브라우저에 5분간 임시 저장될 수 있습니다. 잠긴 게시물의 파일은 저장되지 않습니다.

캘린더의 `app.js`, `style.css`, `index.html`을 이 저장소에 복사하지 마세요. 비밀값과 데이터 백업도 올리지 마세요.
