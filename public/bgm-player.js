// v11 SPA: one persistent YouTube BGM player. Route changes only replace #spa-view, so the iframe is never destroyed.

let bgmTracks = [];
let bgmPlayer = null;
let bgmCurrentIndex = 0;
let bgmPlayerReady = false;
let bgmRestoreState = null;
let bgmSaveTimer = null;
const BGM_STATE_KEY = "elingne-bgm-state-v11";

function bgmEsc(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

function ensureBgmPanel() {
  if (document.getElementById("bgm-panel")) return;
  const panel = document.createElement("aside");
  panel.id = "bgm-panel";
  panel.className = "bgm-panel";
  panel.setAttribute("aria-label", "BGM 플레이리스트");
  panel.innerHTML = `
    <div class="bgm-heading">
      <div>
        <p class="eyebrow">YOUTUBE BGM</p>
        <h2>PLAYLIST</h2>
      </div>
      <span id="bgm-state" class="bgm-state">준비 중</span>
    </div>
    <div id="youtube-player" class="youtube-player"></div>
    <div class="bgm-controls">
      <button id="bgm-toggle" type="button" class="bgm-control" aria-label="재생">▶</button>
      <label class="bgm-volume">VOL
        <input id="bgm-volume" type="range" min="0" max="100" value="45" aria-label="BGM 볼륨" />
      </label>
    </div>
    <p id="bgm-now" class="bgm-now">재생할 곡을 불러오는 중...</p>
    <div id="bgm-list" class="bgm-list"></div>
    <p id="bgm-note" class="bgm-note hidden">브라우저가 소리 자동재생을 막았어요. ▶ 버튼을 한 번 눌러주세요.</p>`;
  document.body.appendChild(panel);
}

function readBgmState() {
  try { return JSON.parse(sessionStorage.getItem(BGM_STATE_KEY) || "null"); }
  catch { return null; }
}

function writeBgmState(forcePlaying) {
  if (!bgmPlayerReady || !bgmPlayer || !bgmTracks.length) return;
  let time = 0;
  let state = -1;
  try { time = Number(bgmPlayer.getCurrentTime() || 0); } catch {}
  try { state = bgmPlayer.getPlayerState(); } catch {}
  const volume = Number(document.getElementById("bgm-volume")?.value || 45);
  const playing = typeof forcePlaying === "boolean"
    ? forcePlaying
    : (window.YT && state === YT.PlayerState.PLAYING);
  const track = bgmTracks[bgmCurrentIndex];
  sessionStorage.setItem(BGM_STATE_KEY, JSON.stringify({
    index: bgmCurrentIndex,
    videoId: track?.video_id || "",
    time,
    volume,
    playing,
    savedAt: Date.now()
  }));
}

function updateBgmToggle(isPlaying) {
  const button = document.getElementById("bgm-toggle");
  if (!button) return;
  button.textContent = isPlaying ? "Ⅱ" : "▶";
  button.setAttribute("aria-label", isPlaying ? "일시정지" : "재생");
  button.classList.toggle("playing", isPlaying);
}

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
      <span class="bgm-track-title">${bgmEsc(track.title || `BGM ${index + 1}`)}</span>
    </button>`).join("");
  list.querySelectorAll("[data-bgm-index]").forEach(button => {
    button.addEventListener("click", () => playBgmIndex(Number(button.dataset.bgmIndex)));
  });
  now.textContent = bgmTracks[bgmCurrentIndex]?.title || `BGM ${bgmCurrentIndex + 1}`;
}

async function loadBgmTracks() {
  const { data, error } = await db.from("bgm_tracks")
    .select("id,title,youtube_url,video_id,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    const list = document.getElementById("bgm-list");
    if (list) list.innerHTML = `<p class="muted bgm-empty">${bgmEsc(error.message)}</p>`;
    setBgmState("오류");
    return;
  }
  bgmTracks = data || [];
  bgmRestoreState = readBgmState();
  if (bgmRestoreState?.videoId) {
    const match = bgmTracks.findIndex(t => t.video_id === bgmRestoreState.videoId);
    bgmCurrentIndex = match >= 0 ? match : Math.min(Number(bgmRestoreState.index || 0), Math.max(0, bgmTracks.length - 1));
  } else {
    bgmCurrentIndex = 0;
  }
  const volume = Number(bgmRestoreState?.volume ?? 45);
  const volumeEl = document.getElementById("bgm-volume");
  if (volumeEl) volumeEl.value = String(volume);
  renderBgmList();
  if (bgmPlayerReady && bgmTracks.length) restoreOrStartBgm();
}

function restoreOrStartBgm() {
  if (!bgmPlayer || !bgmTracks.length) return;
  const track = bgmTracks[bgmCurrentIndex];
  const saved = bgmRestoreState;
  const volume = Number(saved?.volume ?? document.getElementById("bgm-volume")?.value ?? 45);
  bgmPlayer.setVolume(volume);
  document.getElementById("bgm-note")?.classList.add("hidden");

  if (saved?.videoId === track.video_id) {
    // Add elapsed navigation time so the song appears to have kept running.
    const elapsed = saved.playing ? Math.max(0, (Date.now() - Number(saved.savedAt || Date.now())) / 1000) : 0;
    const resumeAt = Math.max(0, Number(saved.time || 0) + elapsed);
    setBgmState(saved.playing ? "재생 복원 중" : "일시정지");
    if (saved.playing) {
      bgmPlayer.loadVideoById({ videoId: track.video_id, startSeconds: resumeAt });
      bgmPlayer.playVideo();
    } else {
      bgmPlayer.cueVideoById({ videoId: track.video_id, startSeconds: resumeAt });
      updateBgmToggle(false);
    }
  } else {
    setBgmState("자동재생 시도");
    bgmPlayer.loadVideoById(track.video_id);
    bgmPlayer.playVideo();
  }
  renderBgmList();
}

function playBgmIndex(index) {
  if (!bgmPlayerReady || !bgmPlayer || !bgmTracks[index]) return;
  bgmCurrentIndex = index;
  bgmRestoreState = null;
  document.getElementById("bgm-note")?.classList.add("hidden");
  bgmPlayer.loadVideoById(bgmTracks[index].video_id);
  bgmPlayer.setVolume(Number(document.getElementById("bgm-volume")?.value || 45));
  bgmPlayer.playVideo();
  renderBgmList();
  setTimeout(() => writeBgmState(true), 250);
}

function createBgmPlayer() {
  if (!window.YT?.Player || bgmPlayer) return;
  bgmPlayer = new YT.Player("youtube-player", {
    width: "240",
    height: "200",
    playerVars: { autoplay: 1, controls: 1, rel: 0, playsinline: 1 },
    events: {
      onReady: () => {
        bgmPlayerReady = true;
        setBgmState("준비됨");
        if (bgmTracks.length) restoreOrStartBgm();
        clearInterval(bgmSaveTimer);
        bgmSaveTimer = setInterval(() => writeBgmState(), 1000);
      },
      onStateChange: event => {
        if (event.data === YT.PlayerState.PLAYING) {
          updateBgmToggle(true); setBgmState("재생 중");
          document.getElementById("bgm-note")?.classList.add("hidden");
          writeBgmState(true);
        } else if (event.data === YT.PlayerState.PAUSED) {
          updateBgmToggle(false); setBgmState("일시정지"); writeBgmState(false);
        } else if (event.data === YT.PlayerState.CUED || event.data === YT.PlayerState.UNSTARTED) {
          updateBgmToggle(false);
        } else if (event.data === YT.PlayerState.ENDED && bgmTracks.length) {
          playBgmIndex((bgmCurrentIndex + 1) % bgmTracks.length);
        }
      },
      onAutoplayBlocked: () => {
        updateBgmToggle(false); setBgmState("재생 대기");
        document.getElementById("bgm-note")?.classList.remove("hidden");
        writeBgmState(false);
      },
      onError: () => setBgmState("재생 불가")
    }
  });
}

window.onYouTubeIframeAPIReady = createBgmPlayer;

ensureBgmPanel();
document.getElementById("bgm-toggle")?.addEventListener("click", () => {
  if (!bgmPlayerReady || !bgmPlayer || !bgmTracks.length) return;
  const state = bgmPlayer.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    writeBgmState(false);
    bgmPlayer.pauseVideo();
  } else {
    document.getElementById("bgm-note")?.classList.add("hidden");
    bgmPlayer.setVolume(Number(document.getElementById("bgm-volume")?.value || 45));
    bgmPlayer.playVideo();
  }
});

document.getElementById("bgm-volume")?.addEventListener("input", event => {
  if (bgmPlayerReady && bgmPlayer) bgmPlayer.setVolume(Number(event.target.value));
  writeBgmState();
});

// Save as late as possible before any internal page navigation/unload.
document.addEventListener("click", event => {
  const link = event.target.closest("a[href]");
  if (link && link.origin === location.origin) writeBgmState();
}, true);
window.addEventListener("pagehide", () => writeBgmState());
window.addEventListener("beforeunload", () => writeBgmState());

loadBgmTracks();

// The API might already be available when this script runs from cache.
if (window.YT?.Player) createBgmPlayer();
