function esc(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

async function loadCharacters() {
  const grid = document.getElementById("character-grid");
  const { data, error } = await db
    .from("characters")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    grid.innerHTML = `<p class="muted">캐릭터를 불러오지 못했습니다: ${esc(error.message)}</p>`;
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

  const { data: pairs, error } = await db
    .from("pairs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    grid.innerHTML = `<p class="muted">페어를 불러오지 못했습니다: ${esc(error.message)}</p>`;
    return;
  }

  if (!pairs?.length) {
    grid.innerHTML = `<p class="muted">아직 등록된 페어가 없습니다.</p>`;
    return;
  }

  const { data: members } = await db
    .from("pair_members")
    .select("pair_id, sort_order, character_id, characters(name,image_url)")
    .in("pair_id", pairs.map(x => x.id))
    .order("sort_order");

  grid.innerHTML = pairs.map(pair => {
    const ms = (members || []).filter(x => x.pair_id === pair.id);
    const thumbs = ms.slice(0,4).map(m => `
      <img src="${m.characters?.image_url || ""}" alt="${esc(m.characters?.name || "")}">
    `).join("");

    return `
      <a class="pair-card" href="pair.html?id=${pair.id}">
        <div class="pair-thumbs">${thumbs}</div>
        <div class="card-body">
          <h3>${esc(pair.name)}</h3>
          <p class="muted">${esc(pair.summary || "")}</p>
        </div>
      </a>
    `;
  }).join("");
}

async function initOwner() {
  const { data } = await db.auth.getSession();
  document.getElementById("new-pair-link").classList.toggle("hidden", !data.session);
}

loadCharacters();
loadPairs();
initOwner();
