// SPA v16: pair view guard + idempotent legacy pair creation.
const __elingneViewRoot = document.querySelector(".character-page");
if (__elingneViewRoot && __elingneViewRoot.dataset.__elingne_pair_initialized !== "1") {
  __elingneViewRoot.dataset.__elingne_pair_initialized = "1";
const params = new URLSearchParams(location.search);
let pairId = window.__SPA_ROUTE__?.pairId || params.get("id");
const newMode = window.__SPA_ROUTE__?.pairNew === true || params.get("new") === "1";

let isOwner = false;
let pair = null;
let profiles = [];
let posts = [];
let images = [];
let selectedPostFiles = [];
let mixedPairImageOrder = [];
let pairEditorAttachments = [];
let pairRemovedAttachmentPaths = [];
let postSaving = false;

const profileDialog = document.getElementById("profile-dialog");
const pairDialog = document.getElementById("pair-dialog");
const postDialog = document.getElementById("post-dialog");



function makeLockSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function hashLockPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function ensureLockEditorUI() {
  if (document.getElementById("pair-post-lock-box")) return;
  const bodyLabel = document.getElementById("post-body")?.closest("label");
  if (!bodyLabel) return;
  bodyLabel.insertAdjacentHTML("afterend", `
    <div id="pair-post-lock-box" class="post-lock-editor hidden">
      <label class="lock-toggle-row">
        <input id="pair-edit-lock-toggle" type="checkbox">
        <span>잠금 설정</span>
      </label>
      <div id="pair-edit-lock-settings" class="post-lock-settings hidden">
        <label>4자리 비밀번호
          <input id="pair-edit-lock-pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="숫자 4자리" autocomplete="new-password">
        </label>
        <p class="muted lock-help">잠금 설정을 켠 게시물은 비밀번호를 입력해야 열 수 있습니다.</p>
      </div>
    </div>
  `);
  const toggle = document.getElementById("pair-edit-lock-toggle");
  const settings = document.getElementById("pair-edit-lock-settings");
  toggle.addEventListener("change", () => {
    settings.classList.toggle("hidden", !toggle.checked);
    if (toggle.checked) document.getElementById("pair-edit-lock-pin").focus();
  });
}

function resetLockEditor(kind, post = null) {
  ensureLockEditorUI();
  const box = document.getElementById("pair-post-lock-box");
  const toggle = document.getElementById("pair-edit-lock-toggle");
  const settings = document.getElementById("pair-edit-lock-settings");
  const pin = document.getElementById("pair-edit-lock-pin");
  if (!box || !toggle || !settings || !pin) return;
  const supported = kind === "log" || kind === "gallery";
  box.classList.toggle("hidden", !supported);
  toggle.checked = supported && !!post?.is_locked;
  settings.classList.toggle("hidden", !toggle.checked);
  pin.value = "";
  pin.placeholder = post?.is_locked ? "변경할 때만 새 4자리 입력" : "숫자 4자리";
}

async function buildLockPayload(kind, id) {
  if (kind !== "log" && kind !== "gallery") return {};
  const toggle = document.getElementById("pair-edit-lock-toggle");
  const pinInput = document.getElementById("pair-edit-lock-pin");
  const locked = !!toggle?.checked;
  const existing = id ? posts.find(x => x.id === id) : null;
  if (!locked) return { is_locked:false, lock_code_hash:null, lock_salt:null };
  const pin = (pinInput?.value || "").trim();
  if (!pin && existing?.is_locked && existing?.lock_code_hash && existing?.lock_salt) {
    return { is_locked:true };
  }
  if (!/^\d{4}$/.test(pin)) throw new Error("잠금 비밀번호는 숫자 4자리로 입력해 주세요.");
  const salt = makeLockSalt();
  return { is_locked:true, lock_salt:salt, lock_code_hash:await hashLockPin(pin, salt) };
}

function ensurePostUnlockDialog() {
  let dialog = document.getElementById("pair-post-unlock-dialog");
  if (dialog) return dialog;
  document.getElementById("spa-view")?.insertAdjacentHTML("beforeend", `
    <dialog id="pair-post-unlock-dialog" class="editor-dialog lock-dialog">
      <form method="dialog" class="editor-shell lock-dialog-shell">
        <div class="editor-top">
          <h2>잠긴 게시물</h2>
          <button id="pair-post-unlock-cancel" value="cancel" class="ghost" type="button">닫기</button>
        </div>
        <p class="muted">이 게시물을 보려면 4자리 비밀번호를 입력해 주세요.</p>
        <label>비밀번호
          <input id="pair-post-unlock-pin" class="lock-pin-input" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" placeholder="••••">
        </label>
        <button id="pair-post-unlock-submit" type="button">열기</button>
        <p id="pair-post-unlock-msg" class="status"></p>
      </form>
    </dialog>
  `);
  return document.getElementById("pair-post-unlock-dialog");
}

function requestPostUnlock(post) {
  if (!post?.is_locked || isOwner) return Promise.resolve(true);
  const dialog = ensurePostUnlockDialog();
  const pin = document.getElementById("pair-post-unlock-pin");
  const msg = document.getElementById("pair-post-unlock-msg");
  const submit = document.getElementById("pair-post-unlock-submit");
  const cancel = document.getElementById("pair-post-unlock-cancel");
  pin.value = "";
  msg.textContent = "";
  return new Promise(resolve => {
    let done = false;
    const finish = value => {
      if (done) return;
      done = true;
      submit.onclick = null;
      cancel.onclick = null;
      pin.onkeydown = null;
      try { dialog.close(); } catch {}
      resolve(value);
    };
    const verify = async () => {
      const code = pin.value.trim();
      if (!/^\d{4}$/.test(code)) {
        msg.textContent = "숫자 4자리를 입력해 주세요.";
        return;
      }
      const unlock = await window.elingneApi('/api/unlock', {table:'pair_posts', id:post.id, pin:code});
      if (unlock.error) { msg.textContent=unlock.error.message; return; }
      const fresh=await db.from('pair_posts').select('*').eq('id',post.id).single();
      const freshImages=await db.from('pair_post_images').select('*').eq('pair_id',pairId).order('sort_order').order('created_at');
      if(fresh.error||freshImages.error){msg.textContent='내용을 불러오지 못했어요. 다시 시도해주세요.';return;}
      Object.assign(post,fresh.data);images=freshImages.data;
      finish(true);
    };
    submit.onclick = verify;
    cancel.onclick = () => finish(false);
    pin.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); verify(); } };
    dialog.addEventListener("cancel", e => { e.preventDefault(); finish(false); }, { once:true });
    dialog.showModal();
    setTimeout(() => pin.focus(), 0);
  });
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

