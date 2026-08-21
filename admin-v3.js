const loginBox = document.getElementById("login-box");
const loggedBox = document.getElementById("logged-box");
let bgmAdminTracks = [];
let bgmAddSaving = false;
let bgmDragSaving = false;

function escAdmin(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

function parseYouTubeVideoId(input) {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || null;
    if (url.hostname.includes("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) return parts[1] || null;
    }
  } catch (_) {}
  return null;
}

async function fetchYouTubeTitle(url) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) throw new Error("oEmbed failed");
    const data = await res.json();
    return data.title || "";
  } catch (_) {
    return "";
  }
}

async function refresh() {
  const { data } = await db.auth.getSession();
  const logged = !!data.session;
  loginBox.classList.toggle("hidden", logged);
  loggedBox.classList.toggle("hidden", !logged);
  if (logged) await loadAdminBgm();
}

async function loadAdminBgm() {
  const list = document.getElementById("bgm-admin-list");
  if (!list) return;
  const { data, error } = await db
    .from("bgm_tracks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    list.innerHTML = `<p class="muted">${escAdmin(error.message)}</p>`;
    return;
  }

  bgmAdminTracks = data || [];
  renderAdminBgm();
}

function renderAdminBgm() {
  const list = document.getElementById("bgm-admin-list");
  if (!list) return;
  if (!bgmAdminTracks.length) {
    list.innerHTML = `<p class="muted">등록된 BGM이 없습니다.</p>`;
    return;
  }

  list.innerHTML = bgmAdminTracks.map((track, index) => `
    <div class="bgm-admin-row draggable-bgm-row" draggable="true" data-track-id="${track.id}" data-index="${index}">
      <button type="button" class="drag-handle bgm-drag-handle" aria-label="BGM 순서 변경" title="드래그해서 순서 변경">⋮⋮</button>
      <span class="bgm-admin-order">${String(index + 1).padStart(2, "0")}</span>
      <div class="bgm-admin-copy">
        <strong class="bgm-admin-title">${escAdmin(track.title || `BGM ${index + 1}`)}</strong>
        <span class="bgm-admin-url">${escAdmin(track.youtube_url)}</span>
      </div>
      <div class="bgm-admin-actions">
        <button type="button" class="danger" data-action="delete" data-index="${index}">삭제</button>
      </div>
    </div>
  `).join("");

  list.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.index);
      const action = button.dataset.action;
      if (action === "delete") return deleteBgm(index);
    });
  });

  enableBgmDrag(list);
}

function enableBgmDrag(list) {
  let dragged = null;
  list.querySelectorAll('.draggable-bgm-row').forEach(row => {
    row.addEventListener('dragstart', e => {
      if (bgmDragSaving) { e.preventDefault(); return; }
      dragged = row;
      row.classList.add('dragging');
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    row.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragged || dragged === row) return;
      const rect = row.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      list.insertBefore(dragged, after ? row.nextSibling : row);
    });
    row.addEventListener('dragend', async () => {
      if (!dragged) return;
      dragged.classList.remove('dragging');
      dragged = null;
      const ids = [...list.querySelectorAll('.draggable-bgm-row')].map(row => row.dataset.trackId);
      const next = ids.map(id => bgmAdminTracks.find(track => String(track.id) === String(id))).filter(Boolean);
      if (next.length !== bgmAdminTracks.length) return;
      const changed = next.some((track, i) => String(track.id) !== String(bgmAdminTracks[i]?.id));
      if (!changed) return;
      const msg = document.getElementById('bgm-admin-msg');
      try {
        bgmDragSaving = true;
        msg.textContent = '순서 저장 중...';
        await normalizeSortOrder(next);
        bgmAdminTracks = next;
        msg.textContent = '드래그한 순서로 저장했어요.';
        renderAdminBgm();
      } catch (e) {
        msg.textContent = e.message;
        await loadAdminBgm();
      } finally {
        bgmDragSaving = false;
      }
    });
  });
}

async function normalizeSortOrder(rows) {
  for (let i = 0; i < rows.length; i++) {
    const { error } = await db.from("bgm_tracks").update({ sort_order: i }).eq("id", rows[i].id);
    if (error) throw error;
  }
}

async function deleteBgm(index) {
  const track = bgmAdminTracks[index];
  if (!track || !confirm(`「${track.title || "이 곡"}」을 플레이리스트에서 삭제할까요?`)) return;
  const msg = document.getElementById("bgm-admin-msg");
  try {
    const { error } = await db.from("bgm_tracks").delete().eq("id", track.id);
    if (error) throw error;
    msg.textContent = "삭제했어요.";
    await loadAdminBgm();
    await normalizeSortOrder(bgmAdminTracks);
    await loadAdminBgm();
  } catch (e) {
    msg.textContent = e.message;
  }
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const out = document.getElementById("login-msg");
  const { error } = await db.auth.signInWithPassword({ email, password });
  out.textContent = error ? error.message : "로그인되었습니다.";
  if (!error) refresh();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await db.auth.signOut();
  refresh();
});

document.getElementById("bgm-add-btn")?.addEventListener("click", async () => {
  if (bgmAddSaving) return;
  bgmAddSaving = true;
  const addButton = document.getElementById("bgm-add-btn");
  addButton.disabled = true;
  const urlInput = document.getElementById("bgm-url");
  const titleInput = document.getElementById("bgm-title");
  const msg = document.getElementById("bgm-admin-msg");
  const youtubeUrl = urlInput.value.trim();
  const videoId = parseYouTubeVideoId(youtubeUrl);

  if (!videoId) {
    msg.textContent = "올바른 YouTube 영상 링크를 입력해주세요.";
    bgmAddSaving = false;
    addButton.disabled = false;
    return;
  }

  try {
    msg.textContent = "추가 중...";
    let title = titleInput.value.trim();
    if (!title) title = await fetchYouTubeTitle(youtubeUrl);
    if (!title) title = `BGM ${bgmAdminTracks.length + 1}`;

    const { error } = await db.from("bgm_tracks").insert({
      title,
      youtube_url: youtubeUrl,
      video_id: videoId,
      sort_order: bgmAdminTracks.length
    });
    if (error) throw error;

    urlInput.value = "";
    titleInput.value = "";
    msg.textContent = "플레이리스트에 추가했어요.";
    await loadAdminBgm();
  } catch (e) {
    msg.textContent = e.message;
  } finally {
    bgmAddSaving = false;
    addButton.disabled = false;
  }
});

db.auth.onAuthStateChange(refresh);
refresh();
