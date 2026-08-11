(function () {
  const token = localStorage.getItem(CONFIG.TOKEN_KEY);

  if (!token) {
    window.location.href = "/";
    return;
  }

  let globalAnnouncements = [];

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
  if (dashboardTitle) dashboardTitle.textContent = `👋🏻 สวัสดี ${displayName}`;

  // Active Menu Navbar
  const currentPage = window.location.pathname.replace(/\/$/, "").split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    const isActive = link.dataset.navPage === currentPage;
    link.classList.toggle("admin-nav__link--active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  // Profile Dropdown Events
  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = profileMenu.classList.toggle("is-open");
      profileTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!profileMenu.contains(event.target)) {
        profileMenu.classList.remove("is-open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", () => API.logout());
  }

  async function loadAllDashboardData() {
    try {
      const result = await API.get('/api/dashboard/summary');
      const data = result.data || {};
      const rooms = data.rooms || {};
      const maintenance = data.maintenance || {};
      const billing = data.billing || {};
      const parcels = data.parcels || {};

      updateText('dash-total-rooms', rooms.total ?? 0);
      updateText('dash-occupied-rooms', rooms.occupied ?? 0);
      updateText('dash-available-rooms', rooms.available ?? 0);

      updateText('dash-maint-pending', maintenance.pending ?? 0);
      updateText('dash-maint-progress', maintenance.progress ?? 0);
      updateText('dash-maint-done', maintenance.completed ?? 0);

      updateText('dash-bill-date', formatDashboardDate(billing.date || billing.cycleEnd || '-'));
      updateText('dash-bill-total', billing.total ?? 0);
      updateText('dash-bill-pending', billing.pending ?? 0);
      updateText('dash-bill-done', billing.completed ?? 0);

      updateText('dash-parcel-total', parcels.total ?? 0);
      updateText('dash-parcel-box', parcels.box ?? 0);
      updateText('dash-parcel-envelope', parcels.envelope ?? 0);

      renderAlerts(data.alerts || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      renderAlerts([]);
    }
  }

  function formatDashboardDate(value) {
    if (!value || value === '-') return '-';
    if (typeof value === 'string' && value.includes('/')) return value;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
  }

  // Helper Function 
  function updateText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // Render Alerts List
  function renderAlerts(announcements) {
    const container = document.getElementById("alert-list");
    if (!container) return;

    globalAnnouncements = announcements || [];

    if (globalAnnouncements.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #888; padding: 20px;">
          ไม่มีรายการแจ้งเตือน
        </div>`;
      return;
    }

    container.innerHTML = globalAnnouncements
      .slice(0, 5) 
      .map(
        (item, index) => `
      <div class="alert-item" onclick="openAlertModal(${index})">
        <div class="alert-item__left">
          <span class="alert-dot alert-dot--red"></span>
          <div class="alert-item__text">
            <div class="alert-title">${item.title || "แจ้งเตือน"}</div>
            <div class="alert-detail">${item.content || item.description || ''}</div>
          </div>
        </div>
        <div class="alert-item__arrow">&rsaquo;</div>
      </div>
    `
      )
      .join("");
  }

  // Modal Functions
  window.openAlertModal = function (index) {
    const alertData = globalAnnouncements[index];
    if (!alertData) return;

    const modal = document.getElementById("alert-modal");
    const titleEl = document.getElementById("modal-title");
    const dateEl = document.getElementById("modal-date");
    const contentEl = document.getElementById("modal-content");

    if (titleEl) titleEl.textContent = alertData.title || "รายละเอียดแจ้งเตือน";
    
    // Display date
    if (dateEl) {
      const dateText = alertData.created_at || alertData.date || "";
      dateEl.textContent = dateText ? `วันที่: ${dateText}` : "";
    }

    if (contentEl) {
      contentEl.textContent = alertData.content || alertData.description || "ไม่มีรายละเอียดเพิ่มเติม";
    }

    if (modal) {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
    }
  };

  window.closeAlertModal = function () {
    const modal = document.getElementById("alert-modal");
    if (modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }
  };

  function setupModalEvents() {
    const closeBtn = document.getElementById("modal-close-btn");
    const backdrop = document.getElementById("modal-backdrop");

    if (closeBtn) closeBtn.addEventListener("click", window.closeAlertModal);
    if (backdrop) backdrop.addEventListener("click", window.closeAlertModal);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") window.closeAlertModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadAllDashboardData();
      setupModalEvents();
    });
  } else {
    loadAllDashboardData();
    setupModalEvents();
  }

})();