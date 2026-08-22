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
let postSaving = false;
let editProfileRows = [];

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

  document.getElementById("pair-profile-grid").innerHTML = profiles.length ? profiles.map(p => `
    <article class="pair-member-card">
      <img src="${p.image_url || ""}" alt="${esc(p.name)}">
      <div class="pair-member-copy">
        <p class="eyebrow">MEMBER ${Number(p.sort_order)+1}</p>
        <h3>${esc(p.name)}</h3>
        <div class="post-body">${esc(p.profile_text || "").replace(/\n/g,"<br>")}</div>
      </div>
    </article>
  `).join("") : `<p class="muted">프로필이 없습니다.</p>`;

  document.getElementById("relationship-text").innerHTML =
    pair.relationship_text ? esc(pair.relationship_text).replace(/\n/g,"<br>") : `<span class="muted">관계성 설명이 없습니다.</span>`;

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


function renderProfileEditor() {
  if (profiles.length >= 2) {
    editProfileRows = profiles.map(x => ({...x, file:null, remove:false}));
  } else {
    editProfileRows = [
      ...(profiles.map(x => ({...x, file:null, remove:false}))),
      ...Array.from({length:2-profiles.length}, (_,i)=>({
        id:null, name:`인물 ${profiles.length+i+1}`, profile_text:"", image_url:null, preview_url:null, sort_order:profiles.length+i, file:null, remove:false
      }))
    ];
  }
  drawProfileEditor();
}

function drawProfileEditor() {
  document.getElementById("profile-editor-list").innerHTML = editProfileRows.map((p,i) => `
    <div class="member-editor-card" data-row="${i}">
      <div class="editor-top">
        <p class="eyebrow">MEMBER ${i+1}</p>
        ${editProfileRows.length > 2 ? `<button type="button" class="ghost remove-profile-row" data-index="${i}">이 인물 제거</button>` : ""}
      </div>
      <label>이름
        <input class="profile-name" data-index="${i}" type="text" value="${esc(p.name || "")}">
      </label>
      ${(p.preview_url || p.image_url) ? `<div class="profile-crop-preview-box"><img class="profile-editor-thumb profile-crop-preview" src="${p.preview_url || p.image_url}" alt=""><span>${p.preview_url ? "저장 전 미리보기" : "현재 대표사진"}</span></div>` : ""}
      <label>프로필 사진
        <input class="profile-image" data-index="${i}" type="file" accept="image/*">
      </label>
      <label>개별 프로필
        <textarea class="profile-text" data-index="${i}" rows="6">${esc(p.profile_text || "")}</textarea>
      </label>
    </div>
  `).join("");

  document.querySelectorAll(".remove-profile-row").forEach(btn => {
    btn.onclick = () => {
      editProfileRows.splice(Number(btn.dataset.index), 1);
      drawProfileEditor();
    };
  });
}

document.getElementById("profile-editor-list").addEventListener("change", async (e) => {
  const input = e.target.closest(".profile-image");
  if (!input) return;
  const index = Number(input.dataset.index);
  const file = input.files?.[0];
  if (!file || !editProfileRows[index]) return;
  try {
    const cropped = await window.cropSquareImage(file);
    if (cropped) {
      editProfileRows[index].file = cropped;
      const reader = new FileReader();
      reader.onload = () => {
        editProfileRows[index].preview_url = reader.result;
        drawProfileEditor();
      };
      reader.readAsDataURL(cropped);
      document.getElementById("profile-edit-msg").textContent = `${editProfileRows[index].name || "프로필"} 사진 크롭이 적용됐어요. 미리보기를 확인한 뒤 저장해 주세요.`;
    }
    else { input.value = ""; editProfileRows[index].file = null; }
  } catch (err) { document.getElementById("profile-edit-msg").textContent = err.message; }
});

document.getElementById("edit-pair-profile-btn").addEventListener("click", () => {
  renderProfileEditor();
  document.getElementById("relationship-edit").value = pair?.relationship_text || "";
  document.getElementById("profile-edit-msg").textContent = "";
  profileDialog.showModal();
});

