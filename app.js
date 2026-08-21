async function loadCharacters() {
  const grid = document.getElementById("character-grid");
  const { data, error } = await db
    .from("characters")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    grid.innerHTML = `<p class="muted">캐릭터를 불러오지 못했습니다. Supabase 설정을 확인해주세요.</p>`;
    return;
  }

  if (!data.length) {
    grid.innerHTML = `<p class="muted">아직 등록된 캐릭터가 없습니다.</p>`;
    return;
  }

  grid.innerHTML = data.map(c => `
    <a class="character-card" href="character.html?id=${c.id}">
      <img src="${c.image_url || ""}" alt="${escapeHtml(c.name)}">
      <div class="card-body">
        <h3>${escapeHtml(c.name)}</h3>
        <p class="muted">${escapeHtml(c.summary || "")}</p>
      </div>
    </a>
  `).join("");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

loadCharacters();
