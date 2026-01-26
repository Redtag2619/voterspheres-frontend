async function checkBackend() {
  const statusEl = document.getElementById("status");

  try {
    const res = await fetch("https://voterspheres-backend.onrender.com/health");
    const data = await res.json();

    if (data.status === "ok") {
      statusEl.textContent = "Backend status: OK ✅";
      statusEl.style.color = "green";
    } else {
      statusEl.textContent = "Backend responded but not OK ⚠️";
      statusEl.style.color = "orange";
    }
  } catch (err) {
    statusEl.textContent = "Backend unreachable ❌";
    statusEl.style.color = "red";
    console.error(err);
  }
}

checkBackend();
