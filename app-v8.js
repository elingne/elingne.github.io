let isOwner = false;
let mainSettings = null;

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

async function uploadImage(file, folder) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("gallery").upload(path, file, { upsert:false });
  if (error) throw error;
  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

async function initOwner() {
  const { data } = await db.auth.getSession();
  isOwner = !!data.session;
  document.querySelectorAll(".owner-only").forEach(x => x.classList.toggle("hidden", !isOwner));
}

async function loadMain() {
  const { data } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  mainSettings = data || { id:1, title:"MAIN", intro_text:"자캐와 커뮤니티 활동을 정리하는 개인 홈페이지입니다.", profile_image_url:null };

  document.getElementById("main-title").textContent = mainSettings.title || "MAIN";
  document.getElementById("main-text").textContent = mainSettings.intro_text || "";
  document.getElementById("main-profile-image").innerHTML = mainSettings.profile_image_url
    ? `<img src="${mainSettings.profile_image_url}" alt="site owner profile">`
    : `<div class="profile-placeholder">PROFILE</div>`;
}

async function loadCharacters() {
  const grid = document.getElementById("character-grid");
  const { data, error } = await db.from("characters").select("*").order("created_at");
  if (error) {
    grid.innerHTML = `<p class="muted">${esc(error.message)}</p>`;
    return;
  }
  grid.innerHTML = data?.length ? data.map(c => `
    <a class="character-card" href="character.html?id=${c.id}">
      <img src="${c.image_url || ""}" alt="${esc(c.name)}">
      <div class="card-body">
        <h3>${esc(c.name)}</h3>
        <p class="muted">${esc(c.summary || "")}</p>
      </div>
    </a>
  `).join("") : `<p class="muted">아직 등록된 캐릭터가 없습니다.</p>`;
}

async function loadPairs() {
  const grid = document.getElementById("pair-grid");
  const { data: pairs, error } = await db.from("pairs").select("*").order("created_at");
  if (error) {
    grid.innerHTML = `<p class="muted">${esc(error.message)}</p>`;
    return;
  }
  if (!pairs?.length) {
    grid.innerHTML = `<p class="muted">아직 등록된 페어가 없습니다.</p>`;
    return;
  }

  const { data: profiles } = await db
    .from("pair_profiles")
    .select("pair_id,name,image_url,sort_order")
    .in("pair_id", pairs.map(x => x.id))
    .order("sort_order");

  grid.innerHTML = pairs.map(pair => {
    const ps = (profiles || []).filter(x => x.pair_id === pair.id).slice(0,8);
    return `
      <a class="pair-card" href="pair.html?id=${pair.id}">
        <div class="pair-thumbs">
          ${ps.map(p => `<img src="${p.image_url || ""}" alt="${esc(p.name || "")}">`).join("")}
        </div>
        <div class="card-body">
          <h3>${esc(pair.name)}</h3>
          <p class="muted">${esc(pair.summary || "")}</p>
        </div>
      </a>
    `;
  }).join("");
}

document.getElementById("new-character-btn").addEventListener("click", async () => {
  if (!isOwner) return;
  const { data, error } = await db.from("characters").insert({
    name: "새 캐릭터",
    summary: "",
    profile: ""
  }).select().single();

  if (error) return alert(error.message);
  window.spaNavigate(`/character/${data.id}`);
});

document.getElementById("edit-main-btn").addEventListener("click", () => {
  document.getElementById("main-edit-title").value = mainSettings?.title || "";
  document.getElementById("main-edit-text").value = mainSettings?.intro_text || "";
  document.getElementById("main-edit-image").value = "";
  document.getElementById("main-edit-msg").textContent = "";
  document.getElementById("main-dialog").showModal();
});

document.getElementById("save-main-btn").addEventListener("click", async () => {
  const msg = document.getElementById("main-edit-msg");
  try {
    msg.textContent = "저장 중...";
    const payload = {
      id: 1,
      title: document.getElementById("main-edit-title").value.trim() || "MAIN",
      intro_text: document.getElementById("main-edit-text").value
    };
    const file = document.getElementById("main-edit-image").files[0];
    if (file) payload.profile_image_url = await uploadImage(file, "site");

    const { error } = await db.from("site_settings").upsert(payload);
    if (error) throw error;
    document.getElementById("main-dialog").close();
    await loadMain();
  } catch (e) {
    msg.textContent = e.message;
  }
});

(async function init(){
  await initOwner();
  await Promise.all([loadMain(), loadCharacters(), loadPairs()]);
})();
