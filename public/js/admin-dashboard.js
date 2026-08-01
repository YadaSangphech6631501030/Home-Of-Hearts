(function () {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);

  if (!token) {
    window.location.href = "/";
    return;
  }

  const user = API.getUser();
  const displayName = user.name || user.username || "สำนักงานหอพักบ้านแห่งหัวใจ";
  const shortName = displayName.length > 12 ? `${displayName.slice(0, 10)}...` : displayName;

  const profileName = document.getElementById("profile-name");
  const profileMenuName = document.getElementById("profile-menu-name");
  const dashboardTitle = document.getElementById("dashboard-title");
  const profileMenu = document.querySelector(".profile-menu");
  const profileTrigger = document.getElementById("profile-trigger");
  const logoutButton = document.getElementById("logout-button");

  if (profileName) profileName.textContent = shortName;
  if (profileMenuName) profileMenuName.textContent = displayName;

  if (dashboardTitle) {
    dashboardTitle.textContent = `👋🏻 สวัสดี ${displayName}`;
  }

  const currentPage = window.location.pathname.replace(/\/$/, "").split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    const isActive = link.dataset.navPage === currentPage;
    link.classList.toggle("admin-nav__link--active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener("click", () => {
      const isOpen = profileMenu.classList.toggle("is-open");
      profileTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!profileMenu.contains(event.target)) {
        profileMenu.classList.remove("is-open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        profileMenu.classList.remove("is-open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => API.logout());
  }

async function loadDashboardSummary() {
  try {
    const rooms = await API.get('/api/rooms'); 
    
    const roomList = Array.isArray(rooms) ? rooms : (rooms.data || rooms.rooms || []);

    const total = roomList.length;
    const occupied = roomList.filter(r => {
      const s = String(r.status || '').toLowerCase().trim();
      return s === 'occupied' || s === 'ไม่ว่าง';
    }).length;
    const available = total - occupied;

    document.getElementById('dash-total-rooms').textContent = total;
    document.getElementById('dash-occupied-rooms').textContent = occupied;
    document.getElementById('dash-available-rooms').textContent = available;

  } catch (err) {
    console.error("Error loading summary:", err);
  }
}

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDashboardSummary);
  } else {
    loadDashboardSummary();
  }

})();