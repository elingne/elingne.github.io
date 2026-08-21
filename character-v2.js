const characterId = new URLSearchParams(location.search).get("id");
let isOwner = false;
let character = null;
let profileBlocks = [];
let logs = [];
let galleryPosts = [];

const editor = document.getElementById("editor-dialog");
const charEditor = document.getElementById("character-dialog");

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

async function checkOwner() {
  const { data } = await db.auth.getSession();
  isOwner = !!data.session;
  document.querySelectorAll(".owner-only").forEach(x => x.classList.toggle("hidden", !isOwner));
  document.getElementById("owner-character-tools").classList.toggle("hidden", !isOwner);
  const link = document.getElementById("auth-link");
  if (isOwner) {
    link.textContent = "LOGOUT";
    link.href = "#";
    link.onclick = async (e) => {
      e.preventDefault();
      await db.auth.signOut();
      location.reload();
    };
  }
}

async function uploadImage(file, folder) {
  if (!file) return null;
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("gallery").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

function storagePathFromUrl(url) {
  const marker = "/storage/v1/object/public/gallery/";
  const idx = (url || "").indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

async function loadAll() {
  if (!characterId) return;
  const [charRes, profileRes, logRes, galleryRes] = await Promise.all([
    db.from("characters").select("*").eq("id", characterId).single(),
    db.from("profile_blocks").select("*").eq("character_id", characterId).order("sort_order").order("created_at"),
    db.from("logs").select("*").eq("character_id", characterId).order("created_at", {ascending:false}),
    db.from("gallery").select("*").eq("character_id", characterId).order("created_at", {ascending:false})
  ]);

  character = charRes.data;
  profileBlocks = profileRes.data || [];
  logs = logRes.data || [];
  galleryPosts = galleryRes.data || [];

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
      <p class="muted">${esc(character.summary || "")}</p>
    </div>`;
}

function ownerButtons(kind, id) {
  if (!isOwner) return "";
  return `<div class="post-tools"><button class="ghost edit-post" data-kind="${kind}" data-id="${id}">수정</button></div>`;
}

function renderProfile() {
  const feed = document.getElementById("profile-feed");
  if (!profileBlocks.length && character?.profile) {
    feed.innerHTML = `<article class="feed-post profile-text"><div class="post-body">${esc(character.profile).replace(/\n/g,"<br>")}</div></article>
    ${isOwner ? `<p class="muted">기존 프로필 텍스트입니다. 새 방식에서는 + 프로필 블록으로 텍스트/이미지를 추가할 수 있습니다.</p>` : ""}`;
  } else if (!profileBlocks.length) {
    feed.innerHTML = `<p class="muted">등록된 프로필 내용이 없습니다.</p>`;
  } else {
    feed.innerHTML = profileBlocks.map(b => {
      if (b.block_type === "image") {
        return `<article class="feed-post image-post">
          ${ownerButtons("profile", b.id)}
          <img src="${b.image_url || ""}" alt="${esc(b.caption || character.name)}">
          ${b.caption ? `<p class="caption">${esc(b.caption)}</p>` : ""}
          ${b.body ? `<div class="post-body">${esc(b.body).replace(/\n/g,"<br>")}</div>` : ""}
        </article>`;
      }
      return `<article class="feed-post profile-text">
        ${ownerButtons("profile", b.id)}
        <div class="post-body">${esc(b.body || "").replace(/\n/g,"<br>")}</div>
      </article>`;
    }).join("");
  }
  bindEditButtons();
}

function renderLogs() {
  const feed = document.getElementById("log-feed");
  feed.innerHTML = logs.length ? logs.map(p => `
    <article class="feed-post">
      ${ownerButtons("log", p.id)}
      <p class="post-date">${new Date(p.created_at).toLocaleDateString("ko-KR")}</p>
      <h3>${esc(p.title || "LOG")}</h3>
      <div class="post-body">${esc(p.body || "").replace(/\n/g,"<br>")}</div>
    </article>`).join("") : `<p class="muted">등록된 로그가 없습니다.</p>`;
  bindEditButtons();
}

function renderGallery() {
  const feed = document.getElementById("gallery-feed");
  feed.innerHTML = galleryPosts.length ? galleryPosts.map(p => `
    <article class="gallery-post">
      ${ownerButtons("gallery", p.id)}
      <img src="${p.image_url}" alt="${esc(p.caption || character.name)}">
      <div class="gallery-copy">
        <p class="post-date">${new Date(p.created_at).toLocaleDateString("ko-KR")}</p>
        ${p.caption ? `<div class="post-body">${esc(p.caption).replace(/\n/g,"<br>")}</div>` : ""}
      </div>
    </article>`).join("") : `<p class="muted">등록된 이미지가 없습니다.</p>`;
  bindEditButtons();
}

function bindEditButtons() {
  document.querySelectorAll(".edit-post").forEach(btn => {
    btn.onclick = () => openEditor(btn.dataset.kind, btn.dataset.id);
  });
}

document.querySelectorAll("[data-open-editor]").forEach(btn => {
  btn.addEventListener("click", () => openEditor(btn.dataset.openEditor));
});

function resetEditor() {
  ["edit-id","edit-title","edit-body","edit-caption"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("edit-image").value = "";
  document.getElementById("edit-sort").value = "0";
  document.getElementById("delete-editor-btn").classList.add("hidden");
  document.getElementById("editor-msg").textContent = "";
}

function show(id, yes) {
  document.getElementById(id).classList.toggle("hidden", !yes);
}

function openEditor(kind, id = "") {
  resetEditor();
  document.getElementById("edit-kind").value = kind;
  document.getElementById("edit-id").value = id;

  show("profile-type-wrap", kind === "profile");
  show("title-wrap", kind === "log");
  show("image-wrap", kind === "gallery" || kind === "profile");
  show("caption-wrap", kind === "gallery" || kind === "profile");
  show("sort-wrap", kind === "profile");
  show("body-wrap", kind !== "gallery");

  document.getElementById("editor-title").textContent =
    kind === "profile" ? "프로필 블록 편집" : kind === "log" ? "로그 게시물 편집" : "갤러리 게시물 편집";

  if (id) {
    document.getElementById("delete-editor-btn").classList.remove("hidden");
    if (kind === "profile") {
      const p = profileBlocks.find(x => x.id === id);
      document.getElementById("profile-type").value = p.block_type;
      document.getElementById("edit-body").value = p.body || "";
      document.getElementById("edit-caption").value = p.caption || "";
      document.getElementById("edit-sort").value = p.sort_order || 0;
    } else if (kind === "log") {
      const p = logs.find(x => x.id === id);
      document.getElementById("edit-title").value = p.title || "";
      document.getElementById("edit-body").value = p.body || "";
    } else {
      const p = galleryPosts.find(x => x.id === id);
      document.getElementById("edit-caption").value = p.caption || "";
    }
  }
  editor.showModal();
}

document.getElementById("profile-type").addEventListener("change", e => {
  const isImage = e.target.value === "image";
  show("image-wrap", isImage);
  show("caption-wrap", isImage);
});

document.getElementById("save-editor-btn").addEventListener("click", async () => {
  const kind = document.getElementById("edit-kind").value;
  const id = document.getElementById("edit-id").value;
  const msg = document.getElementById("editor-msg");
  try {
    msg.textContent = "저장 중...";
    if (kind === "profile") {
      const block_type = document.getElementById("profile-type").value;
      const body = document.getElementById("edit-body").value;
      const caption = document.getElementById("edit-caption").value;
      const sort_order = Number(document.getElementById("edit-sort").value || 0);
      let image_url;
      const file = document.getElementById("edit-image").files[0];
      if (file) image_url = await uploadImage(file, "profile");

      const payload = { character_id: characterId, block_type, body, caption, sort_order };
      if (image_url) payload.image_url = image_url;
      let error;
      if (id) ({error} = await db.from("profile_blocks").update(payload).eq("id", id));
      else ({error} = await db.from("profile_blocks").insert(payload));
      if (error) throw error;
    } else if (kind === "log") {
      const payload = {
        character_id: characterId,
        title: document.getElementById("edit-title").value,
        body: document.getElementById("edit-body").value
      };
      let error;
      if (id) ({error} = await db.from("logs").update(payload).eq("id", id));
      else ({error} = await db.from("logs").insert(payload));
      if (error) throw error;
    } else {
      const caption = document.getElementById("edit-caption").value;
      let image_url;
      const file = document.getElementById("edit-image").files[0];
      if (file) image_url = await uploadImage(file, "gallery");
      if (!id && !image_url) throw new Error("이미지를 선택해주세요.");
      const payload = { character_id: characterId, caption };
      if (image_url) payload.image_url = image_url;
      let error;
      if (id) ({error} = await db.from("gallery").update(payload).eq("id", id));
      else ({error} = await db.from("gallery").insert(payload));
      if (error) throw error;
    }
    editor.close();
    await loadAll();
  } catch (e) {
    msg.textContent = e.message;
  }
});

document.getElementById("delete-editor-btn").addEventListener("click", async () => {
  const kind = document.getElementById("edit-kind").value;
  const id = document.getElementById("edit-id").value;
  if (!id || !confirm("이 게시물을 삭제할까요?")) return;
  let row, table;
  if (kind === "profile") { row = profileBlocks.find(x => x.id === id); table = "profile_blocks"; }
  if (kind === "log") { row = logs.find(x => x.id === id); table = "logs"; }
  if (kind === "gallery") { row = galleryPosts.find(x => x.id === id); table = "gallery"; }

  if (row?.image_url) {
    const path = storagePathFromUrl(row.image_url);
    if (path) await db.storage.from("gallery").remove([path]);
  }
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
  document.getElementById("char-image").value = "";
  charEditor.showModal();
});

document.getElementById("save-character-btn").addEventListener("click", async () => {
  const msg = document.getElementById("char-msg");
  try {
    const payload = {
      name: document.getElementById("char-name").value.trim(),
      summary: document.getElementById("char-summary").value.trim()
    };
    const file = document.getElementById("char-image").files[0];
    if (file) payload.image_url = await uploadImage(file, "characters");
    const { error } = await db.from("characters").update(payload).eq("id", characterId);
    if (error) throw error;
    charEditor.close();
    loadAll();
  } catch (e) {
    msg.textContent = e.message;
  }
});

(async function init(){
  await checkOwner();
  await loadAll();
})();
