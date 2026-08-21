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
  location.href = `character.html?id=${data.id}`;
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

// v6: YouTube BGM playlist
let bgmTracks = [];
let bgmPlayer = null;
let bgmCurrentIndex = 0;
let bgmPlayerReady = false;
let bgmAutoplayBlocked = false;

function setBgmState(text) {
  const el = document.getElementById("bgm-state");
  if (el) el.textContent = text;
}

function renderBgmList() {
  const list = document.getElementById("bgm-list");
  const now = document.getElementById("bgm-now");
  if (!list || !now) return;

  if (!bgmTracks.length) {
    list.innerHTML = `<p class="muted bgm-empty">등록된 BGM이 없습니다.</p>`;
    now.textContent = "PLAYLIST EMPTY";
    setBgmState("비어 있음");
    return;
  }

  list.innerHTML = bgmTracks.map((track, index) => `
    <button type="button" class="bgm-track ${index === bgmCurrentIndex ? "active" : ""}" data-bgm-index="${index}">
      <span class="bgm-track-no">${String(index + 1).padStart(2, "0")}</span>
      <span class="bgm-track-title">${esc(track.title || `BGM ${index + 1}`)}</span>
    </button>
  `).join("");

  list.querySelectorAll("[data-bgm-index]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.bgmIndex);
      playBgmIndex(index);
    });
  });

  now.textContent = bgmTracks[bgmCurrentIndex]?.title || `BGM ${bgmCurrentIndex + 1}`;
}

async function loadBgmTracks() {
  const { data, error } = await db
    .from("bgm_tracks")
    .select("id,title,youtube_url,video_id,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    const list = document.getElementById("bgm-list");
    if (list) list.innerHTML = `<p class="muted bgm-empty">${esc(error.message)}</p>`;
    setBgmState("오류");
    return;
  }

  bgmTracks = data || [];
  bgmCurrentIndex = 0;
  renderBgmList();
  if (bgmPlayerReady && bgmTracks.length) loadInitialBgm();
}

function loadInitialBgm() {
  if (!bgmPlayer || !bgmTracks.length) return;
  const first = bgmTracks[0];
  bgmCurrentIndex = 0;
  renderBgmList();
  document.getElementById("bgm-note")?.classList.add("hidden");
  setBgmState("자동재생 시도");
  bgmPlayer.loadVideoById(first.video_id);
  bgmPlayer.setVolume(Number(document.getElementById("bgm-volume")?.value || 45));
  bgmPlayer.playVideo();
}

function playBgmIndex(index) {
  if (!bgmPlayerReady || !bgmPlayer || !bgmTracks[index]) return;
  bgmCurrentIndex = index;
  bgmAutoplayBlocked = false;
  document.getElementById("bgm-note")?.classList.add("hidden");
  bgmPlayer.loadVideoById(bgmTracks[index].video_id);
  bgmPlayer.setVolume(Number(document.getElementById("bgm-volume")?.value || 45));
  bgmPlayer.playVideo();
  renderBgmList();
}

window.onYouTubeIframeAPIReady = function () {
  bgmPlayer = new YT.Player("youtube-player", {
    width: "240",
    height: "200",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: () => {
        bgmPlayerReady = true;
        setBgmState("준비됨");
        if (bgmTracks.length) loadInitialBgm();
      },
      onStateChange: event => {
        if (event.data === YT.PlayerState.PLAYING) {
          setBgmState("재생 중");
          document.getElementById("bgm-note")?.classList.add("hidden");
        } else if (event.data === YT.PlayerState.PAUSED) {
          setBgmState("일시정지");
        } else if (event.data === YT.PlayerState.ENDED && bgmTracks.length) {
          playBgmIndex((bgmCurrentIndex + 1) % bgmTracks.length);
        }
      },
      onAutoplayBlocked: () => {
        bgmAutoplayBlocked = true;
        setBgmState("재생 대기");
        document.getElementById("bgm-note")?.classList.remove("hidden");
      },
      onError: () => setBgmState("재생 불가")
    }
  });
};

document.getElementById("bgm-play")?.addEventListener("click", () => {
  if (!bgmPlayerReady || !bgmPlayer || !bgmTracks.length) return;
  bgmAutoplayBlocked = false;
  document.getElementById("bgm-note")?.classList.add("hidden");
  bgmPlayer.setVolume(Number(document.getElementById("bgm-volume")?.value || 45));
  bgmPlayer.playVideo();
});

document.getElementById("bgm-pause")?.addEventListener("click", () => {
  if (bgmPlayerReady && bgmPlayer) bgmPlayer.pauseVideo();
});

document.getElementById("bgm-volume")?.addEventListener("input", event => {
  if (bgmPlayerReady && bgmPlayer) bgmPlayer.setVolume(Number(event.target.value));
});

loadBgmTracks();
