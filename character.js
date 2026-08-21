const id = new URLSearchParams(location.search).get("id");

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

async function loadCharacter() {
  if (!id) {
    document.getElementById("character-head").innerHTML = "<p>캐릭터 ID가 없습니다.</p>";
    return;
  }

  const { data: character, error } = await db
    .from("characters")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !character) {
    document.getElementById("character-head").innerHTML = "<p>캐릭터를 찾을 수 없습니다.</p>";
    return;
  }

  document.title = `${character.name} | elingne archive`;
  document.getElementById("character-head").innerHTML = `
    <img src="${character.image_url || ""}" alt="${escapeHtml(character.name)}">
    <div>
      <p class="eyebrow">CHARACTER</p>
      <h1>${escapeHtml(character.name)}</h1>
      <p class="muted">${escapeHtml(character.summary || "")}</p>
    </div>
  `;
  document.getElementById("profile").textContent = character.profile || "";

  const { data: logs } = await db
    .from("logs")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  document.getElementById("log").innerHTML = (logs || []).length
    ? logs.map(x => `
        <article class="log-item">
          <h3>${escapeHtml(x.title || "LOG")}</h3>
          <div>${escapeHtml(x.body || "").replace(/\n/g, "<br>")}</div>
        </article>
      `).join("")
    : `<p class="muted">등록된 로그가 없습니다.</p>`;

  const { data: gallery } = await db
    .from("gallery")
    .select("*")
    .eq("character_id", id)
    .order("created_at", { ascending: false });

  document.getElementById("gallery-grid").innerHTML = (gallery || []).length
    ? gallery.map(x => `
        <figure class="gallery-item">
          <img src="${x.image_url}" alt="${escapeHtml(x.caption || character.name)}">
          <figcaption>${escapeHtml(x.caption || "")}</figcaption>
        </figure>
      `).join("")
    : `<p class="muted">등록된 이미지가 없습니다.</p>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

loadCharacter();
