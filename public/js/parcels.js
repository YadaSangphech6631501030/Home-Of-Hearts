document.addEventListener("DOMContentLoaded", () => {
  // Table and Filter Elements
  const parcelTableBody = document.getElementById("parcel-table-body");
  const searchInput = document.getElementById("parcel-search");
  const updateDateEl = document.getElementById("update-date");

  const filterType = document.getElementById("filter-type");
  const filterCourier = document.getElementById("filter-courier");
  const filterStatus = document.getElementById("filter-status");
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");

  // Modal Elements
  const modal = document.getElementById("add-parcel-modal");
  const openModalBtn = document.getElementById("open-add-parcel-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const addParcelForm = document.getElementById("add-parcel-form");
  const imageInput = document.getElementById("modal-image-input");
  const fileNameDisplay = document.getElementById("file-name-display");

  let currentEditId = null;
  let parcelsData = [];

  // Set Today's Date
  setTodayDate();

  function setTodayDate() {
    if (!updateDateEl) return;
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    updateDateEl.textContent = `${day}/${month}/${year}`;
  }

  // DD/MM/YYYY to YYYY-MM-DD
  function parseDateToInputFormat(dateStr) {
    if (!dateStr || !dateStr.includes("/")) return "";
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fetch and Render Parcels Table
  fetchParcels();

  async function fetchParcels() {
    try {
      const response = await fetch("/api/parcels");
      if (!response.ok) throw new Error("Failed to fetch parcels");
      parcelsData = await response.json();
      renderTable(parcelsData);
    } catch (err) {
      console.warn("API error or no data:", err);
      parcelsData = [];
      renderTable([]);
    }
  }

  function renderTable(parcels) {
    if (!parcelTableBody) return;

    if (!parcels || parcels.length === 0) {
      parcelTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state-cell">
            <div class="empty-state">
              <p>ไม่พบข้อมูลรายการพัสดุ</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    parcelTableBody.innerHTML = parcels
      .map(
        (item) => `
      <tr>
        <td>${item.receivedDate || "-"}</td>
        <td>${item.roomNumber || "-"}</td>
        <td>${item.recipientName || "-"}</td>
        <td>${item.type || "-"}</td>
        <td>${item.courier || "-"}</td>
        <td>
          <span class="status-cell">
            ${item.statusText || (item.status === "completed" ? "เสร็จสิ้น" : "รอดำเนินการ")} 
            <span class="status-dot ${item.status === "completed" ? "green" : "orange"}"></span>
          </span>
        </td>
        <td>${item.completedDate || "-"}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action view-image-btn" data-id="${item._id || item.id}" title="ดูรูปภาพพัสดุ" data-image="${item.imageUrl || ''}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-action edit-btn" data-id="${item._id || item.id}" title="แก้ไข">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <button class="btn-action delete-btn" data-id="${item._id || item.id}" title="ลบ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
        <td>${item.note || "-"}</td>
      </tr>
    `
      )
      .join("");
  }

  parcelTableBody?.addEventListener("click", async (e) => {
    const target = e.target.closest(".btn-action");
    if (!target) return;

    const id = target.dataset.id;

    if (target.classList.contains("view-image-btn")) {
      const item = parcelsData.find((p) => (p._id || p.id) === id);
      const imageUrl = target.dataset.image || (item && item.imageUrl);
      if (imageUrl) {
        window.open(imageUrl, "_blank");
      } else {
        alert("ไม่มีรูปภาพสำหรับพัสดุชิ้นนี้");
      }
    }

    if (target.classList.contains("edit-btn")) {
      const item = parcelsData.find((p) => (p._id || p.id) === id);
      if (!item) return;

      currentEditId = id;

      const roomEl = document.getElementById("modal-room");
      const courierEl = document.getElementById("modal-courier");
      const typeEl = document.getElementById("modal-type");
      const noteEl = document.getElementById("modal-note");
      const dateEl = document.getElementById("modal-date");
      const completedDateEl = document.getElementById("modal-completed-date");
      const recipientEl = document.getElementById("modal-recipient");

      if (roomEl) roomEl.value = item.roomNumber || "";
      if (courierEl) courierEl.value = item.courier || "";
      if (typeEl) typeEl.value = item.type || "";
      if (noteEl) noteEl.value = item.note === "-" ? "" : (item.note || "");
      if (recipientEl) recipientEl.value = item.recipientName === "-" ? "" : (item.recipientName || "");

      if (dateEl) dateEl.value = parseDateToInputFormat(item.receivedDate);
      if (completedDateEl) completedDateEl.value = parseDateToInputFormat(item.completedDate);

      openModal(true);
    }

    if (target.classList.contains("delete-btn")) {
      if (!confirm("คุณต้องการลบรายการพัสดุนี้ใช่หรือไม่?")) return;
      try {
        const res = await fetch(`/api/parcels/${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("ลบรายการพัสดุเรียบร้อยแล้ว");
          fetchParcels();
        } else {
          alert("เกิดข้อผิดพลาดในการลบพัสดุ");
        }
      } catch (err) {
        console.error("Error deleting parcel:", err);
      }
    }
  });

  const openModal = (isEdit = false) => {
    const modalTitle = document.querySelector(".modal-title");
    const submitBtn = document.querySelector(".btn-submit");

    if (modalTitle) modalTitle.textContent = isEdit ? "แก้ไขข้อมูลพัสดุ" : "เพิ่มพัสดุใหม่";
    if (submitBtn) submitBtn.textContent = isEdit ? "บันทึกข้อมูล" : "เพิ่มพัสดุใหม่";

    modal?.classList.add("active");
  };

  const closeModal = () => {
    modal?.classList.remove("active");
    addParcelForm?.reset();
    currentEditId = null;
    if (fileNameDisplay) fileNameDisplay.textContent = "";
  };

  openModalBtn?.addEventListener("click", () => {
    currentEditId = null;
    openModal(false);
  });

  closeModalBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  imageInput?.addEventListener("change", (e) => {
    fileNameDisplay.textContent = e.target.files.length > 0 ? `(${e.target.files[0].name})` : "";
  });

  // Submit Form
  addParcelForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // First day
    const rawDate = document.getElementById("modal-date")?.value;
    let formattedDate = "-";
    if (rawDate) {
      const [y, m, d] = rawDate.split("-");
      formattedDate = `${d}/${m}/${y}`;
    }

    // Completed day
    const rawCompletedDate = document.getElementById("modal-completed-date")?.value;
    let formattedCompletedDate = "-";
    if (rawCompletedDate) {
      const [cy, cm, cd] = rawCompletedDate.split("-");
      formattedCompletedDate = `${cd}/${cm}/${cy}`;
    }

    const recipientVal = document.getElementById("modal-recipient")?.value.trim() || "-";

    const isCompleted = rawCompletedDate !== "";

    const formData = {
      roomNumber: document.getElementById("modal-room")?.value || "",
      courier: document.getElementById("modal-courier")?.value || "",
      type: document.getElementById("modal-type")?.value || "",
      receivedDate: formattedDate,
      completedDate: formattedCompletedDate,
      recipientName: recipientVal,
      note: document.getElementById("modal-note")?.value || "-",
      status: isCompleted ? "completed" : "pending",
      statusText: isCompleted ? "เสร็จสิ้น" : "รอรับพัสดุ"
    };

    try {
      const url = currentEditId ? `/api/parcels/${currentEditId}` : "/api/parcels";
      const method = currentEditId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert(currentEditId ? "แก้ไขข้อมูลพัสดุเรียบร้อย!" : "เพิ่มพัสดุใหม่สำเร็จ!");
        closeModal();
        fetchParcels();
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error("Error saving parcel:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  });
});