function normalizeHashtags(value) {
  const source = Array.isArray(value) ? value.join(" ") : String(value || "");
  return [...new Set(source.split(/[\s,]+/).map(x => x.trim().replace(/^#+/, "")).filter(Boolean))].slice(0, 20);
}
function hashtagText(value) { return normalizeHashtags(value).map(x => `#${x}`).join(" "); }
function renderHashtags(value) {
  const tags = normalizeHashtags(value);
  return tags.length ? `<div class="hashtag-row">${tags.map(tag => `<span class="hashtag-chip">#${esc(tag)}</span>`).join("")}</div>` : "";
}
function safeAttachments(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") { try { const x = JSON.parse(value); return Array.isArray(x) ? x : []; } catch {} }
  return [];
}
function formatFileSize(bytes) {
  const n=Number(bytes||0); if(!n) return ""; if(n<1024) return `${n} B`; if(n<1048576) return `${(n/1024).toFixed(1)} KB`; return `${(n/1048576).toFixed(1)} MB`;
}
function attachmentViewerHtml(post) {
  const files=safeAttachments(post?.attachments); if(!files.length) return "";
  return `<section class="attachment-view-section"><h3>첨부파일</h3><div class="attachment-view-list">${files.map(file=>{
    const name=esc(file.name||"첨부파일"), url=esc(file.url||""), type=String(file.type||"");
    const audio=type.startsWith("audio/") ? `<audio controls preload="metadata" src="${url}"></audio>` : "";
    return `<div class="attachment-view-item"><div class="attachment-file-copy"><strong>${name}</strong><span>${esc(type||"FILE")} ${formatFileSize(file.size)}</span></div>${audio}<div class="attachment-actions"><a class="ghost-link" href="${url}" target="_blank" rel="noopener">열기</a><a class="button-link compact" href="${url}" download="${name}">다운로드</a></div></div>`;
  }).join("")}</div></section>`;
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

async function checkOwner() {
  const { data } = await db.auth.getSession();
  isOwner = !!data.session;
  document.querySelectorAll(".owner-only").forEach(x => x.classList.toggle("hidden", !isOwner));
  document.getElementById("owner-pair-tools").classList.toggle("hidden", !isOwner);

  const link = document.getElementById("auth-link");
  if (isOwner) {
    link.textContent = "LOGOUT";
    link.href = "#";
    link.onclick = async e => {
      e.preventDefault();
      await db.auth.signOut();
      window.spaNavigate("/pairs");
    };
  }
}

async function uploadImage(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("gallery").upload(path, file, { upsert:false });
  if (error) throw error;
  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return { url:data.publicUrl, path };
}

function storagePathFromUrl(url) {
  if(typeof url === "string" && url.startsWith("/files/")) return decodeURIComponent(url.slice(7));
  const marker = "/storage/v1/object/public/gallery/";
  const idx = (url || "").indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function createPairIfNeeded() {
  if (!newMode) return;
  if (!isOwner) {
    window.spaNavigate("/admin");
    return;
  }

  // Legacy /pair/new route is kept for old links, but creation is single-flight.
  // This prevents two SPA renders from inserting two pair rows.
  if (window.__elingneLegacyPairCreateCooldownUntil && Date.now() < window.__elingneLegacyPairCreateCooldownUntil) {
    const existingId = await window.__elingneLegacyPairCreatePromise?.catch(() => null);
    if (existingId) window.spaNavigate(`/pair/${existingId}`, true);
    return;
  }

  if (!window.__elingneLegacyPairCreatePromise) {
    window.__elingneLegacyPairCreatePromise = (async () => {
      const { data, error } = await db.from("pairs").insert({ name:"새 페어", summary:"" }).select().single();
      if (error) throw error;

      const { error: profileError } = await db.from("pair_profiles").insert([
        { pair_id:data.id, name:"인물 1", profile_text:"", sort_order:0 },
        { pair_id:data.id, name:"인물 2", profile_text:"", sort_order:1 }
      ]);
      if (profileError) throw profileError;
      return data.id;
    })();
  }

  try {
    const id = await window.__elingneLegacyPairCreatePromise;
    window.__elingneLegacyPairCreateCooldownUntil = Date.now() + 1500;
    window.spaNavigate(`/pair/${id}`, true);
  } catch (error) {
    window.__elingneLegacyPairCreatePromise = null;
    alert(error.message || error);
  }
}

async function loadStrip() {
  const strip = document.getElementById("entity-strip");
  if (!strip) return;
  let list = window.__elingnePairList;
  const draw = () => {
    strip.innerHTML = (list || []).map(x => `
      <a class="entity-chip ${x.id === pairId ? "active" : ""}" href="#/pair/${encodeURIComponent(x.id)}" ${x.id === pairId ? 'aria-current="page"' : ""}>
        <span class="entity-chip-faces" aria-hidden="true">${(x.faces || []).slice(0, 3).map(f => f ? `<img src="${esc(f)}" alt="">` : `<span class="entity-chip-ph"></span>`).join("")}</span>
        <span class="entity-chip-name">${esc(x.name || "이름 없음")}</span>
      </a>`).join("") + (isOwner ? `<a class="entity-chip entity-chip-add" href="#/pair/new">+ 새 페어</a>` : "");
    const active = strip.querySelector(".entity-chip.active");
    if (active) strip.scrollLeft = Math.max(0, active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2);
  };
  if (list) draw();
  const { data: pairs } = await db.from("pairs").select("id,name");
  const ids = (pairs || []).map(x => x.id);
  const { data: profs } = ids.length ? await db.from("pair_profiles").select("pair_id,image_url,sort_order").in("pair_id", ids).order("sort_order") : { data: [] };
  list = (pairs || []).map(x => ({ id:x.id, name:x.name, faces:(profs || []).filter(f => f.pair_id === x.id).map(f => f.image_url || "") }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ko"));
  window.__elingnePairList = list;
  if (!pairId && list.length) {
    pairId = list[0].id;
    history.replaceState(null, "", `#/pair/${encodeURIComponent(pairId)}`);
  }
  draw();
}

async function loadPair() {
  if (!pairId) return;

  const [pairRes, profileRes, postRes, imageRes] = await Promise.all([
    db.from("pairs").select("*").eq("id", pairId).single(),
    db.from("pair_profiles").select("*").eq("pair_id", pairId).order("sort_order"),
    db.from("pair_posts").select("*").eq("pair_id", pairId).order("created_at", {ascending:false}),
    db.from("pair_post_images").select("*").eq("pair_id", pairId).order("sort_order").order("created_at")
  ]);

  pair = pairRes.data;
  profiles = profileRes.data || [];
  posts = postRes.data || [];
  images = imageRes.data || [];

  renderPair();
}

function renderPair() {
  if (!pair) return;
  document.getElementById("pair-name").textContent = pair.name;
  document.getElementById("pair-summary").textContent = pair.summary || "";

  const av = document.getElementById("pair-avatars");
  if (av) av.innerHTML = profiles.slice(0, 3).map(p => p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : `<span class="pair-avatar-ph"></span>`).join("");

  const grid = document.getElementById("pair-profile-grid");
  grid.innerHTML = (profiles.length ? profiles.map((p, i) => `
    <article class="pair-member-card ${isOwner ? "editable" : ""}" ${isOwner ? `data-index="${i}" tabindex="0" role="button" aria-label="${esc(p.name)} 편집"` : ""}>
      ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}">` : `<div class="pair-member-ph" aria-hidden="true"></div>`}
      <div class="pair-member-copy">
        <h3>${esc(p.name)}</h3>
        ${renderHashtags(p.hashtags)}
        ${p.profile_text ? `<div class="post-body">${esc(p.profile_text).replace(/\n/g,"<br>")}</div>` : ""}
      </div>
    </article>
  `).join("") : `<p class="muted">프로필이 없습니다.</p>`)
    + (isOwner && profiles.length < 8 ? `<button type="button" id="add-member-btn" class="pair-member-add" aria-label="인원 추가"><span>+ 인원 추가</span></button>` : "");
  grid.querySelectorAll(".pair-member-card.editable").forEach(card => {
    const open = () => openMemberEditor(Number(card.dataset.index));
    card.onclick = open;
    card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
  });
  document.getElementById("add-member-btn")?.addEventListener("click", () => openMemberEditor(-1));

  renderPosts("log");
  renderPosts("gallery");
}

function postImages(postId) {
  return images.filter(x => x.post_id === postId).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
}

function renderImageGrid(postId) {
  const imgs = postImages(postId);
  if (!imgs.length) return "";
  return `<div class="post-image-grid">
    ${imgs.map(img => `
      <figure class="post-image">
        <img src="${img.image_url}" alt="${esc(img.caption || "")}">
        ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
      </figure>
    `).join("")}
  </div>`;
}

function renderPosts(kind) {
  const target = document.getElementById(kind === "log" ? "pair-log-feed" : "pair-gallery-feed");
  const list = posts.filter(x => x.section === kind);

  target.classList.add("post-card-grid");
  target.innerHTML = list.length
    ? list.map(p => renderPairPostCard(kind, p)).join("")
    : `<p class="muted">등록된 게시물이 없습니다.</p>`;

  bindPairPostCards();
}


function firstPairPostImage(postId) {
  const imgs = postImages(postId);
  return imgs.length ? imgs[0].image_url : "";
}

function renderPairPostCard(kind, post) {
  const thumb = firstPairPostImage(post.id);
  const locked = !!post.is_locked;
  const title = locked ? "잠긴 게시물" : (post.title || (kind === "log" ? "LOG" : "GALLERY"));
  const bodyText = locked ? "비밀번호를 입력하면 내용을 볼 수 있어요." : (post.body || "").replace(/\n/g, " ").trim();

  return `
    <article class="post-card open-pair-post-card ${locked ? "locked" : ""}" data-kind="${kind}" data-id="${post.id}" tabindex="0" aria-label="${locked ? "잠긴 게시물" : esc(title)}">
      <div class="post-card-thumb ${thumb ? "" : "no-image"}">
        ${thumb ? `<img src="${thumb}" alt="">` : `<span>${kind === "log" ? "LOG" : "IMAGE"}</span>`}
        ${locked ? `<span class="post-lock-overlay" aria-hidden="true">🔒</span>` : ""}
      </div>
      <div class="post-card-copy">
        <p class="post-date">${new Date(post.created_at).toLocaleDateString("ko-KR")}</p>
        <h3>${esc(title)}</h3>
        ${bodyText ? `<p>${esc(bodyText)}</p>` : ""}
      </div>
    </article>
  `;
}

function bindPairPostCards() {
  document.querySelectorAll(".open-pair-post-card").forEach(card => {
    card.onclick = () => openPairPostViewer(card.dataset.kind, card.dataset.id);
    card.onkeydown = e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPairPostViewer(card.dataset.kind, card.dataset.id);
      }
    };
  });
}

async function openPairPostViewer(kind, id) {
  const post = posts.find(x => x.id === id);
  if (!post) return;
  if (!(await requestPostUnlock(post))) return;

  document.getElementById("post-view-kind").textContent = kind.toUpperCase();
  document.getElementById("post-view-title").textContent =
    post.title || (kind === "log" ? "LOG" : "GALLERY");
  document.getElementById("post-view-date").textContent =
    new Date(post.created_at).toLocaleDateString("ko-KR");
  document.getElementById("post-view-body").innerHTML =
    post.body ? esc(post.body).replace(/\n/g,"<br>") : "";

  const imgs = postImages(id);
  document.getElementById("post-view-images").innerHTML = imgs.length
    ? imgs.map(img => `
        <figure class="post-view-image">
          <img src="${img.image_url}" alt="${esc(img.caption || "")}">
          ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
        </figure>
      `).join("")
    : "";

  document.getElementById("post-view-files").innerHTML = attachmentViewerHtml(post);

  const tools = document.getElementById("post-view-owner-tools");
  tools.classList.toggle("hidden", !isOwner);
  document.getElementById("pair-post-view-edit-btn").onclick = () => {
    document.getElementById("pair-post-view-dialog").close();
    openPostEditor(kind, id);
  };

  document.getElementById("pair-post-view-dialog").showModal();
}

document.getElementById("close-pair-post-view").addEventListener("click", () => {
  document.getElementById("pair-post-view-dialog").close();
});


let editMemberIndex = -1;
let memberFile = null;

function rowsFromProfiles() {
  return profiles.map((p, i) => ({
    pair_id: pairId,
    name: p.name || `인물 ${i + 1}`,
    profile_text: p.profile_text || "",
    hashtags: normalizeHashtags(p.hashtags),
    image_url: p.image_url || null,
    sort_order: i
  }));
}

// Saves the whole member list. The endpoint also clears the retired pair intro text/images.
async function saveMemberRows(rows) {
  const saved = await window.elingneApi("/api/pair-profile", { id: pairId, text: "", profiles: rows, intros: [] });
  if (saved.error) throw saved.error;
  await loadPair();
  window.__elingnePairList = null;
  loadStrip();
}

function setMemberPreview(src, note) {
  document.getElementById("member-preview").innerHTML = src
    ? `<img class="profile-editor-thumb profile-crop-preview" src="${src}" alt=""><span>${note}</span>` : "";
}

function openMemberEditor(index) {
  editMemberIndex = index;
  memberFile = null;
  const m = index >= 0 ? profiles[index] : { name: `인물 ${profiles.length + 1}`, profile_text: "", hashtags: [], image_url: null };
  document.getElementById("member-title").textContent = index >= 0 ? `${m.name || "인물"} 편집` : "인원 추가";
  document.getElementById("member-name").value = m.name || "";
  document.getElementById("member-hashtags").value = hashtagText(m.hashtags);
  document.getElementById("member-text").value = m.profile_text || "";
  document.getElementById("member-image").value = "";
  setMemberPreview(m.image_url, "현재 사진");
  document.getElementById("delete-member-btn").classList.toggle("hidden", index < 0 || profiles.length <= 2);
  document.getElementById("profile-edit-msg").textContent = "";
  profileDialog.showModal();
}

document.getElementById("member-image").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const msg = document.getElementById("profile-edit-msg");
  try {
    const cropped = await window.cropSquareImage(file);
    if (!cropped) { e.target.value = ""; memberFile = null; return; }
    memberFile = cropped;
    const reader = new FileReader();
    reader.onload = () => setMemberPreview(reader.result, "저장 전 미리보기");
    reader.readAsDataURL(cropped);
    msg.textContent = "사진 크롭이 적용됐어요. 미리보기를 확인한 뒤 저장해 주세요.";
  } catch (err) { msg.textContent = err.message; }
});

document.getElementById("save-profile-btn").addEventListener("click", async (e) => {
  const btn = e.currentTarget, msg = document.getElementById("profile-edit-msg");
  if (btn.disabled) return;
  btn.disabled = true;
  try {
    msg.textContent = "저장 중...";
    const rows = rowsFromProfiles();
    const base = editMemberIndex >= 0 ? rows[editMemberIndex] : { pair_id: pairId, image_url: null, sort_order: rows.length };
    if (memberFile) base.image_url = (await uploadImage(memberFile, `pair/${pairId}/profiles`)).url;
    base.name = document.getElementById("member-name").value.trim() || `인물 ${editMemberIndex >= 0 ? editMemberIndex + 1 : rows.length + 1}`;
    base.hashtags = normalizeHashtags(document.getElementById("member-hashtags").value);
    base.profile_text = document.getElementById("member-text").value;
    if (editMemberIndex < 0) rows.push(base);
    await saveMemberRows(rows);
    profileDialog.close();
  } catch (err) {
    msg.textContent = err.message || "저장하지 못했어요.";
  } finally { btn.disabled = false; }
});

document.getElementById("delete-member-btn").addEventListener("click", async () => {
  if (editMemberIndex < 0 || profiles.length <= 2) return;
  if (!confirm("이 인물을 삭제할까요?")) return;
  try {
    const rows = rowsFromProfiles().filter((_, i) => i !== editMemberIndex);
    await saveMemberRows(rows);
    profileDialog.close();
  } catch (err) { document.getElementById("profile-edit-msg").textContent = err.message || "삭제하지 못했어요."; }
});

document.getElementById("edit-pair-btn").addEventListener("click", () => {
  document.getElementById("pair-edit-name").value = pair?.name || "";
  document.getElementById("pair-edit-summary").value = pair?.summary || "";
  pairDialog.showModal();
});

document.getElementById("save-pair-btn").addEventListener("click", async () => {
  const { error } = await db.from("pairs").update({
    name: document.getElementById("pair-edit-name").value.trim() || "PAIR",
    summary: document.getElementById("pair-edit-summary").value.trim()
  }).eq("id", pairId);

  if (error) return document.getElementById("pair-edit-msg").textContent = error.message;
  pairDialog.close();
  loadPair();
});

document.getElementById("delete-pair-btn").addEventListener("click", async () => {
  if (!confirm("이 페어를 삭제할까요?")) return;
  const { error } = await db.from("pairs").delete().eq("id", pairId);
  if (error) return alert(error.message);
  window.spaNavigate("/pairs");
});

document.querySelectorAll("[data-open-post-editor]").forEach(btn => {
  btn.onclick = () => openPostEditor(btn.dataset.openPostEditor);
});

function openPostEditor(kind, id="") {
  selectedPostFiles=[]; mixedPairImageOrder=[]; pairEditorAttachments=[]; pairRemovedAttachmentPaths=[];
  document.getElementById("post-kind").value=kind; document.getElementById("post-id").value=id; document.getElementById("post-title").value=""; document.getElementById("post-body").value=""; document.getElementById("post-image-picker").value=""; document.getElementById("post-new-caption-list").innerHTML=""; document.getElementById("post-existing-list").innerHTML=""; document.getElementById("post-existing-wrap").classList.add("hidden"); document.getElementById("delete-post-btn").classList.toggle("hidden",!id);
  const currentPost=id?posts.find(x=>x.id===id):null; resetLockEditor(kind,currentPost); document.getElementById("pair-attachment-editor-wrap")?.classList.toggle("hidden",!(kind==="log"||kind==="gallery")); pairEditorAttachments=safeAttachments(currentPost?.attachments).map(x=>({...x,existing:true})); renderPairAttachmentEditor();
  if(id){document.getElementById("post-title").value=currentPost?.title||"";document.getElementById("post-body").value=currentPost?.body||"";mixedPairImageOrder=postImages(id).map(img=>({type:"existing",id:img.id}));}
  renderMixedPairImages(); document.getElementById("post-dialog-title").textContent=kind==="log"?"PAIR LOG 편집":"PAIR GALLERY 편집"; postDialog.showModal();
}
document.getElementById("add-post-image-btn").addEventListener("click",()=>document.getElementById("post-image-picker").click());
document.getElementById("post-image-picker").addEventListener("change",e=>{for(const file of Array.from(e.target.files||[])){const item={uid:crypto.randomUUID(),file,caption:"",preview:URL.createObjectURL(file)};selectedPostFiles.push(item);mixedPairImageOrder.push({type:"new",uid:item.uid});}e.target.value="";renderMixedPairImages();});
function renderMixedPairImages(){const wrap=document.getElementById("post-existing-wrap"),box=document.getElementById("post-existing-list"),old=document.getElementById("post-new-caption-list");if(old)old.innerHTML="";if(!mixedPairImageOrder.length){wrap?.classList.add("hidden");box.innerHTML="";return;}wrap?.classList.remove("hidden");box.innerHTML=mixedPairImageOrder.map(token=>{if(token.type==="existing"){const img=images.find(x=>x.id===token.id);if(!img)return"";return `<div class="image-edit-row image-card-editor draggable-image-row" draggable="true" data-token="e:${img.id}" data-image-id="${img.id}"><button type="button" class="drag-handle">⋮⋮</button><div class="image-preview-wrap"><img src="${img.image_url}" alt=""><button type="button" class="image-x delete-pair-mixed-existing" data-id="${img.id}">×</button></div><div class="image-edit-fields"><input class="existing-caption" data-id="${img.id}" type="text" value="${esc(img.caption||"")}" placeholder="이미지 캡션"></div></div>`;}const item=selectedPostFiles.find(x=>x.uid===token.uid);if(!item)return"";return `<div class="image-edit-row image-card-editor pending-image-row draggable-image-row" draggable="true" data-token="n:${item.uid}"><button type="button" class="drag-handle">⋮⋮</button><div class="image-preview-wrap"><img src="${item.preview}" alt=""><button type="button" class="image-x remove-pair-mixed-new" data-uid="${item.uid}">×</button></div><div class="image-edit-fields"><input class="new-image-caption" data-uid="${item.uid}" type="text" value="${esc(item.caption||"")}" placeholder="이미지 캡션"></div></div>`;}).join("");box.querySelectorAll(".existing-caption").forEach(input=>input.oninput=()=>{const img=images.find(x=>x.id===input.dataset.id);if(img)img.caption=input.value;});box.querySelectorAll(".new-image-caption").forEach(input=>input.oninput=()=>{const item=selectedPostFiles.find(x=>x.uid===input.dataset.uid);if(item)item.caption=input.value;});box.querySelectorAll(".remove-pair-mixed-new").forEach(btn=>btn.onclick=()=>{const uid=btn.dataset.uid,item=selectedPostFiles.find(x=>x.uid===uid);try{if(item)URL.revokeObjectURL(item.preview)}catch{}selectedPostFiles=selectedPostFiles.filter(x=>x.uid!==uid);mixedPairImageOrder=mixedPairImageOrder.filter(x=>!(x.type==="new"&&x.uid===uid));renderMixedPairImages();});box.querySelectorAll(".delete-pair-mixed-existing").forEach(btn=>btn.onclick=async()=>{if(!confirm("이 이미지를 바로 삭제할까요?"))return;const image=images.find(x=>x.id===btn.dataset.id),path=storagePathFromUrl(image?.image_url);if(path)await db.storage.from("gallery").remove([path]);const{error}=await db.from("pair_post_images").delete().eq("id",btn.dataset.id);if(error)return alert(error.message);images=images.filter(x=>x.id!==btn.dataset.id);mixedPairImageOrder=mixedPairImageOrder.filter(x=>!(x.type==="existing"&&x.id===btn.dataset.id));renderMixedPairImages();renderPosts("log");renderPosts("gallery");});enablePairImageDrag(box,syncMixedPairImageOrderFromDom);}
function enablePairImageDrag(container,onReorder){if(!container)return;let dragged=null;container.querySelectorAll(".draggable-image-row").forEach(row=>{row.addEventListener("dragstart",e=>{dragged=row;row.classList.add("dragging");if(e.dataTransfer)e.dataTransfer.effectAllowed="move";});row.addEventListener("dragend",()=>{row.classList.remove("dragging");dragged=null;onReorder?.();});row.addEventListener("dragover",e=>{e.preventDefault();if(!dragged||dragged===row)return;const r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;container.insertBefore(dragged,after?row.nextSibling:row);});});}
function syncMixedPairImageOrderFromDom(){mixedPairImageOrder=[...document.querySelectorAll("#post-existing-list [data-token]")].map(row=>row.dataset.token.startsWith("e:")?{type:"existing",id:row.dataset.token.slice(2)}:{type:"new",uid:row.dataset.token.slice(2)});}
async function saveExistingPairImageOrder(){syncMixedPairImageOrderFromDom();for(let i=0;i<mixedPairImageOrder.length;i++)if(mixedPairImageOrder[i].type==="existing"){const{error}=await db.from("pair_post_images").update({sort_order:i}).eq("id",mixedPairImageOrder[i].id);if(error)throw error;}}
async function saveExistingImages(){for(const input of document.querySelectorAll("#post-existing-list .existing-caption")){const{error}=await db.from("pair_post_images").update({caption:input.value}).eq("id",input.dataset.id);if(error)throw error;}}
async function saveNewImages(postId,sortOffset=0){syncMixedPairImageOrderFromDom();for(let i=0;i<mixedPairImageOrder.length;i++){const token=mixedPairImageOrder[i];if(token.type!=="new")continue;const item=selectedPostFiles.find(x=>x.uid===token.uid);if(!item)continue;const up=await uploadImage(item.file,`pair/${pairId}/${postId}`);const{error}=await db.from("pair_post_images").insert({pair_id:pairId,post_id:postId,image_url:up.url,caption:item.caption||"",sort_order:i});if(error)throw error;}}
function renderPairAttachmentEditor(){const list=document.getElementById("pair-attachment-edit-list");if(!list)return;list.innerHTML=pairEditorAttachments.map((item,i)=>`<div class="attachment-edit-item"><div><strong>${esc(item.name||item.file?.name||"첨부파일")}</strong><span>${esc(item.type||item.file?.type||"FILE")} ${formatFileSize(item.size||item.file?.size)}</span></div><button type="button" class="ghost pair-attachment-remove" data-index="${i}">삭제</button></div>`).join("");list.querySelectorAll(".pair-attachment-remove").forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.index),item=pairEditorAttachments[i];if(item?.existing){const path=storagePathFromUrl(item.url);if(path)pairRemovedAttachmentPaths.push(path);}pairEditorAttachments.splice(i,1);renderPairAttachmentEditor();});}
document.getElementById("add-pair-attachment-btn")?.addEventListener("click",()=>document.getElementById("pair-attachment-picker")?.click());document.getElementById("pair-attachment-picker")?.addEventListener("change",e=>{for(const file of Array.from(e.target.files||[]))pairEditorAttachments.push({existing:false,uid:crypto.randomUUID(),file,name:file.name,type:file.type||"application/octet-stream",size:file.size});e.target.value="";renderPairAttachmentEditor();});
async function savePairAttachments(postId){const saved=[];for(const item of pairEditorAttachments){if(item.existing&&item.url){saved.push({name:item.name,url:item.url,type:item.type||"",size:item.size||0});continue;}if(!item.file)continue;const up=await uploadImage(item.file,`pair/${pairId}/${postId}/attachments`);saved.push({name:item.file.name,url:up.url,type:item.file.type||"application/octet-stream",size:item.file.size});}const{error}=await db.from("pair_posts").update({attachments:saved}).eq("id",postId);if(error)throw error;if(pairRemovedAttachmentPaths.length)await db.storage.from("gallery").remove([...new Set(pairRemovedAttachmentPaths)]);}

document.getElementById("save-post-btn").addEventListener("click", async () => {
  if (postSaving) return;
  postSaving = true;
  const saveButton = document.getElementById("save-post-btn");
  saveButton.disabled = true;
  const kind = document.getElementById("post-kind").value;
  const id = document.getElementById("post-id").value;
  const msg = document.getElementById("post-edit-msg");
  msg.textContent = "저장 중...";
  try {
    let postId = id;
    const lockPayload = await buildLockPayload(kind, id);
    const payload = {
      pair_id:pairId, section:kind,
      title:document.getElementById("post-title").value.trim(),
      body:document.getElementById("post-body").value,
      ...lockPayload
    };
    if (id) {
      const { error } = await db.from("pair_posts").update(payload).eq("id", id);
      if (error) throw error;
      await saveExistingImages();
      await saveExistingPairImageOrder();
    } else {
      const { data, error } = await db.from("pair_posts").insert(payload).select().single();
      if (error) throw error;
      postId = data.id;
    }
    const existingCount = id ? document.querySelectorAll('#post-existing-list [data-image-id]').length : 0;
    await saveNewImages(postId, existingCount);
    await savePairAttachments(postId);
    postDialog.close();
    await loadPair();
  } catch (e) {
    msg.textContent = e.message;
  } finally {
    postSaving = false;
    saveButton.disabled = false;
  }
});

document.getElementById("delete-post-btn").addEventListener("click", async () => {
  const id = document.getElementById("post-id").value;
  if (!id || !confirm("이 게시물을 삭제할까요?")) return;
  const postToDelete = posts.find(x => x.id === id);
  for (const file of safeAttachments(postToDelete?.attachments)) { const path=storagePathFromUrl(file.url); if(path) await db.storage.from("gallery").remove([path]); }
  const { error } = await db.from("pair_posts").delete().eq("id", id);
  if (error) return document.getElementById("post-edit-msg").textContent = error.message;
  postDialog.close();
  loadPair();
});

ensureLockEditorUI();

(async function init(){
  await checkOwner();
  await createPairIfNeeded();
  if (!newMode) await loadStrip();
  if (pairId) await loadPair();
  else if (!newMode) document.getElementById("pair-name").textContent = "등록된 페어가 없습니다.";
})();

}
