const loginBox = document.getElementById("login-box");
const loggedBox = document.getElementById("logged-box");

async function refresh() {
  const { data } = await db.auth.getSession();
  const logged = !!data.session;
  loginBox.classList.toggle("hidden", logged);
  loggedBox.classList.toggle("hidden", !logged);
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

db.auth.onAuthStateChange(refresh);
refresh();
