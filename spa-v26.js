// v16: SPA router + single-flight pair creation. The BGM player remains outside #spa-view. The BGM player lives outside #spa-view and is never replaced.
const SPA_TEMPLATES = {"main": "<main>\n      <section class=\"hero hero-profile\">\n        <div id=\"main-profile-image\" class=\"main-profile-image\"></div>\n        <div class=\"main-profile-copy\">\n          <p class=\"eyebrow\">ORIGINAL CHARACTER ARCHIVE</p>\n          <h1 id=\"main-title\">MAIN</h1>\n          <p id=\"main-text\">자캐와 커뮤니티 활동을 정리하는 개인 홈페이지입니다.</p>\n          <button id=\"edit-main-btn\" class=\"ghost owner-only hidden\">메인 수정</button>\n        </div>\n      </section>\n\n      <section id=\"characters\" class=\"section\">\n        <div class=\"section-heading pair-heading-row\">\n          <div>\n            <p class=\"eyebrow\">ARCHIVE</p>\n            <h2>CHARACTER</h2>\n          </div>\n          <button id=\"new-character-btn\" class=\"owner-only hidden\">+ 새 캐릭터</button>\n        </div>\n        <div id=\"character-grid\" class=\"character-grid\">\n          <p class=\"muted\">캐릭터를 불러오는 중...</p>\n        </div>\n      </section>\n\n      <section id=\"pairs\" class=\"section\">\n        <div class=\"section-heading pair-heading-row\">\n          <div>\n            <p class=\"eyebrow\">RELATIONSHIP ARCHIVE</p>\n            <h2>PAIR</h2>\n          </div>\n          <button id=\"new-pair-btn\" class=\"owner-only hidden\" type=\"button\">+ 새 페어</button>\n        </div>\n        <div id=\"pair-grid\" class=\"character-grid\">\n          <p class=\"muted\">페어를 불러오는 중...</p>\n        </div>\n      </section>\n    </main>\n<dialog id=\"main-dialog\" class=\"editor-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2>메인 수정</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n      <label>사이트 제목\n        <input id=\"main-edit-title\" type=\"text\">\n      </label>\n      <label>소개 문구\n        <textarea id=\"main-edit-text\" rows=\"6\"></textarea>\n      </label>\n      <label>프로필 사진\n        <input id=\"main-edit-image\" type=\"file\" accept=\"image/*\">\n      </label>\n      <button id=\"save-main-btn\" type=\"button\">저장</button>\n      <p id=\"main-edit-msg\" class=\"status\"></p>\n    </form>\n  </dialog>", "character": "<main class=\"character-page\">\n    <section id=\"character-head\" class=\"character-head\">\n      <p class=\"muted\">캐릭터를 불러오는 중...</p>\n    </section>\n\n    <div id=\"owner-character-tools\" class=\"owner-tools hidden\">\n      <button id=\"edit-character-btn\" class=\"ghost\">캐릭터 기본정보 수정</button>\n      <button id=\"delete-character-btn\" class=\"ghost danger\">캐릭터 삭제</button>\n    </div>\n\n    <div class=\"tabs\">\n      <button class=\"tab active\" data-tab=\"profile\">PROFILE</button>\n      <button class=\"tab\" data-tab=\"log\">LOG</button>\n      <button class=\"tab\" data-tab=\"gallery\">GALLERY</button>\n    </div>\n\n    <section id=\"profile\" class=\"tab-panel active\">\n      <div class=\"panel-head\">\n        <h2>PROFILE</h2>\n        <button class=\"owner-only hidden\" data-open-editor=\"profile\">+ 프로필 게시물</button>\n      </div>\n      <div id=\"profile-feed\" class=\"feed\"></div>\n    </section>\n\n    <section id=\"log\" class=\"tab-panel\">\n      <div class=\"panel-head\">\n        <h2>LOG</h2>\n        <button class=\"owner-only hidden\" data-open-editor=\"log\">+ 로그 게시물</button>\n      </div>\n      <div id=\"log-feed\" class=\"feed\"></div>\n    </section>\n\n    <section id=\"gallery\" class=\"tab-panel\">\n      <div class=\"panel-head\">\n        <h2>GALLERY</h2>\n        <button class=\"owner-only hidden\" data-open-editor=\"gallery\">+ 갤러리 게시물</button>\n      </div>\n      <div id=\"gallery-feed\" class=\"feed\"></div>\n    </section>\n  </main>\n\n  <dialog id=\"editor-dialog\" class=\"editor-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2 id=\"editor-title\">게시물 편집</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n\n      <input id=\"edit-kind\" type=\"hidden\">\n      <input id=\"edit-id\" type=\"hidden\">\n\n      <label id=\"title-wrap\">제목\n        <input id=\"edit-title\" type=\"text\" placeholder=\"선택사항\">\n      </label>\n\n      <label>내용\n        <textarea id=\"edit-body\" rows=\"10\" placeholder=\"텍스트 없이 사진만 올려도 됩니다.\"></textarea>\n      </label>\n\n      <label id=\"sort-wrap\" class=\"hidden\">프로필 표시 순서\n        <input id=\"edit-sort\" type=\"number\" value=\"0\">\n      </label>\n\n      <div class=\"multi-image-box\">\n        <div class=\"subhead\">\n          <strong>이미지</strong>\n          <span class=\"muted\">여러 장 선택 후 드래그로 순서를 바꿀 수 있습니다</span>\n        </div>\n        <input id=\"edit-image-picker\" class=\"hidden-file-input\" type=\"file\" accept=\"image/*\" multiple>\n        <button id=\"add-image-btn\" type=\"button\" class=\"ghost\">+ 이미지 추가</button>\n        <div id=\"new-image-caption-list\" class=\"image-edit-list\"></div>\n      </div>\n\n      <div id=\"existing-images-wrap\" class=\"multi-image-box hidden\">\n        <div class=\"subhead\">\n          <strong>이미지 순서</strong>\n          <span class=\"muted\">기존 사진과 새 사진을 섞어서 드래그할 수 있습니다</span>\n        </div>\n        <div id=\"existing-image-list\" class=\"image-edit-list\"></div>\n      </div>\n\n      <div id=\"attachment-editor-wrap\" class=\"attachment-editor multi-image-box hidden\">\n        <div class=\"subhead\">\n          <strong>첨부파일</strong>\n          <span class=\"muted\">음원 · PDF · ZIP 등 다양한 파일을 첨부할 수 있습니다</span>\n        </div>\n        <input id=\"edit-attachment-picker\" class=\"hidden-file-input\" type=\"file\" multiple>\n        <button id=\"add-attachment-btn\" type=\"button\" class=\"ghost\">+ 파일 추가</button>\n        <div id=\"attachment-edit-list\" class=\"attachment-edit-list\"></div>\n      </div>\n\n      <div class=\"button-row\">\n        <button id=\"save-editor-btn\" value=\"cancel\" type=\"button\">저장</button>\n        <button id=\"delete-editor-btn\" value=\"cancel\" type=\"button\" class=\"danger hidden\">게시물 삭제</button>\n      </div>\n      <p id=\"editor-msg\" class=\"status\"></p>\n    </form>\n  </dialog>\n\n  <dialog id=\"character-dialog\" class=\"editor-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2>캐릭터 기본정보 수정</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n      <label>이름\n        <input id=\"char-name\" type=\"text\">\n      </label>\n      <label>한 줄 설명\n        <input id=\"char-summary\" type=\"text\">\n      </label>\n      <label>성격 해시태그\n        <input id=\"char-hashtags\" type=\"text\" placeholder=\"#호기심많은 #다정한\">\n        <span class=\"field-help\">띄어쓰기 또는 쉼표로 구분해 입력하세요.</span>\n      </label>\n      <label>대표 이미지 교체\n        <input id=\"char-image\" type=\"file\" accept=\"image/*\">\n      </label>\n      <button id=\"save-character-btn\" value=\"cancel\" type=\"button\">저장</button>\n      <p id=\"char-msg\" class=\"status\"></p>\n    </form>\n  </dialog>\n\n\n  <dialog id=\"post-view-dialog\" class=\"post-view-dialog\">\n    <div class=\"post-view-shell\">\n      <div class=\"post-view-top\">\n        <div>\n          <p id=\"post-view-kind\" class=\"eyebrow\"></p>\n          <h2 id=\"post-view-title\"></h2>\n        </div>\n        <div class=\"post-view-actions\">\n          <div id=\"post-view-owner-tools\" class=\"post-view-owner-tools hidden\">\n            <button id=\"post-view-edit-btn\" type=\"button\">수정</button>\n          </div>\n          <button id=\"close-post-view\" class=\"ghost\" type=\"button\">닫기</button>\n        </div>\n      </div>\n      <p id=\"post-view-date\" class=\"post-date\"></p>\n      <div id=\"post-view-body\" class=\"post-body\"></div>\n      <div id=\"post-view-images\" class=\"post-view-images\"></div>\n      <div id=\"post-view-files\" class=\"post-view-files\"></div>\n    </div>\n  </dialog>", "pair": "<main class=\"character-page\">\n    <section class=\"pair-head\">\n      <p class=\"eyebrow\">PAIR</p>\n      <h1 id=\"pair-name\">PAIR</h1>\n      <p id=\"pair-summary\" class=\"muted\"></p>\n    </section>\n\n    <div id=\"owner-pair-tools\" class=\"owner-tools hidden\">\n      <button id=\"edit-pair-btn\" class=\"ghost\">페어 기본정보 수정</button>\n      <button id=\"delete-pair-btn\" class=\"ghost danger\">페어 삭제</button>\n    </div>\n\n    <div class=\"tabs\">\n      <button class=\"tab active\" data-tab=\"profile\">PROFILE</button>\n      <button class=\"tab\" data-tab=\"log\">LOG</button>\n      <button class=\"tab\" data-tab=\"gallery\">GALLERY</button>\n    </div>\n\n    <section id=\"profile\" class=\"tab-panel active\">\n      <div class=\"panel-head\">\n        <h2>PROFILE</h2>\n        <button id=\"edit-pair-profile-btn\" class=\"owner-only hidden\">프로필 편집</button>\n      </div>\n      <div id=\"pair-profile-grid\" class=\"pair-member-grid\"></div>\n      <article class=\"relationship-card\">\n        <p class=\"eyebrow\">RELATIONSHIP</p>\n        <h3>관계성</h3>\n        <div id=\"relationship-text\" class=\"post-body\"></div>\n      </article>\n    </section>\n\n    <section id=\"log\" class=\"tab-panel\">\n      <div class=\"panel-head\">\n        <h2>LOG</h2>\n        <button class=\"owner-only hidden\" data-open-post-editor=\"log\">+ 로그 게시물</button>\n      </div>\n      <div id=\"pair-log-feed\" class=\"feed\"></div>\n    </section>\n\n    <section id=\"gallery\" class=\"tab-panel\">\n      <div class=\"panel-head\">\n        <h2>GALLERY</h2>\n        <button class=\"owner-only hidden\" data-open-post-editor=\"gallery\">+ 갤러리 게시물</button>\n      </div>\n      <div id=\"pair-gallery-feed\" class=\"feed\"></div>\n    </section>\n  </main>\n\n  <dialog id=\"pair-dialog\" class=\"editor-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2>페어 기본정보</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n      <label>페어 이름\n        <input id=\"pair-edit-name\" type=\"text\">\n      </label>\n      <label>한 줄 설명\n        <input id=\"pair-edit-summary\" type=\"text\">\n      </label>\n      <button id=\"save-pair-btn\" type=\"button\">저장</button>\n      <p id=\"pair-edit-msg\" class=\"status\"></p>\n    </form>\n  </dialog>\n\n  <dialog id=\"profile-dialog\" class=\"editor-dialog wide-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2>PAIR PROFILE 편집</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n\n      <p class=\"muted\">기본 2명이며, + 인원 추가로 최대 8명까지 늘릴 수 있습니다.</p>\n      <div id=\"profile-editor-list\" class=\"member-editor-list\"></div>\n      <button id=\"add-profile-person-btn\" type=\"button\" class=\"ghost\">+ 인원 추가</button>\n\n      <label class=\"relationship-edit-label\">관계성 설명\n        <textarea id=\"relationship-edit\" rows=\"10\"></textarea>\n      </label>\n\n      <button id=\"save-profile-btn\" type=\"button\">프로필 저장</button>\n      <p id=\"profile-edit-msg\" class=\"status\"></p>\n    </form>\n  </dialog>\n\n  <dialog id=\"post-dialog\" class=\"editor-dialog\">\n    <form method=\"dialog\" class=\"editor-shell\">\n      <div class=\"editor-top\">\n        <h2 id=\"post-dialog-title\">게시물 편집</h2>\n        <button value=\"cancel\" class=\"ghost\">닫기</button>\n      </div>\n      <input id=\"post-kind\" type=\"hidden\">\n      <input id=\"post-id\" type=\"hidden\">\n      <label>제목\n        <input id=\"post-title\" type=\"text\" placeholder=\"선택사항\">\n      </label>\n      <label>내용\n        <textarea id=\"post-body\" rows=\"9\"></textarea>\n      </label>\n      <div class=\"multi-image-box\">\n        <div class=\"subhead\"><strong>이미지</strong><span class=\"muted\">여러 장 선택 후 드래그로 순서를 바꿀 수 있습니다</span></div>\n        <input id=\"post-image-picker\" class=\"hidden-file-input\" type=\"file\" accept=\"image/*\" multiple>\n        <button id=\"add-post-image-btn\" type=\"button\" class=\"ghost\">+ 이미지 추가</button>\n        <div id=\"post-new-caption-list\" class=\"image-edit-list\"></div>\n      </div>\n      <div id=\"post-existing-wrap\" class=\"multi-image-box hidden\">\n        <div class=\"subhead\"><strong>이미지 순서</strong><span class=\"muted\">기존 사진과 새 사진을 섞어서 드래그할 수 있습니다</span></div>\n        <div id=\"post-existing-list\" class=\"image-edit-list\"></div>\n      </div>\n      <div id=\"pair-attachment-editor-wrap\" class=\"attachment-editor multi-image-box hidden\">\n        <div class=\"subhead\"><strong>첨부파일</strong><span class=\"muted\">음원 · PDF · ZIP 등 다양한 파일을 첨부할 수 있습니다</span></div>\n        <input id=\"pair-attachment-picker\" class=\"hidden-file-input\" type=\"file\" multiple>\n        <button id=\"add-pair-attachment-btn\" type=\"button\" class=\"ghost\">+ 파일 추가</button>\n        <div id=\"pair-attachment-edit-list\" class=\"attachment-edit-list\"></div>\n      </div>\n      <div class=\"button-row\">\n        <button id=\"save-post-btn\" type=\"button\">저장</button>\n        <button id=\"delete-post-btn\" type=\"button\" class=\"danger hidden\">게시물 삭제</button>\n      </div>\n      <p id=\"post-edit-msg\" class=\"status\"></p>\n    </form>\n  </dialog>\n\n\n  <dialog id=\"pair-post-view-dialog\" class=\"pair-post-view-dialog\">\n    <div class=\"post-view-shell\">\n      <div class=\"post-view-top\">\n        <div>\n          <p id=\"post-view-kind\" class=\"eyebrow\"></p>\n          <h2 id=\"post-view-title\"></h2>\n        </div>\n        <div class=\"post-view-actions\">\n          <div id=\"post-view-owner-tools\" class=\"post-view-owner-tools hidden\">\n            <button id=\"pair-post-view-edit-btn\" type=\"button\">수정</button>\n          </div>\n          <button id=\"close-pair-post-view\" class=\"ghost\" type=\"button\">닫기</button>\n        </div>\n      </div>\n      <p id=\"post-view-date\" class=\"post-date\"></p>\n      <div id=\"post-view-body\" class=\"post-body\"></div>\n      <div id=\"post-view-images\" class=\"post-view-images\"></div>\n      <div id=\"post-view-files\" class=\"post-view-files\"></div>\n    </div>\n  </dialog>", "admin": "<main class=\"admin-wrap\">\n    <section id=\"login-box\" class=\"admin-card\">\n      <p class=\"eyebrow\">OWNER ONLY</p>\n      <h1>ADMIN LOGIN</h1>\n      <label>이메일\n        <input id=\"email\" type=\"email\" autocomplete=\"email\" />\n      </label>\n      <label>비밀번호\n        <input id=\"password\" type=\"password\" autocomplete=\"current-password\" />\n      </label>\n      <button id=\"login-btn\">로그인</button>\n      <p id=\"login-msg\" class=\"muted\"></p>\n    </section>\n\n    <section id=\"logged-box\" class=\"admin-card hidden\">\n      <p class=\"eyebrow\">OWNER MODE</p>\n      <h1>로그인됨</h1>\n      <p>편집은 각 캐릭터 페이지에서 바로 할 수 있습니다.</p>\n      <div class=\"button-row\">\n        <a class=\"button-link\" href=\"index.html#characters\">캐릭터 목록으로</a>\n        <button id=\"logout-btn\" class=\"ghost\">로그아웃</button>\n      </div>\n\n      <div class=\"bgm-admin-panel\">\n        <p class=\"eyebrow\">MAIN MUSIC</p>\n        <h2>BGM PLAYLIST</h2>\n        <p class=\"muted\">YouTube 링크로 곡을 추가하고, 곡을 드래그해서 재생 순서를 바꿀 수 있습니다.</p>\n\n        <div class=\"bgm-admin-add\">\n          <label>YouTube 링크\n            <input id=\"bgm-url\" type=\"url\" placeholder=\"https://www.youtube.com/watch?v=...\" />\n          </label>\n          <label>표시 제목 <span class=\"muted\">(선택)</span>\n            <input id=\"bgm-title\" type=\"text\" placeholder=\"비워두면 제목 자동 시도\" />\n          </label>\n          <button id=\"bgm-add-btn\" type=\"button\">+ 추가</button>\n        </div>\n        <p id=\"bgm-admin-msg\" class=\"status muted\"></p>\n        <div id=\"bgm-admin-list\" class=\"bgm-admin-list\"></div>\n      </div>\n    </section>\n  </main>"};
const spaView = document.getElementById("spa-view");
let spaRenderToken = 0;
let spaRenderQueue = Promise.resolve();

