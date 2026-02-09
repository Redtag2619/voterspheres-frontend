/* ================================
   GLOBAL CONFIG
================================ */

const API_BASE = "http://localhost:10000";

/*
Expected localStorage keys:
- authToken   (JWT string)
- userRole    ("admin" | "user")
*/


/* ================================
   AUTH HELPERS
================================ */

function getAuthToken() {
  return localStorage.getItem("authToken");
}

function isAdmin() {
  return localStorage.getItem("userRole") === "admin";
}

function requireAdmin() {
  if (!getAuthToken() || !isAdmin()) {
    alert("Admin access required");
    window.location.href = "/login.html";
  }
}


/* ================================
   ADMIN PHOTO UPLOAD
================================ */

async function uploadCandidatePhoto() {
  requireAdmin();

  const candidateId = document.getElementById("candidateId").value;
  const fileInput = document.getElementById("photoFile");
  const statusEl = document.getElementById("uploadStatus");
  const previewEl = document.getElementById("previewImage");

  statusEl.textContent = "";
  previewEl.style.display = "none";

  if (!candidateId) {
    statusEl.textContent = "❌ Candidate ID required";
    return;
  }

  if (!fileInput.files.length) {
    statusEl.textContent = "❌ Please select a photo";
    return;
  }

  const file = fileInput.files[0];

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    statusEl.textContent = "❌ Only JPG, PNG, or WEBP allowed";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    statusEl.textContent = "❌ Max file size is 2MB";
    return;
  }

  const formData = new FormData();
  formData.append("photo", file);

  try {
    statusEl.textContent = "Uploading…";

    const res = await fetch(
      `${API_BASE}/api/admin/candidates/${candidateId}/photo`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: formData
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    statusEl.textContent = "✅ Upload successful";

    previewEl.src = `${API_BASE}${data.photo}`;
    previewEl.style.display = "block";

  } catch (err) {
    console.error(err);
    statusEl.textContent = "❌ " + err.message;
  }
}


/* ================================
   OPTIONAL: AUTO-LOAD CHECK
================================ */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Frontend index.js loaded");

  // Auto-protect dashboard
  if (window.location.pathname.includes("dashboard")) {
    requireAdmin();
  }
});
