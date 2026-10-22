# elingne 갠홈

운영 주소: https://elingne-home.ielingkk.workers.dev/

이 저장소는 갠홈 전용입니다. 캘린더 프로젝트 파일을 업로드하지 마세요.

- `public/`: 갠홈 화면. 메인 코드는 `public/app.js`입니다.
- `src/`: 갠홈 서버와 인증 처리
- `wrangler.jsonc`: `elingne-home` 배포 설정
- 루트 HTML 4개: 기존 GitHub Pages 주소를 운영 갠홈으로 연결

## 배포

Node.js가 설치된 컴퓨터에서 `deploy.cmd`를 실행하세요. 갠홈 전용 코드와 화면 요소를 검사한 뒤에만 배포합니다. 검사 실패 시 배포를 중단합니다. 데이터베이스와 이미지 저장소를 초기화하거나 가져오지 않습니다.

수동 확인: `node scripts/check-home.mjs`

GitHub에 올리면 Actions에서도 같은 검사와 배포 사전 검사를 실행합니다. GitHub 업로드 자체를 차단하는 검사는 아니므로 실패한 실행을 확인하고 수정하세요. 이 워크플로는 운영 배포를 실행하지 않습니다. `wrangler.jsonc`의 빌드 단계에도 검사를 연결했으므로 일반 Wrangler 배포와 이를 사용하는 자동 배포에서도 검사 실패 시 배포가 중단됩니다.

캘린더의 `app.js`, `style.css`, `index.html`을 이 저장소에 복사하지 마세요. 비밀값과 데이터 백업도 올리지 마세요.
