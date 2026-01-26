const statusEl = document.getElementById("status");

async function checkBackend() {
  try {
    const res = await fetch("https://voterspheres-backend.onrender.com/health");
    const data = await res.json();

    if (data.status === "ok") {
      statusEl.textContent = "Backend connected ✅";
      statusEl.style.color = "green";
    } else {
      statusEl.textContent = "Backend error ⚠️";
      statusEl.style.color = "orange";
    }
  } catch (err) {
    statusEl.textContent = "Backend unreachable ❌";
    statusEl.style.color = "red";
  }
}

checkBackend();
