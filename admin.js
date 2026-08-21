const loginBox = document.getElementById("login-box");
const adminPanel = document.getElementById("admin-panel");
const msg = document.getElementById("admin-msg");

async function refreshSession() {
  const { data } = await db.auth.getSession();
  const loggedIn = !!data.session;
  loginBox.classList.toggle("hidden", loggedIn);
  adminPanel.classList.toggle("hidden", !loggedIn);
  if (loggedIn) await refreshAdminData();
}

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const out = document.getElementById("login-msg");

  const { error } = await db.auth.signInWithPassword({ email, password });
  out.textContent = error ? error.message : "로그인되었습니다.";
  if (!error) refreshSession();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await db.auth.signOut();
  refreshSession();
});

async function uploadImage(file, folder) {
  if (!file) return null;
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage.from("gallery").upload(path, file, {
    cacheControl: "3600",
    upsert: false
  });
  if (error) throw error;

  const { data } = db.storage.from("gallery").getPublicUrl(path);
  return data.publicUrl;
}

async function refreshAdminData() {
  const { data: chars, error } = await db
    .from("characters")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  const options = (chars || []).map(c =>
    `<option value="${c.id}">${escapeHtml(c.name)}</option>`
  ).join("");

  document.getElementById("log-character").innerHTML = options;
  document.getElementById("gallery-character").innerHTML = options;

  document.getElementById("admin-character-list").innerHTML =
    (chars || []).map(c => `
      <div class="admin-row">
        <span>${escapeHtml(c.name)}</span>
        <span>
          <button class="ghost edit-char" data-id="${c.id}">수정</button>
          <button class="ghost delete-char" data-id="${c.id}">삭제</button>
        </span>
      </div>
    `).join("");

  document.querySelectorAll(".edit-char").forEach(btn => {
    btn.addEventListener("click", () => {
      const c = chars.find(x => x.id === btn.dataset.id);
      document.getElementById("char-id").value = c.id;
      document.getElementById("char-name").value = c.name || "";
      document.getElementById("char-summary").value = c.summary || "";
      document.getElementById("char-profile").value = c.profile || "";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  document.querySelectorAll(".delete-char").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("이 캐릭터를 삭제할까요? 연결된 로그/갤러리도 삭제됩니다.")) return;
      const { error } = await db.from("characters").delete().eq("id", btn.dataset.id);
      msg.textContent = error ? error.message : "삭제했습니다.";
      if (!error) refreshAdminData();
    });
  });
}

document.getElementById("reset-char-btn").addEventListener("click", resetCharacterForm);

function resetCharacterForm() {
  document.getElementById("char-id").value = "";
  document.getElementById("char-name").value = "";
  document.getElementById("char-summary").value = "";
  document.getElementById("char-profile").value = "";
  document.getElementById("char-image").value = "";
}

document.getElementById("save-char-btn").addEventListener("click", async () => {
  try {
    msg.textContent = "저장 중...";
    const id = document.getElementById("char-id").value;
    const name = document.getElementById("char-name").value.trim();
    const summary = document.getElementById("char-summary").value.trim();
    const profile = document.getElementById("char-profile").value;
    const imageFile = document.getElementById("char-image").files[0];

    if (!name) throw new Error("캐릭터 이름을 입력해주세요.");

    let image_url;
    if (imageFile) image_url = await uploadImage(imageFile, "characters");

    let error;
    if (id) {
      const payload = { name, summary, profile };
      if (image_url) payload.image_url = image_url;
      ({ error } = await db.from("characters").update(payload).eq("id", id));
    } else {
      ({ error } = await db.from("characters").insert({ name, summary, profile, image_url }));
    }

    if (error) throw error;
    msg.textContent = "캐릭터를 저장했습니다.";
    resetCharacterForm();
    refreshAdminData();
  } catch (e) {
    msg.textContent = e.message;
  }
});

document.getElementById("save-log-btn").addEventListener("click", async () => {
  const character_id = document.getElementById("log-character").value;
  const title = document.getElementById("log-title").value.trim();
  const body = document.getElementById("log-body").value;

  const { error } = await db.from("logs").insert({ character_id, title, body });
  msg.textContent = error ? error.message : "로그를 업로드했습니다.";

  if (!error) {
    document.getElementById("log-title").value = "";
    document.getElementById("log-body").value = "";
  }
});

document.getElementById("save-gallery-btn").addEventListener("click", async () => {
  try {
    msg.textContent = "사진 업로드 중...";
    const character_id = document.getElementById("gallery-character").value;
    const file = document.getElementById("gallery-file").files[0];
    const caption = document.getElementById("gallery-caption").value.trim();

    if (!file) throw new Error("업로드할 이미지를 선택해주세요.");

    const image_url = await uploadImage(file, "gallery");
    const { error } = await db.from("gallery").insert({ character_id, image_url, caption });

    if (error) throw error;
    msg.textContent = "사진을 업로드했습니다.";
    document.getElementById("gallery-file").value = "";
    document.getElementById("gallery-caption").value = "";
  } catch (e) {
    msg.textContent = e.message;
  }
});

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[m]);
}

db.auth.onAuthStateChange(() => refreshSession());
refreshSession();
