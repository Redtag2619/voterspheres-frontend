const API = "http://localhost:10000";

const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);

// Support BOTH:
// /candidate.html?id=123
// /candidate/john-smith-123

let apiURL = "";

if (params.get("id")) {
  apiURL = `${API}/api/candidates/${params.get("id")}`;
} else {
  const slug = path.split("/").pop();
  apiURL = `${API}/api/candidate/seo/${slug}`;
}

fetch(apiURL)
  .then(res => res.json())
  .then(c => {
    document.title = `${c.full_name} for ${c.office} | ${c.state}`;

    document.getElementById("name").textContent = c.full_name;
    document.getElementById("office").textContent = c.office || "";
    document.getElementById("party").textContent = c.party || "";
    document.getElementById("state").textContent = c.state || "";
    document.getElementById("county").textContent = c.county || "";
    document.getElementById("email").textContent = c.email || "";
    document.getElementById("phone").textContent = c.phone || "";
    document.getElementById("address").textContent = c.address || "";

    // SEO META
    document.getElementById("meta-description").content =
      `${c.full_name}, ${c.party || ""} candidate for ${c.office} in ${c.state}.`;

    document.getElementById("og-title").content = document.title;
    document.getElementById("og-description").content =
      `View profile, contact info, and campaign details for ${c.full_name}.`;

    if (c.website) {
      const site = document.getElementById("website");
      site.href = c.website;
      site.textContent = c.website;
    }

    if (c.photo) {
      const photoURL = `${API}${c.photo}`;
      document.getElementById("photo").src = photoURL;
      document.getElementById("og-image").content = photoURL;
    } else {
      document.getElementById("photo").style.display = "none";
    }
  })
  .catch(() => {
    document.body.innerHTML = "Error loading profile";
  });
