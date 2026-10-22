// SPA v16: main view guard + single-flight pair creation.
const __elingneViewRoot = document.querySelector(".hero-profile");
if (__elingneViewRoot && __elingneViewRoot.dataset.__elingne_main_initialized !== "1") {
  __elingneViewRoot.dataset.__elingne_main_initialized = "1";
let isOwner = false;
let croppedMainProfileFile = null;
let mainSettings = null;

function setProfileCropPreview(input, src, note = "저장 전 미리보기") {
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

function previewFile(input, file, note) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => setProfileCropPreview(input, reader.result, note);
  reader.readAsDataURL(file);
}

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
  const { data, error } = await db.from("characters").select("*").order("name", { ascending:true });
  if (error) {
    grid.innerHTML = `<p class="muted">${esc(error.message)}</p>`;
    return;
  }
  grid.innerHTML = data?.length ? data.map(c => `
    <a class="character-card ${c.coupling_name ? "has-coupling" : ""}" href="character.html?id=${c.id}">
      ${c.coupling_name ? `<span class="coupling-card-badge" title="커플링: ${esc(c.coupling_name)}" aria-label="커플링 있음">♥</span>` : ""}
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
  const { data: pairs, error } = await db.from("pairs").select("*").order("name", { ascending:true });
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

const newPairButton = document.getElementById("new-pair-btn");
if (newPairButton) {
  newPairButton.addEventListener("click", async () => {
    if (!isOwner || newPairButton.disabled) return;
    newPairButton.disabled = true;

    try {
      // A window-level single-flight lock prevents duplicate inserts even if the SPA view is re-initialized.
      if (!window.__elingnePairCreatePromise) {
        window.__elingnePairCreatePromise = (async () => {
          const { data, error } = await db.from("pairs")
            .insert({ name:"새 페어", summary:"" })
            .select()
            .single();
          if (error) throw error;

          const { error: profileError } = await db.from("pair_profiles").insert([
            { pair_id:data.id, name:"인물 1", profile_text:"", sort_order:0 },
            { pair_id:data.id, name:"인물 2", profile_text:"", sort_order:1 }
          ]);
          if (profileError) throw profileError;
          return data.id;
        })();
      }

      const id = await window.__elingnePairCreatePromise;
      window.spaNavigate(`/pair/${id}`);
      window.__elingnePairCreatePromise = null;
    } catch (error) {
      alert(error.message || error);
      window.__elingnePairCreatePromise = null;
      newPairButton.disabled = false;
    }
  });
}

document.getElementById("edit-main-btn").addEventListener("click", () => {
  document.getElementById("main-edit-title").value = mainSettings?.title || "";
  document.getElementById("main-edit-text").value = mainSettings?.intro_text || "";
  document.getElementById("main-edit-image").value = "";
  croppedMainProfileFile = null;
  const mainImageInput = document.getElementById("main-edit-image");
  setProfileCropPreview(mainImageInput, mainSettings?.profile_image_url || "", mainSettings?.profile_image_url ? "현재 대표사진" : "");
  document.getElementById("main-edit-msg").textContent = "";
  document.getElementById("main-dialog").showModal();
});

document.getElementById("main-edit-image").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const cropped = await window.cropSquareImage(file);
    if (cropped) {
      croppedMainProfileFile = cropped;
      previewFile(e.target, cropped, "저장 전 미리보기");
      document.getElementById("main-edit-msg").textContent = "정사각형 크롭이 적용됐어요. 아래 미리보기를 확인한 뒤 저장해 주세요.";
    }
    else { e.target.value = ""; croppedMainProfileFile = null; }
  } catch (err) { document.getElementById("main-edit-msg").textContent = err.message; }
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
    const file = croppedMainProfileFile || document.getElementById("main-edit-image").files[0];
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

}
