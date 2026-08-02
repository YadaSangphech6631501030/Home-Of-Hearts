document.addEventListener("DOMContentLoaded", () => {
  // Add Modal Elements
  const addModal = document.getElementById("announcement-modal");
  const openModalBtn = document.getElementById("open-add-modal-btn");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const form = document.getElementById("announcement-form");
  const container = document.getElementById("announcement-list-container");
  const modalDateDisplay = document.getElementById("modal-date-display");

  // View Modal Elements
  const viewModal = document.getElementById("view-announcement-modal");
  const closeViewModalBtn = document.getElementById("close-view-modal-btn");
  const closeViewModalBottomBtn = document.getElementById("close-view-modal-bottom-btn");
  const deleteBtn = document.getElementById("delete-announcement-btn");

  const viewAuthor = document.getElementById("view-modal-author");
  const viewDate = document.getElementById("view-modal-date");
  const viewTitle = document.getElementById("view-modal-title");
  const viewContent = document.getElementById("view-modal-content");

  let currentAnnouncements = [];
  let selectedAnnouncementId = null;

  // โหลดรายการเมื่อเปิดหน้า
  fetchAnnouncements();

  // วันที่ปัจจุบันใน Add Modal
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const formattedToday = `${day}/${month}/${year}`;
  
  if (modalDateDisplay) modalDateDisplay.textContent = formattedToday;

  // Event Open/Close Add Modal
  openModalBtn?.addEventListener("click", () => addModal?.classList.add("active"));
  closeModalBtn?.addEventListener("click", closeAddModal);
  addModal?.addEventListener("click", (e) => { if (e.target === addModal) closeAddModal(); });

  function closeAddModal() {
    addModal?.classList.remove("active");
    form?.reset();
  }

  // Event Close View Modal
  closeViewModalBtn?.addEventListener("click", closeViewModal);
  closeViewModalBottomBtn?.addEventListener("click", closeViewModal);
  viewModal?.addEventListener("click", (e) => { if (e.target === viewModal) closeViewModal(); });

  function closeViewModal() {
    viewModal?.classList.remove("active");
    selectedAnnouncementId = null;
  }

  // Fetch Announcements
  async function fetchAnnouncements() {
    try {
      const res = await fetch("/api/announcements");
      const result = await res.json();
      if (result.success) {
        currentAnnouncements = result.data;
        renderList(currentAnnouncements);
      }
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  }

  // Render List Card
  function renderList(list) {
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: #888; padding: 40px;">
          ยังไม่มีรายการประกาศในขณะนี้
        </div>
      `;
      return;
    }

    container.innerHTML = list
      .map(
        (item) => `
      <div class="announcement-card" data-id="${item._id}">
        <div class="ann-title">${item.title}</div>
        <div class="ann-preview">${item.content}</div>
        <div class="ann-date">${item.date}</div>
        <div class="ann-arrow">&rsaquo;</div>
      </div>
    `
      )
      .join("");

    // ผูก Event Click ให้กับการ์ดทุกใบ เพื่อเปิด View Popup
    document.querySelectorAll(".announcement-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        openViewModal(id);
      });
    });
  }

  // Function เปิด Popup อ่านประกาศ
  function openViewModal(id) {
    const item = currentAnnouncements.find((a) => a._id === id);
    if (!item) return;

    selectedAnnouncementId = id;
    if (viewAuthor) viewAuthor.innerHTML = item.author ? item.author.replace("\n", "<br>") : "สำนักงานหอพัก<br>บ้านแห่งหัวใจ";
    if (viewDate) viewDate.textContent = item.date;
    if (viewTitle) viewTitle.textContent = item.title;
    if (viewContent) viewContent.textContent = item.content;

    viewModal?.classList.add("active");
  }

  // Submit สร้างประกาศใหม่
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("announcement-title")?.value.trim();
    const content = document.getElementById("announcement-content")?.value.trim();

    if (!title || !content) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, date: formattedToday }),
      });

      const result = await res.json();
      if (result.success) {
        closeAddModal();
        fetchAnnouncements();
      }
    } catch (err) {
      console.error("Error creating announcement:", err);
    }
  });

  // ลบประกาศ
  deleteBtn?.addEventListener("click", async () => {
    if (!selectedAnnouncementId) return;

    if (confirm("คุณต้องการลบประกาศนี้ใช่หรือไม่?")) {
      try {
        const res = await fetch(`/api/announcements/${selectedAnnouncementId}`, {
          method: "DELETE",
        });

        const result = await res.json();
        if (result.success) {
          closeViewModal();
          fetchAnnouncements();
        }
      } catch (err) {
        console.error("Error deleting announcement:", err);
      }
    }
  });
});