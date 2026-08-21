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
let editorSaving = false;
let croppedCharacterFile = null;

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
  const title = post.title || (kind === "log" ? "LOG" : "GALLERY");
  const bodyText = (post.body || post.caption || "").replace(/\n/g, " ").trim();

  return `
    <article class="post-card open-post-card" data-kind="${kind}" data-id="${post.id}" tabindex="0">
      <div class="post-card-thumb ${thumb ? "" : "no-image"}">
        ${thumb ? `<img src="${thumb}" alt="">` : `<span>${kind === "log" ? "LOG" : "IMAGE"}</span>`}
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

function openPostViewer(kind, id) {
  const post = kind === "log"
    ? logs.find(x => x.id === id)
    : galleryPosts.find(x => x.id === id);

  if (!post) return;

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
    <div class="image-edit-row image-card-editor draggable-image-row" draggable="true" data-image-id="${img.id}">
      <button type="button" class="drag-handle" aria-label="이미지 순서 변경" title="드래그해서 순서 변경">⋮⋮</button>
      <div class="image-preview-wrap">
        <img src="${img.image_url}" alt="">
        <button type="button" class="image-x delete-existing-now" data-id="${img.id}" aria-label="이미지 삭제">×</button>
      </div>
      <div class="image-edit-fields">
        <input class="existing-caption" data-id="${img.id}" type="text" value="${esc(img.caption || "")}" placeholder="이미지 캡션">
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".delete-existing-now").forEach(btn => {
    btn.onclick = async () => {
      if (!confirm("이 이미지를 바로 삭제할까요?")) return;
      const id = btn.dataset.id;
      const image = postImages.find(x => x.id === id);
      const path = storagePathFromUrl(image?.image_url);
      if (path) await db.storage.from("gallery").remove([path]);
      const { error } = await db.from("post_images").delete().eq("id", id);
      if (error) return alert(error.message);
      postImages = postImages.filter(x => x.id !== id);
      renderExistingImages(kind, postId);
      if (!imagesFor(kind, postId).length) {
        document.getElementById("existing-images-wrap").classList.add("hidden");
      }
      renderProfile(); renderLogs(); renderGallery();
    };
  });

  enableImageDrag(document.getElementById("existing-image-list"));
}

document.getElementById("add-image-btn").addEventListener("click", () => {
  document.getElementById("edit-image-picker").click();
});

document.getElementById("edit-image-picker").addEventListener("change", e => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    selectedNewFiles.push({
      file,
      caption: "",
      preview: URL.createObjectURL(file)
    });
  }

  e.target.value = "";
  renderPendingImages();
});

function renderPendingImages() {
  const box = document.getElementById("new-image-caption-list");
  box.innerHTML = selectedNewFiles.map((item, index) => `
    <div class="image-edit-row image-card-editor pending-image-row draggable-image-row" draggable="true" data-index="${index}">
      <button type="button" class="drag-handle" aria-label="이미지 순서 변경" title="드래그해서 순서 변경">⋮⋮</button>
      <div class="image-preview-wrap">
        <img src="${item.preview}" alt="">
        <button type="button" class="image-x remove-pending-image" data-index="${index}" aria-label="선택 이미지 제거">×</button>
      </div>
      <div class="image-edit-fields">
        <input type="text" class="new-image-caption" data-index="${index}" value="${esc(item.caption || "")}" placeholder="이 이미지의 캡션">
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".new-image-caption").forEach(input => {
    input.oninput = () => {
      selectedNewFiles[Number(input.dataset.index)].caption = input.value;
    };
  });

  document.querySelectorAll(".remove-pending-image").forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.dataset.index);
      try { URL.revokeObjectURL(selectedNewFiles[i].preview); } catch {}
      selectedNewFiles.splice(i, 1);
      renderPendingImages();
    };
  });

  enableImageDrag(box, syncPendingImageOrderFromDom);
}

function enableImageDrag(container, onReorder) {
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

function syncPendingImageOrderFromDom() {
  const rows = [...document.querySelectorAll('#new-image-caption-list .pending-image-row')];
  if (!rows.length) return;
  const next = rows.map(row => selectedNewFiles[Number(row.dataset.index)]).filter(Boolean);
  if (next.length === selectedNewFiles.length) {
    selectedNewFiles = next;
    renderPendingImages();
  }
}

async function saveExistingImageOrder() {
  const rows = [...document.querySelectorAll('#existing-image-list [data-image-id]')];
  for (let i = 0; i < rows.length; i++) {
    const { error } = await db.from('post_images').update({ sort_order: i }).eq('id', rows[i].dataset.imageId);
    if (error) throw error;
  }
}

async function saveExistingImageEdits() {
  const inputs = Array.from(document.querySelectorAll(".existing-caption"));
  for (const input of inputs) {
    const { error } = await db.from("post_images").update({ caption: input.value }).eq("id", input.dataset.id);
    if (error) throw error;
  }
}

async function saveNewImages(kind, postId, sortOffset = 0) {
  for (let i = 0; i < selectedNewFiles.length; i++) {
    const item = selectedNewFiles[i];
    const file = item.file;
    const caption = item.caption || "";
    const uploaded = await uploadImage(file, `${kind}/${postId}`);

    const { error } = await db.from("post_images").insert({
      character_id: characterId,
      section: kind,
      post_id: postId,
      image_url: uploaded.url,
      caption,
      sort_order: sortOffset + i
    });

    if (error) {
      await db.storage.from("gallery").remove([uploaded.path]);
      throw error;
    }
  }
}

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
      await saveExistingImageOrder();
    }

    const existingCount = id ? document.querySelectorAll('#existing-image-list [data-image-id]').length : 0;
    await saveNewImages(kind, postId, existingCount);

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
  croppedCharacterFile = null;
  document.getElementById("char-msg").textContent = "";
  charEditor.showModal();
});

document.getElementById("char-image").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const cropped = await window.cropSquareImage(file);
    if (cropped) { croppedCharacterFile = cropped; document.getElementById("char-msg").textContent = "정사각형 크롭이 적용됐어요."; }
    else { e.target.value = ""; croppedCharacterFile = null; }
  } catch (err) { document.getElementById("char-msg").textContent = err.message; }
});

document.getElementById("save-character-btn").addEventListener("click", async () => {
  const msg = document.getElementById("char-msg");

  try {
    msg.textContent = "저장 중...";

    const payload = {
      name: document.getElementById("char-name").value.trim(),
      summary: document.getElementById("char-summary").value.trim()
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


(async function init(){
  await checkOwner();
  await loadAll();
})();

}
