// SPA v14 guard: prevent duplicate module initialization on the same rendered view.
const __elingneViewRoot = document.querySelector(".character-page");
if (__elingneViewRoot && __elingneViewRoot.dataset.__elingne_character_initialized !== "1") {
  __elingneViewRoot.dataset.__elingne_character_initialized = "1";
const characterId = window.__SPA_ROUTE__?.characterId || new URLSearchParams(location.search).get("id");

let isOwner = false;
let character = null;
let profilePosts = [];
let logs = [];
let galleryPosts = [];
let postImages = [];

let selectedNewFiles = [];
let mixedImageOrder = [];
let editorAttachments = [];
let removedAttachmentPaths = [];
let editorSaving = false;
let croppedCharacterFile = null;

function setCharacterCropPreview(input, src, note = "저장 전 미리보기") {
  if (!input) return;
  const label = input.closest("label") || input.parentElement;
  let box = label?.querySelector(".profile-crop-preview-box");
  if (!box && label) {
    box = document.createElement("div");
    box.className = "profile-crop-preview-box";
    label.appendChild(box);
  }
  if (!box) return;
  box.innerHTML = src ? `<img class="profile-crop-preview" src="${src}" alt="대표사진 저장 전 미리보기"><span>${note}</span>` : "";
}

function previewCharacterFile(input, file, note) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setCharacterCropPreview(input, reader.result, note);
  reader.readAsDataURL(file);
}

const editor = document.getElementById("editor-dialog");
const charEditor = document.getElementById("character-dialog");



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
  if (document.getElementById("post-lock-box")) return;
  const sortWrap = document.getElementById("sort-wrap");
  if (!sortWrap) return;
  sortWrap.insertAdjacentHTML("afterend", `
    <div id="post-lock-box" class="post-lock-editor hidden">
      <label class="lock-toggle-row">
        <input id="edit-lock-toggle" type="checkbox">
        <span>잠금 설정</span>
      </label>
      <div id="edit-lock-settings" class="post-lock-settings hidden">
        <label>4자리 비밀번호
          <input id="edit-lock-pin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" placeholder="숫자 4자리" autocomplete="new-password">
        </label>
        <p class="muted lock-help">잠금 설정을 켠 게시물은 비밀번호를 입력해야 열 수 있습니다.</p>
      </div>
    </div>
  `);
  const toggle = document.getElementById("edit-lock-toggle");
  const settings = document.getElementById("edit-lock-settings");
  toggle.addEventListener("change", () => {
    settings.classList.toggle("hidden", !toggle.checked);
    if (toggle.checked) document.getElementById("edit-lock-pin").focus();
  });
}

function resetLockEditor(kind, post = null) {
  ensureLockEditorUI();
  const box = document.getElementById("post-lock-box");
  const toggle = document.getElementById("edit-lock-toggle");
  const settings = document.getElementById("edit-lock-settings");
  const pin = document.getElementById("edit-lock-pin");
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
  const toggle = document.getElementById("edit-lock-toggle");
  const pinInput = document.getElementById("edit-lock-pin");
  const locked = !!toggle?.checked;
  const existing = id ? findPost(kind, id) : null;
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
  let dialog = document.getElementById("post-unlock-dialog");
  if (dialog) return dialog;
  document.getElementById("spa-view")?.insertAdjacentHTML("beforeend", `
    <dialog id="post-unlock-dialog" class="editor-dialog lock-dialog">
      <form method="dialog" class="editor-shell lock-dialog-shell">
        <div class="editor-top">
          <h2>잠긴 게시물</h2>
          <button id="post-unlock-cancel" value="cancel" class="ghost" type="button">닫기</button>
        </div>
        <p class="muted">이 게시물을 보려면 4자리 비밀번호를 입력해 주세요.</p>
        <label>비밀번호
          <input id="post-unlock-pin" class="lock-pin-input" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" placeholder="••••">
        </label>
        <button id="post-unlock-submit" type="button">열기</button>
        <p id="post-unlock-msg" class="status"></p>
      </form>
    </dialog>
  `);
  return document.getElementById("post-unlock-dialog");
}

