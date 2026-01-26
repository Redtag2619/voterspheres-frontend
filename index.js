const status = document.getElementById("status");

async function checkBackend() {
  try {
    const res = await fetch("https://voterspheres-backend.onrender.com/health");
    const data = await res.json();

    status.textContent = "Backend status: " + data.status;
  } catch (err) {
    status.textContent = "Backend unreachable";
  }
}

checkBackend();
