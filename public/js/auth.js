/**
 * BrainShelf Client-side Auth & Navigation Helper
 * Shared across all pages for consistent authentication states and navigation.
 */
let currentUser = null;

async function checkAuthStatus() {
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        renderNavAuth(currentUser);
        return currentUser;
      }
    }
  } catch (err) {
    console.warn("Auth check failed:", err.message);
  }
  currentUser = null;
  renderNavAuth(null);
  return null;
}

function renderNavAuth(user) {
  const navContainer = document.querySelector(".navbar nav");
  const navActionContainer = document.querySelector(".navbar .nav-actions") || document.querySelector(".navbar");

  if (!navContainer) return;

  // Find or create auth slot
  let authSlot = document.getElementById("navbarAuthSlot");
  if (!authSlot) {
    authSlot = document.createElement("div");
    authSlot.id = "navbarAuthSlot";
    authSlot.className = "nav-actions";
    // If there is an existing .nav-button, replace or append next to it
    const existingNavBtn = document.querySelector(".navbar > .nav-button");
    if (existingNavBtn) {
      existingNavBtn.replaceWith(authSlot);
    } else {
      navActionContainer.appendChild(authSlot);
    }
  }

  // Update dynamic links in nav
  let dynamicNavLinks = document.getElementById("dynamicNavLinks");
  if (!dynamicNavLinks) {
    dynamicNavLinks = document.createElement("span");
    dynamicNavLinks.id = "dynamicNavLinks";
    dynamicNavLinks.style.display = "contents";
    navContainer.appendChild(dynamicNavLinks);
  }

  if (user) {
    dynamicNavLinks.innerHTML = `
      <a href="/upload.html">Upload Note</a>
      <a href="/my-uploads.html">My Uploads</a>
      ${user.role === "admin" ? '<a href="/admin.html" style="color:var(--green);font-weight:700;">Admin</a>' : ""}
    `;

    authSlot.innerHTML = `
      <div class="user-nav-chip">
        <span>👤 ${escapeHtml(user.name.split(" ")[0])}</span>
        ${user.role === "admin" ? '<span class="role-badge">Admin</span>' : ""}
      </div>
      <button class="btn-outline" id="logoutBtn" style="cursor:pointer;">Logout</button>
    `;

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  } else {
    dynamicNavLinks.innerHTML = `
      <a href="/login.html">Sign In</a>
    `;

    authSlot.innerHTML = `
      <a href="/register.html" class="nav-button">Get Started</a>
    `;
  }
}

async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (err) {
    console.error("Logout request error:", err);
  }
  currentUser = null;
  window.location.href = "/";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Auto-run on load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
});
