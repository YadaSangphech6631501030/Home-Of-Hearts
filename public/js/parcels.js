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
  const roomSelect = document.getElementById("modal-room");
  const tenantNameDisplay = document.getElementById("modal-tenant-name");

  let currentEditId = null;
  let parcelsData = [];
  let occupiedRoomsData = [];

  const imagePreviewModal = document.createElement("div");
  imagePreviewModal.className = "parcel-image-modal";
  imagePreviewModal.innerHTML = [
    '<div class="parcel-image-card" role="dialog" aria-label="รูปภาพพัสดุ">',
    '<button class="parcel-image-close" type="button" aria-label="ปิด">&times;</button>',
    '<h2>รูปภาพพัสดุ</h2>',
    '<div class="parcel-image-frame"><img class="parcel-image-preview" alt="รูปภาพพัสดุ" /></div>',
    '</div>'
  ].join("");
  document.body.appendChild(imagePreviewModal);

  const imagePreview = imagePreviewModal.querySelector(".parcel-image-preview");
  const imagePreviewClose = imagePreviewModal.querySelector(".parcel-image-close");

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

  function readImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function openImagePreview(imageUrl) {
    if (!imageUrl) {
      alert("ไม่มีรูปภาพสำหรับพัสดุชิ้นนี้");
      return;
    }

    if (imagePreview) imagePreview.src = imageUrl;
    imagePreviewModal.classList.add("is-open");
  }

  function closeImagePreview() {
    imagePreviewModal.classList.remove("is-open");
    if (imagePreview) imagePreview.removeAttribute("src");
  }

  imagePreviewClose?.addEventListener("click", closeImagePreview);
  imagePreviewModal.addEventListener("click", (event) => {
    if (event.target === imagePreviewModal) closeImagePreview();
  });

  // DD/MM/YYYY to YYYY-MM-DD
  function parseDateToInputFormat(dateStr) {
    if (!dateStr || !dateStr.includes("/")) return "";
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Fetch and Render Parcels Table
  fetchParcels();
  loadOccupiedRooms();

  async function fetchParcels() {
    try {
      const response = await fetch("/api/parcels");
      if (!response.ok) throw new Error("Failed to fetch parcels");
      parcelsData = await response.json();
      updateLastModifiedDate(parcelsData);
      renderTable(getFilteredParcels());
    } catch (err) {
      console.warn("API error or no data:", err);
      parcelsData = [];
      updateLastModifiedDate([]);
      renderTable([]);
    }
  }

  async function loadOccupiedRooms() {
    if (!roomSelect) return;

    try {
      const response = await fetch("/api/rooms");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const result = await response.json();
      const rooms = Array.isArray(result) ? result : (result.data || result.rooms || []);

      occupiedRoomsData = rooms.filter((room) => {
        const status = String(room.status || "").toLowerCase().trim();
        const tenantName = String(room.tenant?.fullName || "").trim();
        return status === "occupied" || status === "ไม่ว่าง" || (tenantName && tenantName !== "-");
      });

      renderRoomOptions();
    } catch (error) {
      console.error("Error loading occupied rooms:", error);
      occupiedRoomsData = [];
      renderRoomOptions();
    }
  }

  function renderRoomOptions(selectedRoom = "") {
    if (!roomSelect) return;

    const currentValue = selectedRoom || roomSelect.value || "";
    roomSelect.innerHTML = '<option value="" disabled selected hidden>เลือกห้อง</option>';

    occupiedRoomsData.forEach((room) => {
      const option = document.createElement("option");
      option.value = room.roomNumber;
      option.textContent = room.roomNumber;
      roomSelect.appendChild(option);
    });

    if (currentValue && occupiedRoomsData.some((room) => String(room.roomNumber) === String(currentValue))) {
      roomSelect.value = currentValue;
    }

    updateTenantName();
  }

  function updateTenantName() {
    if (!tenantNameDisplay) return;
    const selectedRoom = roomSelect?.value || "";
    const room = occupiedRoomsData.find((item) => String(item.roomNumber) === String(selectedRoom));
    tenantNameDisplay.textContent = room?.tenant?.fullName || "-";
  }

  function updateLastModifiedDate(parcels) {
    if (!updateDateEl) return;
    if (!parcels || parcels.length === 0) {
      setTodayDate();
      return;
    }

    const latestItem = parcels.reduce((latest, item) => {
      const currentDate = new Date(item.updatedAt || item.createdAt || 0);
      const latestDate = new Date(latest.updatedAt || latest.createdAt || 0);
      return currentDate > latestDate ? item : latest;
    }, parcels[0]);

    updateDateEl.textContent = formatDateFromValue(latestItem.updatedAt || latestItem.createdAt || new Date());
  }

  function formatDateFromValue(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return day + "/" + month + "/" + year;
  }

  function parseDateValue(value) {
    if (!value || value === "-") return null;
    if (typeof value === "string" && value.includes("/")) {
      const [day, month, year] = value.split("/");
      const date = new Date(year + "-" + month + "-" + day);
      if (!Number.isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeParcelType(value) {
    const text = normalizeText(value);
    if (["small-box", "กล่องขนาดเล็ก", "กล่องเล็ก"].includes(text)) return "small-box";
    if (["medium-box", "กล่องขนาดกลาง", "กล่องกลาง"].includes(text)) return "medium-box";
    if (["large-box", "กล่องขนาดใหญ่", "กล่องใหญ่"].includes(text)) return "large-box";
    if (["envelope", "ซองเอกสาร", "ซอง"].includes(text)) return "envelope";
    if (["กล่อง", "box"].includes(text)) return "box";
    return text;
  }

  function normalizeCourier(value) {
    const text = normalizeText(value).replace(/\s+/g, "-");
    if (text === "ไปรษณีย์ไทย" || text === "thailandpost") return "thailand-post";
    if (text === "shopee-xpress" || text === "shopee-express") return "shopee";
    return text;
  }

  function getFilteredParcels() {
    const selectedType = filterType?.value || "all";
    const selectedCourier = filterCourier?.value || "all";
    const selectedStatus = filterStatus?.value || "all";
    const fromDate = parseDateValue(dateFrom?.value);
    const toDate = parseDateValue(dateTo?.value);
    const keyword = normalizeText(searchInput?.value);

    return parcelsData.filter((item) => {
      if (selectedType && selectedType !== "all") {
        const itemType = normalizeParcelType(item.type);
        if (itemType !== selectedType) return false;
      }

      if (selectedCourier && selectedCourier !== "all") {
        const itemCourier = normalizeCourier(item.courier);
        if (itemCourier !== selectedCourier) return false;
      }

      if (selectedStatus && selectedStatus !== "all" && item.status !== selectedStatus) return false;

      const receivedDate = parseDateValue(item.receivedDate || item.createdAt);
      if (fromDate && (!receivedDate || receivedDate < fromDate)) return false;
      if (toDate && (!receivedDate || receivedDate > toDate)) return false;

      if (keyword) {
        const searchable = [
          item.receivedDate,
          item.roomNumber,
          item.recipientName,
          item.type,
          item.courier,
          item.statusText,
          item.status === "completed" ? "เสร็จสิ้น" : "รอรับพัสดุ",
          item.completedDate,
          item.note,
        ].map(normalizeText).join(" ");

        if (!searchable.includes(keyword)) return false;
      }

      return true;
    });
  }

  function applyParcelFilters() {
    renderTable(getFilteredParcels());
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
            <button class="btn-action view-image-btn" data-id="${item._id || item.id}" title="ดูรูปภาพพัสดุ">
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
      const item = parcelsData.find((p) => String(p._id || p.id) === String(id));
      openImagePreview(item?.imageUrl);
      return;
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

      if (roomEl) renderRoomOptions(item.roomNumber || "");
      if (courierEl) courierEl.value = item.courier || "";
      if (typeEl) typeEl.value = item.type || "";
      if (noteEl) noteEl.value = item.note === "-" ? "" : (item.note || "");
      if (recipientEl) recipientEl.value = item.recipientName === "-" ? "" : (item.recipientName || "");

      if (dateEl) dateEl.value = parseDateToInputFormat(item.receivedDate);
      if (completedDateEl) completedDateEl.value = parseDateToInputFormat(item.completedDate);
      if (fileNameDisplay) fileNameDisplay.textContent = item.imageUrl ? "(มีรูปภาพเดิม)" : "";

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
    renderRoomOptions("");
    openModal(false);
  });

  closeModalBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  roomSelect?.addEventListener("change", updateTenantName);

  imageInput?.addEventListener("change", (e) => {
    fileNameDisplay.textContent = e.target.files.length > 0 ? `(${e.target.files[0].name})` : "";
  });

  let parcelSearchTimer = null;
  searchInput?.addEventListener("input", () => {
    clearTimeout(parcelSearchTimer);
    parcelSearchTimer = setTimeout(applyParcelFilters, 200);
  });
  filterType?.addEventListener("change", applyParcelFilters);
  filterCourier?.addEventListener("change", applyParcelFilters);
  filterStatus?.addEventListener("change", applyParcelFilters);
  dateFrom?.addEventListener("change", applyParcelFilters);
  dateTo?.addEventListener("change", applyParcelFilters);

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
    const existingParcel = currentEditId
      ? parcelsData.find((p) => String(p._id || p.id) === String(currentEditId))
      : null;
    const selectedImage = imageInput?.files?.[0];
    const imageUrl = selectedImage ? await readImageAsDataUrl(selectedImage) : (existingParcel?.imageUrl || "");

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
      statusText: isCompleted ? "เสร็จสิ้น" : "รอรับพัสดุ",
      imageUrl
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