document.getElementById("add-profile-person-btn").addEventListener("click", () => {
  if (editProfileRows.length >= 8) return alert("최대 8명까지 추가할 수 있습니다.");
  editProfileRows.push({
    id:null, name:`인물 ${editProfileRows.length+1}`, profile_text:"", image_url:null, preview_url:null,
    sort_order:editProfileRows.length, file:null, remove:false
  });
  drawProfileEditor();
});

document.getElementById("save-profile-btn").addEventListener("click", async () => {
  const msg = document.getElementById("profile-edit-msg");
  try {
    msg.textContent = "저장 중...";

    const names = Array.from(document.querySelectorAll(".profile-name"));
    const texts = Array.from(document.querySelectorAll(".profile-text"));
    const files = Array.from(document.querySelectorAll(".profile-image"));

    const newRows = [];
    for (let i=0; i<editProfileRows.length; i++) {
      const base = editProfileRows[i];
      let image_url = base.image_url || null;
      const file = base.file || files[i]?.files?.[0];
      if (file) {
        const up = await uploadImage(file, `pair/${pairId}/profiles`);
        image_url = up.url;
      }

      newRows.push({
        pair_id: pairId,
        name: names[i].value.trim() || `인물 ${i+1}`,
        profile_text: texts[i].value,
        image_url,
        sort_order: i
      });
    }

    const { error: relError } = await db.from("pairs").update({
      relationship_text: document.getElementById("relationship-edit").value
    }).eq("id", pairId);
    if (relError) throw relError;

    const { error: delError } = await db.from("pair_profiles").delete().eq("pair_id", pairId);
    if (delError) throw delError;

    const { error: insError } = await db.from("pair_profiles").insert(newRows);
    if (insError) throw insError;

    profileDialog.close();
    await loadPair();
  } catch (e) {
    msg.textContent = e.message;
  }
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
  selectedPostFiles = [];
  document.getElementById("post-kind").value = kind;
  document.getElementById("post-id").value = id;
  document.getElementById("post-title").value = "";
  document.getElementById("post-body").value = "";
  document.getElementById("post-image-picker").value = "";
  document.getElementById("post-new-caption-list").innerHTML = "";
  document.getElementById("post-existing-list").innerHTML = "";
  document.getElementById("post-existing-wrap").classList.add("hidden");
  document.getElementById("delete-post-btn").classList.toggle("hidden", !id);
  const currentPost = id ? posts.find(x=>x.id===id) : null;
  resetLockEditor(kind, currentPost);

  if (id) {
    const p = currentPost;
    document.getElementById("post-title").value = p?.title || "";
    document.getElementById("post-body").value = p?.body || "";
    const imgs = postImages(id);
    if (imgs.length) {
      document.getElementById("post-existing-wrap").classList.remove("hidden");
      document.getElementById("post-existing-list").innerHTML = imgs.map(img => `
        <div class="image-edit-row image-card-editor draggable-image-row" draggable="true" data-image-id="${img.id}">
          <button type="button" class="drag-handle" aria-label="이미지 순서 변경" title="드래그해서 순서 변경">⋮⋮</button>
          <div class="image-preview-wrap">
            <img src="${img.image_url}" alt="">
            <button type="button" class="image-x delete-pair-existing-now" data-id="${img.id}" aria-label="이미지 삭제">×</button>
          </div>
          <div class="image-edit-fields">
            <input class="existing-caption" data-id="${img.id}" type="text" value="${esc(img.caption || "")}" placeholder="이미지 캡션">
          </div>
        </div>
      `).join("");

      document.querySelectorAll(".delete-pair-existing-now").forEach(btn => {
        btn.onclick = async () => {
          if (!confirm("이 이미지를 바로 삭제할까요?")) return;
          const image = images.find(x => x.id === btn.dataset.id);
          const path = storagePathFromUrl(image?.image_url);
          if (path) await db.storage.from("gallery").remove([path]);
          const { error } = await db.from("pair_post_images").delete().eq("id", btn.dataset.id);
          if (error) return alert(error.message);
          images = images.filter(x => x.id !== btn.dataset.id);
          openPostEditor(kind, id);
          renderPosts("log"); renderPosts("gallery");
        };
      });

      enablePairImageDrag(document.getElementById("post-existing-list"));
    }
  }

  document.getElementById("post-dialog-title").textContent = kind === "log" ? "PAIR LOG 편집" : "PAIR GALLERY 편집";
  postDialog.showModal();
}

document.getElementById("add-post-image-btn").addEventListener("click", () => {
  document.getElementById("post-image-picker").click();
});

document.getElementById("post-image-picker").addEventListener("change", e => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    selectedPostFiles.push({
      file,
      caption: "",
      preview: URL.createObjectURL(file)
    });
  }

  e.target.value = "";
  renderPendingPairImages();
});

