const params = new URLSearchParams(location.search);
let pairId = params.get("id");
const newMode = params.get("new") === "1";

let isOwner = false;
let pair = null;
let allCharacters = [];
let members = [];
let posts = [];
let images = [];
let selectedPostFiles = [];

const pairDialog = document.getElementById("pair-dialog");
const profileDialog = document.getElementById("profile-dialog");
const postDialog = document.getElementById("post-dialog");

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
      location.href = "index.html#pairs";
    };
  }
}

async function uploadImage(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("gallery").upload(path, file, { upsert:false });
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

async function loadCharacters() {
  const { data } = await db.from("characters").select("*").order("created_at");
  allCharacters = data || [];
}

async function loadPair() {
  if (!pairId) return;

  const [pairRes, memberRes, postRes, imageRes] = await Promise.all([
    db.from("pairs").select("*").eq("id", pairId).single(),
    db.from("pair_members")
      .select("*, characters(id,name,summary,image_url)")
      .eq("pair_id", pairId)
      .order("sort_order"),
    db.from("pair_posts")
      .select("*")
      .eq("pair_id", pairId)
      .order("created_at", { ascending:false }),
    db.from("pair_post_images")
      .select("*")
      .eq("pair_id", pairId)
      .order("sort_order")
      .order("created_at")
  ]);

  pair = pairRes.data;
  members = memberRes.data || [];
  posts = postRes.data || [];
  images = imageRes.data || [];

  renderHead();
  renderProfile();
  renderPosts("log");
  renderPosts("gallery");
}

function renderHead() {
  if (!pair) return;
  document.title = `${pair.name} | elingne archive`;
  document.getElementById("pair-name").textContent = pair.name;
  document.getElementById("pair-summary").textContent = pair.summary || "";
}

function renderProfile() {
  const grid = document.getElementById("pair-member-grid");

  grid.innerHTML = members.length ? members.map(m => `
    <article class="pair-member-card">
      <img src="${m.characters?.image_url || ""}" alt="${esc(m.characters?.name || "")}">
      <div class="pair-member-copy">
        <p class="eyebrow">MEMBER ${Number(m.sort_order || 0) + 1}</p>
        <h3>${esc(m.characters?.name || "")}</h3>
        <div class="post-body">${esc(m.profile_text || "").replace(/\n/g,"<br>")}</div>
      </div>
    </article>
  `).join("") : `<p class="muted">아직 등록된 캐릭터가 없습니다.</p>`;

  document.getElementById("relationship-text").innerHTML =
    pair?.relationship_text
      ? esc(pair.relationship_text).replace(/\n/g,"<br>")
      : `<span class="muted">관계성 설명이 없습니다.</span>`;
}

function postImages(postId) {
  return images
    .filter(x => x.post_id === postId)
    .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function renderImageGrid(postId) {
  const imgs = postImages(postId);
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

function renderPosts(kind) {
  const target = document.getElementById(kind === "log" ? "pair-log-feed" : "pair-gallery-feed");
  const list = posts.filter(x => x.section === kind);

  target.innerHTML = list.length ? list.map(p => `
    <article class="feed-post">
      ${isOwner ? `<div class="post-tools"><button class="ghost edit-pair-post" data-kind="${kind}" data-id="${p.id}">수정</button></div>` : ""}
      <p class="post-date">${new Date(p.created_at).toLocaleDateString("ko-KR")}</p>
      ${p.title ? `<h3>${esc(p.title)}</h3>` : ""}
      ${p.body ? `<div class="post-body">${esc(p.body).replace(/\n/g,"<br>")}</div>` : ""}
      ${renderImageGrid(p.id)}
    </article>
  `).join("") : `<p class="muted">등록된 게시물이 없습니다.</p>`;

  document.querySelectorAll(".edit-pair-post").forEach(btn => {
    btn.onclick = () => openPostEditor(btn.dataset.kind, btn.dataset.id);
  });
}

function renderMemberEditor() {
  const wrap = document.getElementById("member-editor-list");
  const current = [...members].sort((a,b) => (a.sort_order||0) - (b.sort_order||0));

  wrap.innerHTML = [0,1,2,3].map(i => {
    const member = current[i];
    const options = [`<option value="">선택 안 함</option>`].concat(
      allCharacters.map(c => `
        <option value="${c.id}" ${member?.character_id === c.id ? "selected" : ""}>${esc(c.name)}</option>
      `)
    ).join("");

    return `
      <div class="member-editor-card">
        <p class="eyebrow">MEMBER ${i+1}</p>
        <label>캐릭터
          <select class="member-character" data-index="${i}">${options}</select>
        </label>
        <label>이 페어에서의 프로필
          <textarea class="member-profile" data-index="${i}" rows="6">${esc(member?.profile_text || "")}</textarea>
        </label>
      </div>
    `;
  }).join("");

  document.getElementById("relationship-edit").value = pair?.relationship_text || "";
}

document.getElementById("edit-pair-profile-btn").addEventListener("click", () => {
  renderMemberEditor();
  document.getElementById("profile-edit-msg").textContent = "";
  profileDialog.showModal();
});

document.getElementById("save-profile-btn").addEventListener("click", async () => {
  const msg = document.getElementById("profile-edit-msg");
  try {
    msg.textContent = "저장 중...";

    const selects = Array.from(document.querySelectorAll(".member-character"));
    const profiles = Array.from(document.querySelectorAll(".member-profile"));

    const selected = selects
      .map((s, i) => ({ character_id: s.value, profile_text: profiles[i].value, sort_order: i }))
      .filter(x => x.character_id);

    const ids = selected.map(x => x.character_id);
    if (new Set(ids).size !== ids.length) throw new Error("같은 캐릭터를 중복 선택할 수 없습니다.");
    if (selected.length > 4) throw new Error("캐릭터는 최대 4명까지 선택할 수 있습니다.");

    const { error: relError } = await db
      .from("pairs")
      .update({ relationship_text: document.getElementById("relationship-edit").value })
      .eq("id", pairId);

    if (relError) throw relError;

    const { error: delError } = await db.from("pair_members").delete().eq("pair_id", pairId);
    if (delError) throw delError;

    if (selected.length) {
      const { error: insError } = await db.from("pair_members").insert(
        selected.map(x => ({ pair_id: pairId, ...x }))
      );
      if (insError) throw insError;
    }

    profileDialog.close();
    await loadPair();
  } catch (e) {
    msg.textContent = e.message;
  }
});

document.getElementById("edit-pair-btn").addEventListener("click", () => {
  document.getElementById("pair-edit-name").value = pair?.name || "";
  document.getElementById("pair-edit-summary").value = pair?.summary || "";
  document.getElementById("pair-edit-msg").textContent = "";
  pairDialog.showModal();
});

document.getElementById("save-pair-btn").addEventListener("click", async () => {
  const msg = document.getElementById("pair-edit-msg");
  try {
    const name = document.getElementById("pair-edit-name").value.trim();
    if (!name) throw new Error("페어 이름을 입력해주세요.");

    const { error } = await db.from("pairs").update({
      name,
      summary: document.getElementById("pair-edit-summary").value.trim()
    }).eq("id", pairId);

    if (error) throw error;
    pairDialog.close();
    loadPair();
  } catch (e) {
    msg.textContent = e.message;
  }
});

document.getElementById("delete-pair-btn").addEventListener("click", async () => {
  if (!confirm("이 페어와 페어 로그/갤러리를 모두 삭제할까요?")) return;

  for (const img of images) {
    const path = storagePathFromUrl(img.image_url);
    if (path) await db.storage.from("gallery").remove([path]);
  }

  const { error } = await db.from("pairs").delete().eq("id", pairId);
  if (error) return alert(error.message);
  location.href = "index.html#pairs";
});

document.querySelectorAll("[data-open-post-editor]").forEach(btn => {
  btn.onclick = () => openPostEditor(btn.dataset.openPostEditor);
});

function resetPostEditor() {
  document.getElementById("post-id").value = "";
  document.getElementById("post-title").value = "";
  document.getElementById("post-body").value = "";
  document.getElementById("post-images").value = "";
  document.getElementById("post-new-caption-list").innerHTML = "";
  document.getElementById("post-existing-list").innerHTML = "";
  document.getElementById("post-existing-wrap").classList.add("hidden");
  document.getElementById("delete-post-btn").classList.add("hidden");
  document.getElementById("post-edit-msg").textContent = "";
  selectedPostFiles = [];
}

function openPostEditor(kind, id = "") {
  resetPostEditor();
  document.getElementById("post-kind").value = kind;
  document.getElementById("post-id").value = id;
  document.getElementById("post-dialog-title").textContent =
    kind === "log" ? "PAIR LOG 편집" : "PAIR GALLERY 편집";

  if (id) {
    const p = posts.find(x => x.id === id);
    document.getElementById("post-title").value = p?.title || "";
    document.getElementById("post-body").value = p?.body || "";
    document.getElementById("delete-post-btn").classList.remove("hidden");

    const imgs = postImages(id);
    if (imgs.length) {
      document.getElementById("post-existing-wrap").classList.remove("hidden");
      document.getElementById("post-existing-list").innerHTML = imgs.map(img => `
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
  }

  postDialog.showModal();
}

document.getElementById("post-images").addEventListener("change", e => {
  selectedPostFiles = Array.from(e.target.files || []);
  document.getElementById("post-new-caption-list").innerHTML =
    selectedPostFiles.map((file, i) => `
      <div class="new-image-row">
        <span class="file-name">${esc(file.name)}</span>
        <input class="new-image-caption" data-index="${i}" type="text" placeholder="이 이미지의 캡션">
      </div>
    `).join("");
});

async function saveExistingPostImages() {
  const rows = Array.from(document.querySelectorAll(".image-edit-row"));

  for (const row of rows) {
    const id = row.dataset.imageId;
    const caption = row.querySelector(".existing-caption").value;
    const del = row.querySelector(".delete-existing-image").checked;
    const img = images.find(x => x.id === id);

    if (del) {
      const path = storagePathFromUrl(img?.image_url);
      if (path) await db.storage.from("gallery").remove([path]);
      const { error } = await db.from("pair_post_images").delete().eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await db.from("pair_post_images").update({ caption }).eq("id", id);
      if (error) throw error;
    }
  }
}

async function saveNewPostImages(postId) {
  const capInputs = Array.from(document.querySelectorAll(".new-image-caption"));

  for (let i = 0; i < selectedPostFiles.length; i++) {
    const file = selectedPostFiles[i];
    const cap = capInputs.find(x => Number(x.dataset.index) === i)?.value || "";
    const uploaded = await uploadImage(file, `pair/${pairId}/${postId}`);

    const { error } = await db.from("pair_post_images").insert({
      pair_id: pairId,
      post_id: postId,
      image_url: uploaded.url,
      caption: cap,
      sort_order: i
    });

    if (error) {
      await db.storage.from("gallery").remove([uploaded.path]);
      throw error;
    }
  }
}

document.getElementById("save-post-btn").addEventListener("click", async () => {
  const msg = document.getElementById("post-edit-msg");
  const kind = document.getElementById("post-kind").value;
  const id = document.getElementById("post-id").value;

  try {
    msg.textContent = "저장 중...";
    let postId = id;

    const payload = {
      pair_id: pairId,
      section: kind,
      title: document.getElementById("post-title").value.trim(),
      body: document.getElementById("post-body").value
    };

    if (!id) {
      const { data, error } = await db.from("pair_posts").insert(payload).select().single();
      if (error) throw error;
      postId = data.id;
    } else {
      const { error } = await db.from("pair_posts").update(payload).eq("id", id);
      if (error) throw error;
      await saveExistingPostImages();
    }

    await saveNewPostImages(postId);
    postDialog.close();
    await loadPair();
  } catch (e) {
    msg.textContent = e.message;
  }
});

document.getElementById("delete-post-btn").addEventListener("click", async () => {
  const id = document.getElementById("post-id").value;
  if (!id || !confirm("이 게시물을 삭제할까요?")) return;

  const imgs = postImages(id);
  for (const img of imgs) {
    const path = storagePathFromUrl(img.image_url);
    if (path) await db.storage.from("gallery").remove([path]);
  }

  const { error } = await db.from("pair_posts").delete().eq("id", id);
  if (error) {
    document.getElementById("post-edit-msg").textContent = error.message;
    return;
  }

  postDialog.close();
  loadPair();
});

async function createPairIfNeeded() {
  if (!newMode) return;
  if (!isOwner) {
    location.href = "admin.html";
    return;
  }

  const { data, error } = await db
    .from("pairs")
    .insert({ name: "새 페어", summary: "" })
    .select()
    .single();

  if (error) return alert(error.message);

  location.replace(`pair.html?id=${data.id}`);
}

(async function init(){
  await checkOwner();
  await loadCharacters();
  await createPairIfNeeded();
  if (pairId) await loadPair();
})();
