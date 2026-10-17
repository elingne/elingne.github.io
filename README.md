# elingne home

운영 사이트: https://elingne-home.ielingkk.workers.dev/

Cloudflare Workers, D1, 비공개 R2를 사용합니다. 관리자 로그인은 Cloudflare Access 이메일 인증입니다.

- `public/`: 사이트 화면과 이미지, 스타일
- `src/`: 서버 API 및 인증·잠금 처리
- `wrangler.jsonc`: Cloudflare 배포 설정
- `deploy.cmd`: 배포 실행 파일
- 루트 HTML 4개: 기존 GitHub Pages 링크를 운영 사이트로 연결

수정 후 `deploy.cmd`를 실행하면 Cloudflare에 배포됩니다. GitHub 커밋만으로 Workers가 자동 배포되지는 않습니다.
기존 Worker의 비밀값은 유지하며, 데이터 초기화나 재가져오기는 실행하지 않습니다.
비밀값과 데이터 백업은 저장소에 올리지 않습니다.

Supabase API와 인증은 사용하지 않습니다. 기존 이미지 주소를 해석하기 위한 원본 호스트 문자열만 남아 있습니다.
파일 삭제 시 R2의 실제 파일은 보관하며, 연결이 끊긴 파일의 일반 방문자 접근을 차단합니다.
