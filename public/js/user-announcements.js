document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("user-announcement-list");
  const modal = document.getElementById("user-announcement-modal");
  const closeButton = document.getElementById("user-announcement-modal-close");
  const modalAuthor = document.getElementById("announcement-modal-author");
  const modalDate = document.getElementById("announcement-modal-date");
  const modalTitle = document.getElementById("user-announcement-modal-title");
  const modalContent = document.getElementById("announcement-modal-content");
  let announcements = [];

  closeButton?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  list?.addEventListener("click", (event) => {
    const item = event.target.closest(".user-announcement-item");
    if (!item) return;
    openModal(item.dataset.id);
  });

  loadAnnouncements();

  async function loadAnnouncements() {
    try {
      const response = await API.get("/api/announcements");
      announcements = response.data || [];
      renderList(announcements);
    } catch (error) {
      renderList([]);
    }
  }

  function renderList(items) {
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="user-announcement-empty">ยังไม่มีรายการประกาศในขณะนี้</div>';
      return;
    }

    list.innerHTML = items.map((item) => '<button class="user-announcement-item" type="button" data-id="' + escapeAttribute(item._id || item.id || '') + '">'
      + '<span class="user-announcement-dot"></span>'
      + '<span class="user-announcement-title">' + escapeHtml(item.title || 'ประกาศ') + '</span>'
      + '<span class="user-announcement-preview">' + escapeHtml(item.content || '') + '</span>'
      + '<span class="user-announcement-date">' + escapeHtml(formatShortDate(item.date || item.createdAt)) + '</span>'
      + '<span class="user-announcement-arrow">›</span>'
      + '</button>').join('');
  }

  function openModal(id) {
    const item = announcements.find((entry) => String(entry._id || entry.id || '') === String(id));
    if (!item || !modal) return;
    if (modalAuthor) modalAuthor.textContent = item.author || 'สำนักงานหอพักบ้านแห่งหัวใจ';
    if (modalDate) modalDate.textContent = formatShortDate(item.date || item.createdAt);
    if (modalTitle) modalTitle.textContent = item.title || 'ประกาศ';
    if (modalContent) modalContent.textContent = item.content || '';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
  }

  function formatShortDate(value) {
    if (!value) return '-';
    if (typeof value === 'string' && value.includes('/')) {
      const parts = value.split('/');
      if (parts.length === 3) return parts[0].padStart(2, '0') + '/' + parts[1].padStart(2, '0') + '/' + String(parts[2]).slice(-2);
      return value;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + String(date.getFullYear()).slice(-2);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
});
