document.addEventListener("DOMContentLoaded", () => {
  const bellButtons = Array.from(document.querySelectorAll(".user-bell"));
  if (!bellButtons.length || !window.API) return;

  const READ_STORAGE_KEY = "homeOfHeartsReadAnnouncementIds";
  let announcements = [];

  const popup = createPopup();
  document.body.appendChild(popup.overlay);
  window.addEventListener("resize", positionPanel);
  window.addEventListener("scroll", positionPanel, true);

  bellButtons.forEach((button) => {
    button.classList.add("user-bell--notifiable");
    button.insertAdjacentHTML("beforeend", '<span class="user-notification-badge" aria-hidden="true"></span>');
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      togglePopup(button);
    });
  });

  loadAnnouncements();

  async function loadAnnouncements() {
    try {
      const response = await API.get("/api/announcements");
      announcements = Array.isArray(response.data) ? response.data : [];
      renderPopupList();
      updateBadge();
    } catch (error) {
      announcements = [];
      renderPopupList();
      updateBadge();
    }
  }

  function createPopup() {
    const overlay = document.createElement("div");
    overlay.className = "user-notification-modal";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="user-notification-card" role="dialog" aria-modal="true" aria-labelledby="user-notification-title">
        <div class="user-notification-header">
          <div>
            <h2 id="user-notification-title">ประกาศใหม่</h2>
            <p><span id="user-notification-count">0</span> รายการจากทางหอพัก</p>
          </div>
        </div>
        <div class="user-notification-list" id="user-notification-list"></div>
        <div class="user-notification-detail" id="user-notification-detail" hidden>
          <div class="user-notification-detail-meta">
            <span id="user-notification-detail-author">สำนักงานหอพักบ้านแห่งหัวใจ</span>
            <span id="user-notification-detail-date">-</span>
          </div>
          <h3 id="user-notification-detail-title"></h3>
          <p id="user-notification-detail-content"></p>
        </div>
      </div>`;

    overlay.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", closePopup);

    return { overlay };
  }

  function renderPopupList() {
    const list = document.getElementById("user-notification-list");
    if (!list) return;

    const unreadAnnouncements = getUnreadAnnouncements();

    if (!unreadAnnouncements.length) {
      list.innerHTML = '<p class="user-notification-empty">ยังไม่มีประกาศใหม่ในขณะนี้</p>';
      setText("user-notification-count", "0");
      return;
    }

    setText("user-notification-count", String(unreadAnnouncements.length));

    list.innerHTML = unreadAnnouncements.slice(0, 5).map((item, index) => {
      const id = escapeAttribute(item._id || item.id || String(index));
      return '<button class="user-notification-item" type="button" data-id="' + id + '">'
        + '<span class="user-notification-dot"></span>'
        + '<span class="user-notification-copy"><strong>' + escapeHtml(item.title || 'ประกาศ') + '</strong><small>' + escapeHtml(item.content || '') + '</small></span>'
        + '<span class="user-notification-date">' + escapeHtml(formatShortDate(item.date || item.createdAt)) + '</span>'
        + '<span class="user-notification-arrow">›</span>'
        + '</button>';
    }).join("");

    list.querySelectorAll(".user-notification-item").forEach((itemButton) => {
      itemButton.addEventListener("click", () => openAnnouncementPage(itemButton.dataset.id));
    });
  }

  function updateBadge() {
    const newCount = getUnreadAnnouncements().length;
    bellButtons.forEach((button) => {
      const badge = button.querySelector(".user-notification-badge");
      button.classList.toggle("has-notification", newCount > 0);
      if (badge) {
        badge.textContent = newCount > 9 ? "9+" : String(newCount || "");
        badge.setAttribute("aria-hidden", newCount > 0 ? "false" : "true");
      }
      button.setAttribute("aria-label", newCount > 0 ? "แจ้งเตือน มีประกาศใหม่ " + newCount + " รายการ" : "แจ้งเตือน");
    });
  }

  function togglePopup(button) {
    if (popup.overlay.classList.contains("is-open")) {
      closePopup();
      return;
    }
    openPopup(button);
  }

  function openPopup(button) {
    showList();
    popup.anchor = button;
    popup.overlay.classList.add("is-open");
    popup.overlay.setAttribute("aria-hidden", "false");
    positionPanel();
  }

  function closePopup() {
    popup.overlay.classList.remove("is-open");
    popup.overlay.setAttribute("aria-hidden", "true");
    popup.anchor = null;
  }

  function positionPanel() {
    if (!popup.overlay.classList.contains("is-open") || !popup.anchor) return;
    const card = popup.overlay.querySelector(".user-notification-card");
    if (!card) return;
    const rect = popup.anchor.getBoundingClientRect();
    const cardWidth = Math.min(430, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - cardWidth - 12, rect.right - cardWidth + 24));
    popup.overlay.style.setProperty("--notification-left", left + "px");
    popup.overlay.style.setProperty("--notification-top", rect.bottom + 12 + "px");
  }

  function openAnnouncementPage(id) {
    const item = announcements.find((entry, index) => getAnnouncementId(entry, index) === String(id));
    if (!item) return;
    markAnnouncementRead(id);
    window.location.href = "/user/announcements.html?announcement=" + encodeURIComponent(id);
  }

  function showList() {
    const list = document.getElementById("user-notification-list");
    const detail = document.getElementById("user-notification-detail");
    if (list) list.hidden = false;
    if (detail) detail.hidden = true;
  }

  function getUnreadAnnouncements() {
    const readIds = getReadIds();
    return announcements.filter((item, index) => !readIds.has(getAnnouncementId(item, index)));
  }

  function getReadIds() {
    try {
      const stored = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]");
      return new Set(Array.isArray(stored) ? stored.map(String) : []);
    } catch (error) {
      return new Set();
    }
  }

  function markAnnouncementRead(id) {
    const readIds = getReadIds();
    readIds.add(String(id));
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  }

  function getAnnouncementId(item, index) {
    return String(item?._id || item?.id || index);
  }

  function formatShortDate(value) {
    if (!value) return "-";
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) return parts[0].padStart(2, "0") + "/" + parts[1].padStart(2, "0") + "/" + String(parts[2]).slice(-2);
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + String(date.getFullYear()).slice(-2);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
});