function queueSpaRender() {
  spaRenderQueue = spaRenderQueue.then(() => renderSpaRoute()).catch(error => {
    console.error("SPA render queue failed", error);
  });
  return spaRenderQueue;
}

function spaParseRoute() {
  const raw = (location.hash || "#/ ").replace(/^#/, "").trim() || "/";
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = path.split("/").filter(Boolean);
  if (!parts.length) return { view:"main", path:"/" };
  if (parts[0] === "characters") return { view:"main", path:"/characters", scroll:"characters" };
  if (parts[0] === "pairs") return { view:"main", path:"/pairs", scroll:"pairs" };
  if (parts[0] === "character" && parts[1]) return { view:"character", path, characterId:decodeURIComponent(parts.slice(1).join("/")) };
  if (parts[0] === "pair" && parts[1] === "new") return { view:"pair", path, pairNew:true, pairId:null };
  if (parts[0] === "pair" && parts[1]) return { view:"pair", path, pairId:decodeURIComponent(parts.slice(1).join("/")), pairNew:false };
  if (parts[0] === "admin") return { view:"admin", path:"/admin" };
  return { view:"main", path:"/" };
}

window.spaNavigate = function(path, replace=false) {
  const next = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (replace) history.replaceState(null, "", next);
  else if (location.hash === next) queueSpaRender();
  else location.hash = next;
};

function updateSpaHeader(route) {
  const links = document.querySelectorAll(".site-header nav a");
  links.forEach(a => a.classList.remove("active"));
  const admin = document.getElementById("auth-link");
  if (admin) { admin.textContent = "ADMIN"; admin.href = "#/admin"; admin.onclick = null; }
  const key = route.view === "character" ? "character" : route.view === "pair" ? "pair" : route.view === "admin" ? "admin" : (route.scroll || "main");
  document.querySelector(`[data-nav="${key}"]`)?.classList.add("active");
}

async function runViewScript(src, token) {
  // Cache-busting makes the classic per-page scripts execute in their own module scope each visit.
  await import(`./${src}?spa=${Date.now()}-${token}`);
}

async function renderSpaRoute() {
  const token = ++spaRenderToken;
  const route = spaParseRoute();
  window.__SPA_ROUTE__ = route;
  if (!(route.view === "pair" && route.pairNew) &&
      window.__elingneLegacyPairCreatePromise &&
      (!window.__elingneLegacyPairCreateCooldownUntil || Date.now() >= window.__elingneLegacyPairCreateCooldownUntil)) {
    window.__elingneLegacyPairCreatePromise = null;
    window.__elingneLegacyPairCreateCooldownUntil = 0;
  }
  updateSpaHeader(route);
  spaView.setAttribute("aria-busy", "true");
  spaView.innerHTML = SPA_TEMPLATES[route.view];
  window.scrollTo({ top:0, behavior:"instant" });

  try {
    if (route.view === "main") await runViewScript("app-v9.js", token);
    if (route.view === "character") await runViewScript("character-v8.js", token);
    if (route.view === "pair") await runViewScript("pair-v11.js", token);
    if (route.view === "admin") await runViewScript("admin-v3.js", token);
  } catch (error) {
    console.error("SPA view init failed", error);
    if (token === spaRenderToken) spaView.insertAdjacentHTML("afterbegin", `<p class="spa-error">화면을 불러오는 중 오류가 발생했습니다: ${String(error.message || error)}</p>`);
  } finally {
    if (token === spaRenderToken) {
      spaView.setAttribute("aria-busy", "false");
      if (route.scroll) requestAnimationFrame(() => document.getElementById(route.scroll)?.scrollIntoView({behavior:"smooth", block:"start"}));
    }
  }
}

function legacyHrefToRoute(href) {
  try {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return null;
    const file = url.pathname.split("/").pop();
    if (file === "character.html" && url.searchParams.get("id")) return `/character/${encodeURIComponent(url.searchParams.get("id"))}`;
    if (file === "pair.html" && url.searchParams.get("new") === "1") return "/pair/new";
    if (file === "pair.html" && url.searchParams.get("id")) return `/pair/${encodeURIComponent(url.searchParams.get("id"))}`;
    if (file === "admin.html") return "/admin";
    if (file === "index.html" || file === "") {
      if (url.hash === "#characters") return "/characters";
      if (url.hash === "#pairs") return "/pairs";
      return "/";
    }
  } catch (_) {}
  return null;
}

document.addEventListener("click", event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
  const href = link.getAttribute("href");
  if (!href) return;
  if (href.startsWith("#/")) return; // native hashchange will route it
  const route = legacyHrefToRoute(href);
  if (!route) return;
  event.preventDefault();
  window.spaNavigate(route);
});

window.addEventListener("hashchange", queueSpaRender);
window.addEventListener("popstate", () => { if (location.hash.startsWith("#/")) queueSpaRender(); });
if (!location.hash.startsWith("#/")) history.replaceState(null, "", "#/");
queueSpaRender();