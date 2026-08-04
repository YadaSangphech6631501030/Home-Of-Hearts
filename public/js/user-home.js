document.addEventListener("DOMContentLoaded", () => {
  const profileTrigger = document.getElementById("user-profile-trigger");
  const profileDropdown = document.getElementById("user-profile-dropdown");
  const logoutButton = document.getElementById("user-logout");

  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener("click", () => {
      const isOpen = profileDropdown.classList.toggle("is-open");
      profileTrigger.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!profileTrigger.contains(event.target) && !profileDropdown.contains(event.target)) {
        profileDropdown.classList.remove("is-open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutButton) logoutButton.addEventListener("click", () => API.logout());

  const storedUser = API.getUser();
  applyUser(storedUser);
  loadUserHome();

  async function loadUserHome() {
    try {
      const me = await API.get("/api/me");
      const user = me.data || me.user || me;
      if (user.role === "admin") {
        window.location.href = "/admin/index.html";
        return;
      }
      localStorage.setItem(CONFIG.USER_KEY, JSON.stringify({ ...storedUser, ...user }));
      applyUser({ ...storedUser, ...user });
      await loadCards(user.roomNumber || user.room);
    } catch (error) {
      if (!API.getToken()) window.location.href = "/";
      renderEmpty("user-alerts", "ยังไม่มีแจ้งเตือน");
      renderEmpty("user-announcements", "ยังไม่มีประกาศ");
    }
  }

  function applyUser(user = {}) {
    const name = user.name || "ผู้เช่า";
    const room = user.roomNumber || user.room || "-";
    const initial = name.trim().charAt(0) || "ผ";
    setText("user-profile-name", name);
    setText("user-menu-name", name);
    setText("user-avatar", initial);
    setText("user-menu-avatar", initial);
    setText("user-greeting", "👋🏻 สวัสดี คุณ" + name + " ห้อง " + room);
  }

  async function loadCards(roomNumber) {
    const alertsEl = document.getElementById("user-alerts");
    const announcementsEl = document.getElementById("user-announcements");
    if (!alertsEl && !announcementsEl) return;

    const response = await API.get("/api/user/home-data");
    const homeData = response.data || {};
    const latestBill = homeData.billing;
    const maintenance = homeData.maintenance;
    const announcements = homeData.announcements || [];

    const alerts = [
      {
        dot: "orange",
        title: "ค่าหอพัก 💵",
        text: latestBill ? "รอบล่าสุด: " + formatThaiDate(latestBill.dueDate) + "  สถานะ:" + formatStatus(latestBill.status) : "ยังไม่มีข้อมูล",
        href: "/user/billing.html",
      },
      {
        dot: "blue",
        title: "พัสดุใหม่ 📦",
        text: (homeData.pendingParcelCount || 0) + " ชิ้น",
        href: "/user/parcels.html",
      },
      {
        dot: "red",
        title: "แจ้งซ่อม 🔨",
        text: maintenance ? formatStatus(maintenance.status) : "ยังไม่มีรายการ",
        href: "/user/maintenance.html",
      },
    ];

    renderAlertList(alertsEl, alerts);
    renderList(announcementsEl, announcements.slice(0, 2).map((item) => ({ dot: "red", title: item.title || "ประกาศ", text: item.content || "", href: "/user/announcements.html" })), "ยังไม่มีประกาศ");
  }

  function normalizeList(result) {
    if (result.status !== "fulfilled") return [];
    const value = result.value;
    if (Array.isArray(value)) return value;
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.items)) return value.items;
    return [];
  }

  function renderAlertList(container, items) {
    if (!container) return;
    container.innerHTML = items.map((item) => "<a class=\"alert-list-item\" href=\"" + item.href + "\"><span class=\"list-dot list-dot--" + item.dot + "\"></span><span class=\"alert-list-copy\"><strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.text) + "</span></span><span class=\"list-arrow\">›</span></a>").join("");
  }

  function renderList(container, items, emptyText) {
    if (!container) return;
    if (!items.length) {
      renderEmpty(container.id, emptyText);
      return;
    }
    container.innerHTML = items.map((item) => "<a class=\"list-item\" href=\"" + item.href + "\"><span class=\"list-dot list-dot--" + item.dot + "\"></span><span class=\"list-copy\"><strong>" + escapeHtml(item.title) + "</strong><span>" + escapeHtml(item.text) + "</span></span><span class=\"list-arrow\">›</span></a>").join("");
  }

  function renderEmpty(id, text) {
    const element = document.getElementById(id);
    if (element) element.innerHTML = "<p class=\"empty-text\">" + text + "</p>";
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function formatStatus(status) {
    if (!status) return "-";
    const statusMap = {
      pending: "รอดำเนินการ",
      completed: "เสร็จสิ้น",
      progress: "กำลังดำเนินการ",
      in_progress: "กำลังดำเนินการ",
    };
    return statusMap[status] || status;
  }

  function formatThaiDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[char]));
  }
});
