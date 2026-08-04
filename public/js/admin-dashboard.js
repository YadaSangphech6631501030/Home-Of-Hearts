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
      const [roomsRes, maintRes, billingRes, parcelRes, announceRes] = await Promise.allSettled([
        API.get('/api/rooms'),
        fetch('/api/maintenance').then(r => r.json()),
        fetch('/api/billings').then(r => r.json()),
        fetch('/api/parcels').then(r => r.json()),
        fetch('/api/announcements').then(r => r.json())
      ]);

      // Room Summary
      if (roomsRes.status === 'fulfilled') {
        const rooms = roomsRes.value;
        const roomList = Array.isArray(rooms) ? rooms : (rooms.data || rooms.rooms || []);
        const total = roomList.length;
        const occupied = roomList.filter(r => {
          const s = String(r.status || '').toLowerCase().trim();
          return s === 'occupied' || s === 'ไม่ว่าง';
        }).length;
        const available = total - occupied;

        updateText('dash-total-rooms', total);
        updateText('dash-occupied-rooms', occupied);
        updateText('dash-available-rooms', available);
      }

      // profile menu
      document.addEventListener('DOMContentLoaded', () => {
      const accountMenuItems = document.querySelectorAll('.profile-dropdown__item[href="#"]');
  
    accountMenuItems.forEach(item => {
    if (item.textContent.includes('บัญชี')) {
      item.setAttribute('href', '/admin/account.html'); 
    }
  });
});

      // Maintenance Summary
      if (maintRes.status === 'fulfilled' && Array.isArray(maintRes.value)) {
        const maints = maintRes.value;
        const pending = maints.filter(i => i.status === 'รอดำเนินการ').length;
        const progress = maints.filter(i => i.status === 'กำลังดำเนินการ').length;
        const completed = maints.filter(i => i.status === 'เสร็จสิ้น').length;

        updateText('dash-maint-pending', pending);
        updateText('dash-maint-progress', progress);
        updateText('dash-maint-done', completed);
      }

      // Billing Summary
      if (billingRes.status === 'fulfilled' && Array.isArray(billingRes.value)) {
        const bills = billingRes.value;
        const total = bills.length;
        const completed = bills.filter(i => i.status === 'completed' || i.status === 'เสร็จสิ้น').length;
        const pending = total - completed;

        updateText('dash-bill-total', total);
        updateText('dash-bill-pending', pending);
        updateText('dash-bill-done', completed);
      }

      // Parcel Summary 
      if (parcelRes.status === 'fulfilled' && Array.isArray(parcelRes.value)) {
        const parcels = parcelRes.value;

        const pendingParcels = parcels.filter(p => p.status !== 'completed');
        const totalPending = pendingParcels.length;
        const boxCount = pendingParcels.filter(p => p.type === 'กล่อง').length;
        const envelopeCount = pendingParcels.filter(p => p.type === 'ซอง').length;

        updateText('dash-parcel-total', totalPending);
        updateText('dash-parcel-box', boxCount);
        updateText('dash-parcel-envelope', envelopeCount);
      }

      // Summary box mail 
      if (announceRes.status === 'fulfilled' && announceRes.value.success) {
        renderAlerts(announceRes.value.data || []);
      }

    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
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