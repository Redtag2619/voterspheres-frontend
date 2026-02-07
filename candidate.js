const API = "http://localhost:10000";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
  document.body.innerHTML = "Candidate ID missing";
}

fetch(`${API}/api/candidates/${id}`)
  .then(res => res.json())
  .then(c => {
    document.getElementById("name").textContent = c.full_name;
    document.getElementById("office").textContent = c.office || "";
    document.getElementById("party").textContent = c.party || "";
    document.getElementById("state").textContent = c.state || "";
    document.getElementById("county").textContent = c.county || "";
    document.getElementById("email").textContent = c.email || "";
    document.getElementById("phone").textContent = c.phone || "";
    document.getElementById("address").textContent = c.address || "";

    if (c.website) {
      const site = document.getElementById("website");
      site.href = c.website;
      site.textContent = c.website;
    }

    if (c.photo) {
      document.getElementById("photo").src = `${API}${c.photo}`;
    } else {
      document.getElementById("photo").style.display = "none";
    }
  })
  .catch(() => {
    document.body.innerHTML = "Error loading profile";
  });