function renderPendingPairImages() {
  document.getElementById("post-new-caption-list").innerHTML = selectedPostFiles.map((item,i)=>`
    <div class="image-edit-row image-card-editor pending-image-row draggable-image-row" draggable="true" data-index="${i}">
      <button type="button" class="drag-handle" aria-label="이미지 순서 변경" title="드래그해서 순서 변경">⋮⋮</button>
      <div class="image-preview-wrap">
        <img src="${item.preview}" alt="">
        <button type="button" class="image-x remove-pending-pair-image" data-index="${i}" aria-label="선택 이미지 제거">×</button>
      </div>
      <div class="image-edit-fields">
        <input class="new-image-caption" data-index="${i}" type="text" value="${esc(item.caption || "")}" placeholder="이미지 캡션">
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".new-image-caption").forEach(input => {
    input.oninput = () => selectedPostFiles[Number(input.dataset.index)].caption = input.value;
  });

  document.querySelectorAll(".remove-pending-pair-image").forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.dataset.index);
      try { URL.revokeObjectURL(selectedPostFiles[i].preview); } catch {}
      selectedPostFiles.splice(i,1);
      renderPendingPairImages();
    };
  });

  enablePairImageDrag(document.getElementById("post-new-caption-list"), syncPendingPairImageOrder);
}

function enablePairImageDrag(container, onReorder) {
  if (!container) return;
  let dragged = null;
  container.querySelectorAll('.draggable-image-row').forEach(row => {
    row.addEventListener('dragstart', e => {
      dragged = row;
      row.classList.add('dragging');
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      dragged = null;
      onReorder?.();
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragged || dragged === row) return;
      const rect = row.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      container.insertBefore(dragged, after ? row.nextSibling : row);
    });
  });
}

function syncPendingPairImageOrder() {
  const rows = [...document.querySelectorAll('#post-new-caption-list .pending-image-row')];
  const next = rows.map(row => selectedPostFiles[Number(row.dataset.index)]).filter(Boolean);
  if (next.length === selectedPostFiles.length) {
    selectedPostFiles = next;
    renderPendingPairImages();
  }
}

async function saveExistingPairImageOrder() {
  const rows = [...document.querySelectorAll('#post-existing-list [data-image-id]')];
  for (let i = 0; i < rows.length; i++) {
    const { error } = await db.from('pair_post_images').update({ sort_order: i }).eq('id', rows[i].dataset.imageId);
    if (error) throw error;
  }
}

async function saveExistingImages() {
  for (const input of document.querySelectorAll(".existing-caption")) {
    const { error } = await db.from("pair_post_images").update({ caption: input.value }).eq("id", input.dataset.id);
    if (error) throw error;
  }
}

async function saveNewImages(postId, sortOffset = 0) {
  for (let i=0; i<selectedPostFiles.length; i++) {
    const item = selectedPostFiles[i];
    const up = await uploadImage(item.file, `pair/${pairId}/${postId}`);
    const caption = item.caption || "";
    const { error } = await db.from("pair_post_images").insert({
      pair_id:pairId, post_id:postId, image_url:up.url, caption, sort_order:sortOffset + i
    });
    if (error) throw error;
  }
}

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
  const { error } = await db.from("pair_posts").delete().eq("id", id);
  if (error) return document.getElementById("post-edit-msg").textContent = error.message;
  postDialog.close();
  loadPair();
});

ensureLockEditorUI();

(async function init(){
  await checkOwner();
  await createPairIfNeeded();
  if (pairId) await loadPair();
})();

}
