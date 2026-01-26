const status = document.getElementById("status");

async function checkBackend() {
  try {
    const response = await fetch("https://voterspheres-backend.onrender.com/health");
    const data = await response.json();

    status.textContent = "Backend status: " + (data.status || "OK");
  } catch (error) {
    console.error(error);
    status.textContent = "Backend unreachable";
  }
}

checkBackend();
