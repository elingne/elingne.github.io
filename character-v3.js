const characterId = new URLSearchParams(location.search).get("id");

let isOwner = false;
let character = null;
let profilePosts = [];
let logs = [];
let galleryPosts = [];
let postImages = [];

let selectedNewFiles = [];

const editor = document.getElementById("editor-dialog");
const charEditor = document.getElementById("character-dialog");

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
  document.getElementById("owner-character-tools").classList.toggle("hidden", !isOwner);

  const link = document.getElementById("auth-link");
  if (isOwner) {
    link.textContent = "LOGOUT";
    link.href = "#";
    link.onclick = async e => {
      e.preventDefault();
      await db.auth.signOut();
      location.reload();
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
      <p class="muted">${esc(character.summary || "")}</p>
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

  feed.innerHTML = logs.length
    ? logs.map(p => `
        <article class="feed-post">
          ${postTools("log", p.id)}
          <p class="post-date">${new Date(p.created_at).toLocaleDateString("ko-KR")}</p>
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}
          ${p.body ? `<div class="post-body">${esc(p.body).replace(/\n/g,"<br>")}</div>` : ""}
          ${renderImages("log", p.id)}
        </article>
      `).join("")
    : `<p class="muted">등록된 로그가 없습니다.</p>`;

  bindEditButtons();
}

function renderGallery() {
  const feed = document.getElementById("gallery-feed");

  feed.innerHTML = galleryPosts.length
    ? galleryPosts.map(p => `
        <article class="feed-post gallery-post-v3">
          ${postTools("gallery", p.id)}
          <p class="post-date">${new Date(p.created_at).toLocaleDateString("ko-KR")}</p>
          ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}
          ${p.body ? `<div class="post-body">${esc(p.body).replace(/\n/g,"<br>")}</div>` : ""}
          ${renderImages("gallery", p.id)}
          ${p.image_url ? `
            <figure class="legacy-image">
              <img src="${p.image_url}" alt="${esc(p.caption || "")}">
              ${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
            </figure>` : ""}
        </article>
      `).join("")
    : `<p class="muted">등록된 갤러리 게시물이 없습니다.</p>`;

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
  document.getElementById("edit-images").value = "";
  document.getElementById("new-image-caption-list").innerHTML = "";
  document.getElementById("existing-image-list").innerHTML = "";
  document.getElementById("existing-images-wrap").classList.add("hidden");
  document.getElementById("delete-editor-btn").classList.add("hidden");
  document.getElementById("editor-msg").textContent = "";
  selectedNewFiles = [];
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

  if (id) {
    const p = findPost(kind, id);
    document.getElementById("delete-editor-btn").classList.remove("hidden");
    document.getElementById("edit-title").value = p?.title || "";
    document.getElementById("edit-body").value = p?.body || "";
    if (kind === "profile") document.getElementById("edit-sort").value = p?.sort_order || 0;

    renderExistingImages(kind, id);
  }

  editor.showModal();
}

function renderExistingImages(kind, postId) {
  const imgs = imagesFor(kind, postId);
  if (!imgs.length) return;

  document.getElementById("existing-images-wrap").classList.remove("hidden");
  document.getElementById("existing-image-list").innerHTML = imgs.map(img => `
    <div class="image-edit-row" data-image-id="${img.id}">
      <img src="${img.image_url}" alt="">
      <div class="image-edit-fields">
        <input class="existing-caption" type="text" value="${esc(img.caption || "")}" placeholder="이미지 캡션">
        <label class="inline-check">
          <input class="delete-existing-image" type="checkbox">
          이 이미지 삭제
        </label>
      </div>
    </div>
  `).join("");
}

document.getElementById("edit-images").addEventListener("change", e => {
  selectedNewFiles = Array.from(e.target.files || []);
  const box = document.getElementById("new-image-caption-list");

  box.innerHTML = selectedNewFiles.map((file, index) => `
    <div class="new-image-row">
      <span class="file-name">${esc(file.name)}</span>
      <input type="text" class="new-image-caption" data-index="${index}" placeholder="이 이미지의 캡션">
    </div>
  `).join("");
});

async function saveExistingImageEdits() {
  const rows = Array.from(document.querySelectorAll(".image-edit-row"));

  for (const row of rows) {
    const id = row.dataset.imageId;
    const caption = row.querySelector(".existing-caption").value;
    const shouldDelete = row.querySelector(".delete-existing-image").checked;
    const image = postImages.find(x => x.id === id);

    if (shouldDelete) {
      const path = storagePathFromUrl(image?.image_url);
      if (path) await db.storage.from("gallery").remove([path]);
      const { error } = await db.from("post_images").delete().eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("post_images").update({ caption }).eq("id", id);
      if (error) throw error;
    }
  }
}

async function saveNewImages(kind, postId) {
  const captions = Array.from(document.querySelectorAll(".new-image-caption"));

  for (let i = 0; i < selectedNewFiles.length; i++) {
    const file = selectedNewFiles[i];
    const captionInput = captions.find(x => Number(x.dataset.index) === i);
    const caption = captionInput?.value || "";
    const uploaded = await uploadImage(file, `${kind}/${postId}`);

    const { error } = await db.from("post_images").insert({
      character_id: characterId,
      section: kind,
      post_id: postId,
      image_url: uploaded.url,
      caption,
      sort_order: i
    });

    if (error) {
      await db.storage.from("gallery").remove([uploaded.path]);
      throw error;
    }
  }
}

document.getElementById("save-editor-btn").addEventListener("click", async () => {
  const kind = document.getElementById("edit-kind").value;
  const id = document.getElementById("edit-id").value;
  const msg = document.getElementById("editor-msg");

  try {
    msg.textContent = "저장 중...";

    const title = document.getElementById("edit-title").value.trim();
    const body = document.getElementById("edit-body").value;
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
          body
        }).select().single();
      } else {
        result = await db.from("gallery").insert({
          character_id: characterId,
          title,
          body,
          image_url: null,
          caption: null
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
        ({ error } = await db.from("logs").update({ title, body }).eq("id", id));
      } else {
        ({ error } = await db.from("gallery").update({ title, body }).eq("id", id));
      }

      if (error) throw error;
      await saveExistingImageEdits();
    }

    await saveNewImages(kind, postId);

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
  document.getElementById("char-image").value = "";
  document.getElementById("char-msg").textContent = "";
  charEditor.showModal();
});

document.getElementById("save-character-btn").addEventListener("click", async () => {
  const msg = document.getElementById("char-msg");

  try {
    msg.textContent = "저장 중...";

    const payload = {
      name: document.getElementById("char-name").value.trim(),
      summary: document.getElementById("char-summary").value.trim()
    };

    const file = document.getElementById("char-image").files[0];
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

(async function init(){
  await checkOwner();
  await loadAll();
})();