function requestPostUnlock(post) {
  if (!post?.is_locked || isOwner) return Promise.resolve(true);
  const dialog = ensurePostUnlockDialog();
  const pin = document.getElementById("post-unlock-pin");
  const msg = document.getElementById("post-unlock-msg");
  const submit = document.getElementById("post-unlock-submit");
  const cancel = document.getElementById("post-unlock-cancel");
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
      const hash = await hashLockPin(code, post.lock_salt || "");
      if (hash !== post.lock_code_hash) {
        msg.textContent = "비밀번호가 맞지 않아요.";
        pin.select();
        return;
      }
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
function renderCharacterMeta(c) {
  const rows = [
    ["종족", c?.species],
    ["나이", c?.age],
    ["신체", c?.body_info],
    ["가족", c?.family_profile]
  ].filter(([, value]) => String(value || "").trim());
  if (!rows.length) return "";
  return `<dl class="character-meta-table">${rows.map(([label,value]) => `<div class="character-meta-row"><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
}

function renderCouplingLine(c) {
  const name = String(c?.coupling_name || "").trim();
  return name ? `<p class="character-coupling"><span aria-hidden="true">♥</span><span>${esc(name)}</span></p>` : "";
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
  document.getElementById("owner-character-tools").classList.toggle("hidden", !isOwner);

  const link = document.getElementById("auth-link");
  if (isOwner) {
    link.textContent = "LOGOUT";
    link.href = "#";
    link.onclick = async e => {
      e.preventDefault();
      await db.auth.signOut();
      window.spaNavigate("/admin");
    };
  }
}

async function uploadImage(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from("gallery")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

function storagePathFromUrl(url) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = (url || "").indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

function imagesFor(section, postId) {
  return postImages
    .filter(x => x.section === section && x.post_id === postId)
    .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function renderImages(section, postId) {
  const imgs = imagesFor(section, postId);
  if (!imgs.length) return "";

  return `<div class="post-image-grid count-${Math.min(imgs.length, 4)}">
    ${imgs.map(img => `
      <figure class="post-image">
        <img src="${img.image_url}" alt="${esc(img.caption || "")}">
        ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
      </figure>
    `).join("")}
  </div>`;
}

function postTools(section, id) {
  if (!isOwner) return "";
  return `<div class="post-tools">
    <button class="ghost edit-post" data-kind="${section}" data-id="${id}">수정</button>
  </div>`;
}

async function loadAll() {
  if (!characterId) return;

  const [charRes, profileRes, logRes, galleryRes, imgRes] = await Promise.all([
    db.from("characters").select("*").eq("id", characterId).single(),
    db.from("profile_blocks").select("*").eq("character_id", characterId).order("sort_order").order("created_at"),
    db.from("logs").select("*").eq("character_id", characterId).order("created_at", { ascending:false }),
    db.from("gallery").select("*").eq("character_id", characterId).order("created_at", { ascending:false }),
    db.from("post_images").select("*").eq("character_id", characterId).order("sort_order").order("created_at")
  ]);

  character = charRes.data;
  profilePosts = profileRes.data || [];
  logs = logRes.data || [];
  galleryPosts = galleryRes.data || [];
  postImages = imgRes.data || [];

  renderHead();
  renderProfile();
  renderLogs();
  renderGallery();
}

function renderHead() {
  if (!character) {
    document.getElementById("character-head").innerHTML = "<p>캐릭터를 찾을 수 없습니다.</p>";
    return;
  }

  document.title = `${character.name} | elingne archive`;
  document.getElementById("character-head").innerHTML = `
    <img src="${character.image_url || ""}" alt="${esc(character.name)}">
    <div>
      <p class="eyebrow">CHARACTER</p>
      <h1>${esc(character.name)}</h1>
      ${renderCouplingLine(character)}
      <p class="muted character-summary">${esc(character.summary || "")}</p>
      ${renderHashtags(character.hashtags)}
      ${renderCharacterMeta(character)}
    </div>
  `;
}

function renderProfile() {
  const feed = document.getElementById("profile-feed");

  if (!profilePosts.length && character?.profile) {
    feed.innerHTML = `
      <article class="feed-post">
        <div class="post-body">${esc(character.profile).replace(/\n/g,"<br>")}</div>
      </article>
      ${isOwner ? `<p class="muted">기존 프로필 텍스트입니다. 새 게시물 방식으로 새 내용을 추가할 수 있습니다.</p>` : ""}
    `;
    return;
  }

  feed.innerHTML = profilePosts.length
    ? profilePosts.map(p => `
        <article class="feed-post">
          ${postTools("profile", p.id)}
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}
          ${p.body ? `<div class="post-body">${esc(p.body).replace(/\n/g,"<br>")}</div>` : ""}
          ${renderImages("profile", p.id)}
          ${p.image_url ? `
            <figure class="legacy-image">
              <img src="${p.image_url}" alt="${esc(p.caption || "")}">
              ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
            </figure>` : ""}
        </article>
      `).join("")
    : `<p class="muted">등록된 프로필 게시물이 없습니다.</p>`;

  bindEditButtons();
}

function renderLogs() {
  const feed = document.getElementById("log-feed");

  feed.classList.add("post-card-grid");
  feed.innerHTML = logs.length
    ? logs.map(p => renderPostCard("log", p)).join("")
    : `<p class="muted">등록된 로그가 없습니다.</p>`;

  bindPostCards();
}

function renderGallery() {
  const feed = document.getElementById("gallery-feed");

  feed.classList.add("post-card-grid");
  feed.innerHTML = galleryPosts.length
    ? galleryPosts.map(p => renderPostCard("gallery", p)).join("")
    : `<p class="muted">등록된 갤러리 게시물이 없습니다.</p>`;

  bindPostCards();
}


function firstPostImage(kind, post) {
  const imgs = imagesFor(kind, post.id);
  if (imgs.length) return imgs[0].image_url;
  if (post.image_url) return post.image_url;
  return "";
}

function renderPostCard(kind, post) {
  const thumb = firstPostImage(kind, post);
  const locked = !!post.is_locked;
  const title = locked ? "잠긴 게시물" : (post.title || (kind === "log" ? "LOG" : "GALLERY"));
  const bodyText = locked ? "비밀번호를 입력하면 내용을 볼 수 있어요." : (post.body || post.caption || "").replace(/\n/g, " ").trim();

  return `
    <article class="post-card open-post-card ${locked ? "locked" : ""}" data-kind="${kind}" data-id="${post.id}" tabindex="0" aria-label="${locked ? "잠긴 게시물" : esc(title)}">
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

function bindPostCards() {
  document.querySelectorAll(".open-post-card").forEach(card => {
    card.onclick = () => openPostViewer(card.dataset.kind, card.dataset.id);
    card.onkeydown = e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPostViewer(card.dataset.kind, card.dataset.id);
      }
    };
  });
}

async function openPostViewer(kind, id) {
  const post = kind === "log"
    ? logs.find(x => x.id === id)
    : galleryPosts.find(x => x.id === id);

  if (!post) return;
  if (!(await requestPostUnlock(post))) return;

  document.getElementById("post-view-kind").textContent = kind.toUpperCase();
  document.getElementById("post-view-title").textContent =
    post.title || (kind === "log" ? "LOG" : "GALLERY");
  document.getElementById("post-view-date").textContent =
    new Date(post.created_at).toLocaleDateString("ko-KR");
  document.getElementById("post-view-body").innerHTML =
    post.body ? esc(post.body).replace(/\n/g,"<br>") : "";

  const imgs = imagesFor(kind, id);
  const legacy = post.image_url ? [{ image_url: post.image_url, caption: post.caption || "" }] : [];
  const allImgs = [...imgs, ...legacy];

  document.getElementById("post-view-images").innerHTML = allImgs.length
    ? allImgs.map(img => `
        <figure class="post-view-image">
          <img src="${img.image_url}" alt="${esc(img.caption || "")}">
          ${img.caption ? `<figcaption>${esc(img.caption)}</figcaption>` : ""}
        </figure>
      `).join("")
    : "";

  document.getElementById("post-view-files").innerHTML = attachmentViewerHtml(post);

  const tools = document.getElementById("post-view-owner-tools");
  tools.classList.toggle("hidden", !isOwner);
  document.getElementById("post-view-edit-btn").onclick = () => {
    document.getElementById("post-view-dialog").close();
    openEditor(kind, id);
  };

  document.getElementById("post-view-dialog").showModal();
}

document.getElementById("close-post-view").addEventListener("click", () => {
  document.getElementById("post-view-dialog").close();
});


function bindEditButtons() {
  document.querySelectorAll(".edit-post").forEach(btn => {
    btn.onclick = () => openEditor(btn.dataset.kind, btn.dataset.id);
  });
}

document.querySelectorAll("[data-open-editor]").forEach(btn => {
  btn.addEventListener("click", () => openEditor(btn.dataset.openEditor));
});

function findPost(kind, id) {
  if (kind === "profile") return profilePosts.find(x => x.id === id);
  if (kind === "log") return logs.find(x => x.id === id);
  return galleryPosts.find(x => x.id === id);
}

function resetEditor() {
  document.getElementById("edit-id").value = "";
  document.getElementById("edit-title").value = "";
  document.getElementById("edit-body").value = "";
  document.getElementById("edit-sort").value = "0";
  document.getElementById("edit-image-picker").value = "";
  document.getElementById("new-image-caption-list").innerHTML = "";
  document.getElementById("existing-image-list").innerHTML = "";
  document.getElementById("existing-images-wrap").classList.add("hidden");
  document.getElementById("delete-editor-btn").classList.add("hidden");
  document.getElementById("editor-msg").textContent = "";
  selectedNewFiles = [];
  mixedImageOrder = [];
  editorAttachments = [];
  removedAttachmentPaths = [];
  document.getElementById("attachment-editor-wrap")?.classList.add("hidden");
  if (document.getElementById("attachment-edit-list")) document.getElementById("attachment-edit-list").innerHTML = "";
  if (document.getElementById("edit-attachment-picker")) document.getElementById("edit-attachment-picker").value = "";
  resetLockEditor("profile", null);
}

function openEditor(kind, id = "") {
  resetEditor();

  document.getElementById("edit-kind").value = kind;
  document.getElementById("edit-id").value = id;
  document.getElementById("sort-wrap").classList.toggle("hidden", kind !== "profile");

  document.getElementById("editor-title").textContent =
    kind === "profile" ? "프로필 게시물 편집"
    : kind === "log" ? "로그 게시물 편집"
    : "갤러리 게시물 편집";

  const currentPost = id ? findPost(kind, id) : null;
  resetLockEditor(kind, currentPost);
  document.getElementById("attachment-editor-wrap")?.classList.toggle("hidden", !(kind === "log" || kind === "gallery"));
  editorAttachments = (kind === "log" || kind === "gallery") ? safeAttachments(currentPost?.attachments).map(x => ({...x, existing:true})) : [];
  renderAttachmentEditor();

  if (id) {
    const p = currentPost;
    document.getElementById("delete-editor-btn").classList.remove("hidden");
    document.getElementById("edit-title").value = p?.title || "";
    document.getElementById("edit-body").value = p?.body || "";
    if (kind === "profile") document.getElementById("edit-sort").value = p?.sort_order || 0;

    renderExistingImages(kind, id);
  }

  editor.showModal();
}

function renderExistingImages(kind, postId) {
  mixedImageOrder = imagesFor(kind, postId).map(img => ({type:"existing", id:img.id}));
  renderMixedImageEditor();
}
document.getElementById("add-image-btn").addEventListener("click", () => document.getElementById("edit-image-picker").click());
document.getElementById("edit-image-picker").addEventListener("change", e => {
  for (const file of Array.from(e.target.files || [])) { const item={uid:crypto.randomUUID(),file,caption:"",preview:URL.createObjectURL(file)}; selectedNewFiles.push(item); mixedImageOrder.push({type:"new",uid:item.uid}); }
  e.target.value=""; renderMixedImageEditor();
});
function renderPendingImages(){ renderMixedImageEditor(); }
function renderMixedImageEditor(){
  const wrap=document.getElementById("existing-images-wrap"), box=document.getElementById("existing-image-list"), old=document.getElementById("new-image-caption-list"); if(old) old.innerHTML="";
  if(!mixedImageOrder.length){wrap?.classList.add("hidden"); if(box) box.innerHTML=""; return;} wrap?.classList.remove("hidden");
  box.innerHTML=mixedImageOrder.map(token=>{ if(token.type==="existing"){const img=postImages.find(x=>x.id===token.id);if(!img)return"";return `<div class="image-edit-row image-card-editor draggable-image-row" draggable="true" data-token="e:${img.id}" data-image-id="${img.id}"><button type="button" class="drag-handle">⋮⋮</button><div class="image-preview-wrap"><img src="${img.image_url}" alt=""><button type="button" class="image-x delete-mixed-existing" data-id="${img.id}">×</button></div><div class="image-edit-fields"><input class="existing-caption" data-id="${img.id}" type="text" value="${esc(img.caption||"")}" placeholder="이미지 캡션"></div></div>`;} const item=selectedNewFiles.find(x=>x.uid===token.uid);if(!item)return"";return `<div class="image-edit-row image-card-editor pending-image-row draggable-image-row" draggable="true" data-token="n:${item.uid}"><button type="button" class="drag-handle">⋮⋮</button><div class="image-preview-wrap"><img src="${item.preview}" alt=""><button type="button" class="image-x remove-mixed-new" data-uid="${item.uid}">×</button></div><div class="image-edit-fields"><input class="new-image-caption" data-uid="${item.uid}" type="text" value="${esc(item.caption||"")}" placeholder="이 이미지의 캡션"></div></div>`; }).join("");
  box.querySelectorAll(".existing-caption").forEach(input=>input.oninput=()=>{const img=postImages.find(x=>x.id===input.dataset.id);if(img)img.caption=input.value;});
  box.querySelectorAll(".new-image-caption").forEach(input=>input.oninput=()=>{const item=selectedNewFiles.find(x=>x.uid===input.dataset.uid);if(item)item.caption=input.value;});
  box.querySelectorAll(".remove-mixed-new").forEach(btn=>btn.onclick=()=>{const uid=btn.dataset.uid,item=selectedNewFiles.find(x=>x.uid===uid);try{if(item)URL.revokeObjectURL(item.preview)}catch{} selectedNewFiles=selectedNewFiles.filter(x=>x.uid!==uid);mixedImageOrder=mixedImageOrder.filter(x=>!(x.type==="new"&&x.uid===uid));renderMixedImageEditor();});
  box.querySelectorAll(".delete-mixed-existing").forEach(btn=>btn.onclick=async()=>{if(!confirm("이 이미지를 바로 삭제할까요?"))return;const image=postImages.find(x=>x.id===btn.dataset.id),path=storagePathFromUrl(image?.image_url);if(path)await db.storage.from("gallery").remove([path]);const{error}=await db.from("post_images").delete().eq("id",btn.dataset.id);if(error)return alert(error.message);postImages=postImages.filter(x=>x.id!==btn.dataset.id);mixedImageOrder=mixedImageOrder.filter(x=>!(x.type==="existing"&&x.id===btn.dataset.id));renderMixedImageEditor();renderProfile();renderLogs();renderGallery();});
  enableImageDrag(box,syncMixedImageOrderFromDom);
}
function enableImageDrag(container,onReorder){if(!container)return;let dragged=null;container.querySelectorAll(".draggable-image-row").forEach(row=>{row.addEventListener("dragstart",e=>{dragged=row;row.classList.add("dragging");if(e.dataTransfer)e.dataTransfer.effectAllowed="move";});row.addEventListener("dragend",()=>{row.classList.remove("dragging");dragged=null;onReorder?.();});row.addEventListener("dragover",e=>{e.preventDefault();if(!dragged||dragged===row)return;const r=row.getBoundingClientRect(),after=e.clientY>r.top+r.height/2;container.insertBefore(dragged,after?row.nextSibling:row);});});}
function syncMixedImageOrderFromDom(){mixedImageOrder=[...document.querySelectorAll("#existing-image-list [data-token]")].map(row=>row.dataset.token.startsWith("e:")?{type:"existing",id:row.dataset.token.slice(2)}:{type:"new",uid:row.dataset.token.slice(2)});}
function syncPendingImageOrderFromDom(){syncMixedImageOrderFromDom();}
async function saveExistingImageOrder(){syncMixedImageOrderFromDom();for(let i=0;i<mixedImageOrder.length;i++)if(mixedImageOrder[i].type==="existing"){const{error}=await db.from("post_images").update({sort_order:i}).eq("id",mixedImageOrder[i].id);if(error)throw error;}}
async function saveExistingImageEdits(){for(const input of document.querySelectorAll("#existing-image-list .existing-caption")){const{error}=await db.from("post_images").update({caption:input.value}).eq("id",input.dataset.id);if(error)throw error;}}
async function saveNewImages(kind,postId,sortOffset=0){syncMixedImageOrderFromDom();for(let i=0;i<mixedImageOrder.length;i++){const token=mixedImageOrder[i];if(token.type!=="new")continue;const item=selectedNewFiles.find(x=>x.uid===token.uid);if(!item)continue;const uploaded=await uploadImage(item.file,`${kind}/${postId}`);const{error}=await db.from("post_images").insert({character_id:characterId,section:kind,post_id:postId,image_url:uploaded.url,caption:item.caption||"",sort_order:i});if(error){await db.storage.from("gallery").remove([uploaded.path]);throw error;}}}
function renderAttachmentEditor(){const list=document.getElementById("attachment-edit-list");if(!list)return;list.innerHTML=editorAttachments.map((item,i)=>`<div class="attachment-edit-item"><div><strong>${esc(item.name||item.file?.name||"첨부파일")}</strong><span>${esc(item.type||item.file?.type||"FILE")} ${formatFileSize(item.size||item.file?.size)}</span></div><button type="button" class="ghost attachment-remove" data-index="${i}">삭제</button></div>`).join("");list.querySelectorAll(".attachment-remove").forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.index),item=editorAttachments[i];if(item?.existing){const path=storagePathFromUrl(item.url);if(path)removedAttachmentPaths.push(path);}editorAttachments.splice(i,1);renderAttachmentEditor();});}
document.getElementById("add-attachment-btn")?.addEventListener("click",()=>document.getElementById("edit-attachment-picker")?.click());
document.getElementById("edit-attachment-picker")?.addEventListener("change",e=>{for(const file of Array.from(e.target.files||[]))editorAttachments.push({existing:false,uid:crypto.randomUUID(),file,name:file.name,type:file.type||"application/octet-stream",size:file.size});e.target.value="";renderAttachmentEditor();});
async function saveAttachments(kind,postId){if(!(kind==="log"||kind==="gallery"))return;const saved=[];for(const item of editorAttachments){if(item.existing&&item.url){saved.push({name:item.name,url:item.url,type:item.type||"",size:item.size||0});continue;}if(!item.file)continue;const up=await uploadImage(item.file,`attachments/${kind}/${postId}`);saved.push({name:item.file.name,url:up.url,type:item.file.type||"application/octet-stream",size:item.file.size});}const table=kind==="log"?"logs":"gallery";const{error}=await db.from(table).update({attachments:saved}).eq("id",postId);if(error)throw error;if(removedAttachmentPaths.length)await db.storage.from("gallery").remove([...new Set(removedAttachmentPaths)]);}

document.getElementById("save-editor-btn").addEventListener("click", async () => {
  if (editorSaving) return;
  editorSaving = true;
  const saveButton = document.getElementById("save-editor-btn");
  saveButton.disabled = true;
  const kind = document.getElementById("edit-kind").value;
  const id = document.getElementById("edit-id").value;
  const msg = document.getElementById("editor-msg");

  try {
    msg.textContent = "저장 중...";

    const title = document.getElementById("edit-title").value.trim();
    const body = document.getElementById("edit-body").value;
    const lockPayload = await buildLockPayload(kind, id);
    let postId = id;

    if (!id) {
      let result;

      if (kind === "profile") {
        result = await db.from("profile_blocks").insert({
          character_id: characterId,
          block_type: "text",
          title,
          body,
          sort_order: Number(document.getElementById("edit-sort").value || 0)
        }).select().single();
      } else if (kind === "log") {
        result = await db.from("logs").insert({
          character_id: characterId,
          title,
          body,
          ...lockPayload
        }).select().single();
      } else {
        result = await db.from("gallery").insert({
          character_id: characterId,
          title,
          body,
          image_url: null,
          caption: null,
          ...lockPayload
        }).select().single();
      }

      if (result.error) throw result.error;
      postId = result.data.id;
    } else {
      let error;

      if (kind === "profile") {
        ({ error } = await db.from("profile_blocks").update({
          title,
          body,
          sort_order: Number(document.getElementById("edit-sort").value || 0)
        }).eq("id", id));
      } else if (kind === "log") {
        ({ error } = await db.from("logs").update({ title, body, ...lockPayload }).eq("id", id));
      } else {
        ({ error } = await db.from("gallery").update({ title, body, ...lockPayload }).eq("id", id));
      }

      if (error) throw error;
      await saveExistingImageEdits();
      await saveExistingImageOrder();
    }

    const existingCount = id ? document.querySelectorAll('#existing-image-list [data-image-id]').length : 0;
    await saveNewImages(kind, postId, existingCount);
    await saveAttachments(kind, postId);

    editor.close();
    await loadAll();
  } catch (e) {
    msg.textContent = e.message;
  } finally {
    editorSaving = false;
    saveButton.disabled = false;
  }
});

document.getElementById("delete-editor-btn").addEventListener("click", async () => {
  const kind = document.getElementById("edit-kind").value;
  const id = document.getElementById("edit-id").value;
  if (!id || !confirm("이 게시물을 삭제할까요?")) return;

  const imgs = imagesFor(kind, id);
  for (const image of imgs) {
    const path = storagePathFromUrl(image.image_url);
    if (path) await db.storage.from("gallery").remove([path]);
  }

  const { error: imageDeleteError } = await db
    .from("post_images")
    .delete()
    .eq("section", kind)
    .eq("post_id", id);

  if (imageDeleteError) {
    document.getElementById("editor-msg").textContent = imageDeleteError.message;
    return;
  }

  const postToDelete = findPost(kind, id);
  for (const file of safeAttachments(postToDelete?.attachments)) { const path=storagePathFromUrl(file.url); if(path) await db.storage.from("gallery").remove([path]); }
  const table = kind === "profile" ? "profile_blocks" : kind === "log" ? "logs" : "gallery";
  const { error } = await db.from(table).delete().eq("id", id);

  if (error) {
    document.getElementById("editor-msg").textContent = error.message;
    return;
  }

  editor.close();
  loadAll();
});

document.getElementById("edit-character-btn").addEventListener("click", () => {
  document.getElementById("char-name").value = character?.name || "";
  document.getElementById("char-summary").value = character?.summary || "";
  document.getElementById("char-hashtags").value = hashtagText(character?.hashtags);
  document.getElementById("char-species").value = character?.species || "";
  document.getElementById("char-age").value = character?.age || "";
  document.getElementById("char-body-info").value = character?.body_info || "";
  document.getElementById("char-family-profile").value = character?.family_profile || "";
  document.getElementById("char-coupling-name").value = character?.coupling_name || "";
  const couplingWrap = document.getElementById("coupling-input-wrap");
  const couplingToggle = document.getElementById("toggle-coupling-btn");
  const hasCoupling = !!String(character?.coupling_name || "").trim();
  couplingWrap.classList.toggle("hidden", !hasCoupling);
  couplingToggle.textContent = hasCoupling ? "♡ 커플링 정보" : "♡ 커플링 추가하기";
  document.getElementById("char-image").value = "";
  croppedCharacterFile = null;
  const charImageInput = document.getElementById("char-image");
  setCharacterCropPreview(charImageInput, character?.image_url || "", character?.image_url ? "현재 대표사진" : "");
  document.getElementById("char-msg").textContent = "";
  charEditor.showModal();
});

document.getElementById("toggle-coupling-btn")?.addEventListener("click", () => {
  const wrap = document.getElementById("coupling-input-wrap");
  wrap.classList.toggle("hidden");
  if (!wrap.classList.contains("hidden")) document.getElementById("char-coupling-name")?.focus();
});

document.getElementById("clear-coupling-btn")?.addEventListener("click", () => {
  document.getElementById("char-coupling-name").value = "";
  document.getElementById("coupling-input-wrap").classList.add("hidden");
  document.getElementById("toggle-coupling-btn").textContent = "♡ 커플링 추가하기";
});

document.getElementById("char-image").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const cropped = await window.cropSquareImage(file);
    if (cropped) {
      croppedCharacterFile = cropped;
      previewCharacterFile(e.target, cropped, "저장 전 미리보기");
      document.getElementById("char-msg").textContent = "정사각형 크롭이 적용됐어요. 아래 미리보기를 확인한 뒤 저장해 주세요.";
    }
    else { e.target.value = ""; croppedCharacterFile = null; }
  } catch (err) { document.getElementById("char-msg").textContent = err.message; }
});

document.getElementById("save-character-btn").addEventListener("click", async () => {
  const msg = document.getElementById("char-msg");

  try {
    msg.textContent = "저장 중...";

    const payload = {
      name: document.getElementById("char-name").value.trim(),
      summary: document.getElementById("char-summary").value.trim(),
      hashtags: normalizeHashtags(document.getElementById("char-hashtags").value),
      coupling_name: document.getElementById("char-coupling-name").value.trim() || null,
      species: document.getElementById("char-species").value.trim() || null,
      age: document.getElementById("char-age").value.trim() || null,
      body_info: document.getElementById("char-body-info").value.trim() || null,
      family_profile: document.getElementById("char-family-profile").value.trim() || null
    };

    const file = croppedCharacterFile || document.getElementById("char-image").files[0];
    if (file) {
      const uploaded = await uploadImage(file, "characters");
      payload.image_url = uploaded.url;
    }

    const { error } = await db.from("characters").update(payload).eq("id", characterId);
    if (error) throw error;

    charEditor.close();
    loadAll();
  } catch (e) {
    msg.textContent = e.message;
  }
});


document.getElementById("delete-character-btn").addEventListener("click", async () => {
  if (!confirm("이 캐릭터를 삭제할까요? 연결된 프로필/로그/갤러리 데이터도 함께 삭제됩니다.")) return;

  try {
    // Storage에 남아 있는 관련 이미지들을 가능한 범위에서 먼저 정리
    const urls = new Set();

    if (character?.image_url) urls.add(character.image_url);

    for (const p of profilePosts || []) {
      if (p.image_url) urls.add(p.image_url);
    }

    for (const g of galleryPosts || []) {
      if (g.image_url) urls.add(g.image_url);
    }

    for (const img of postImages || []) {
      if (img.image_url) urls.add(img.image_url);
    }

    const paths = [...urls]
      .map(storagePathFromUrl)
      .filter(Boolean);

    if (paths.length) {
      await db.storage.from("gallery").remove(paths);
    }

    const { error } = await db
      .from("characters")
      .delete()
      .eq("id", characterId);

    if (error) throw error;

    alert("캐릭터를 삭제했습니다.");
    window.spaNavigate("/characters");
  } catch (e) {
    alert("삭제 중 오류: " + e.message);
  }
});


ensureLockEditorUI();

(async function init(){
  await checkOwner();
  await loadAll();
})();

}
