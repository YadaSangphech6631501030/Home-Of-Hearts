document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("maintenance-tbody");
  const filterType = document.getElementById("filter-type");
  const searchInput = document.getElementById("search-input");
  const filterStatus = document.getElementById("filter-status");
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  
  const lastUpdateElement = document.getElementById("last-update-date");
  const editModal = document.getElementById("maintenance-edit-modal");
  const editForm = document.getElementById("maintenance-edit-form");
  const editClose = document.getElementById("maintenance-edit-close");
  const editCancel = document.getElementById("maintenance-edit-cancel");
  const editStatus = document.getElementById("maintenance-edit-status");
  const editAppointment = document.getElementById("maintenance-edit-appointment");
  const editCompleted = document.getElementById("maintenance-edit-completed");
  const editSummary = document.getElementById("maintenance-edit-summary");
  const editMessage = document.getElementById("maintenance-edit-message");
  const viewModal = document.getElementById("maintenance-view-modal");
  const viewClose = document.getElementById("maintenance-view-close");
  const deleteModal = document.getElementById("maintenance-delete-modal");
  const deleteCancel = document.getElementById("maintenance-delete-cancel");
  const deleteConfirm = document.getElementById("maintenance-delete-confirm");
  const deleteSummary = document.getElementById("maintenance-delete-summary");
  const deleteMessage = document.getElementById("maintenance-delete-message");
  let currentRequests = [];
  let editingId = null;
  let deletingId = null;

  async function fetchMaintenanceRequests() {
    try {
      const search = searchInput ? searchInput.value.trim() : "";
      const type = filterType ? filterType.value : "";
      const status = filterStatus ? filterStatus.value : "";
      const from = dateFrom ? dateFrom.value : "";
      const to = dateTo ? dateTo.value : "";

      // Query Parameters
      const queryParams = new URLSearchParams({
        ...(search && { search }),
        ...(type && { type }),
        ...(status && { status }),
        ...(from && { from }),
        ...(to && { to })
      });

      const data = await API.get(`/api/maintenance?${queryParams.toString()}`);
      
      // show information in table
      currentRequests = Array.isArray(data) ? data : [];
      renderTable(currentRequests);
      
      // updates day
      updateLastModifiedDate(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      renderEmptyState();
    }
  }

  function updateLastModifiedDate(data) {
    if (!lastUpdateElement) return;

    if (!data || data.length === 0) {
      lastUpdateElement.textContent = formatDate(new Date());
      return;
    }

    const latestTimestamp = data.reduce((max, item) => {
      const itemDate = new Date(item.updatedAt || item.createdAt || 0);
      return itemDate > max ? itemDate : max;
    }, new Date(0));

    if (latestTimestamp.getTime() > 0) {
      lastUpdateElement.textContent = formatDate(latestTimestamp);
    } else {
      lastUpdateElement.textContent = formatDate(new Date());
    }
  }

  function renderTable(data) {
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      renderEmptyState();
      return;
    }

    data.forEach((item) => {
      let dotClass = "dot--pending";
      if (item.status === "กำลังดำเนินการ") dotClass = "dot--progress";
      if (item.status === "เสร็จสิ้น") dotClass = "dot--completed";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(item.createdAt)}</td>
        <td>${item.roomNumber || "-"}</td>
        <td>${item.senderName || "-"}</td>
        <td>${item.type || "-"}${item.title ? `<br><small>${item.title}</small>` : ""}</td>
        <td>
          <span class="status-cell">
            ${item.status || "รอดำเนินการ"} <span class="status-dot ${dotClass}"></span>
          </span>
        </td>
        <td>${formatDate(item.appointmentDate)}</td>
        <td>${formatDate(item.completedDate)}</td>
        <td>
          <div class="maintenance-action-buttons">
            <button class="maintenance-action-btn btn-view-row" data-id="${item._id}" type="button" title="ดูรายละเอียด" aria-label="ดูรายละเอียด">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="maintenance-action-btn btn-edit-row" data-id="${item._id}" type="button" title="แก้ไข" aria-label="แก้ไข">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <button class="maintenance-action-btn btn-delete-row" data-id="${item._id}" type="button" title="ลบ" aria-label="ลบ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateSummary(data);
  }

  function renderEmptyState() {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding: 40px; color: #a0a0a0;">
          ไม่พบข้อมูลรายการแจ้งซ่อม
        </td>
      </tr>
    `;
    updateSummary([]);
  }

  // update summary
  function updateSummary(data) {
    const totalEl = document.getElementById("summary-total");
    const pendingEl = document.getElementById("count-pending");
    const progressEl = document.getElementById("count-progress");
    const completedEl = document.getElementById("count-completed");

    if (totalEl) totalEl.textContent = `พบข้อมูลทั้งหมด ${data.length} รายการ`;
    if (pendingEl) pendingEl.textContent = data.filter(i => i.status === "รอดำเนินการ").length;
    if (progressEl) progressEl.textContent = data.filter(i => i.status === "กำลังดำเนินการ").length;
    if (completedEl) completedEl.textContent = data.filter(i => i.status === "เสร็จสิ้น").length;
  }

  function formatDate(dateStr) {
    if (!dateStr || dateStr === "-") return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function findRequestById(id) {
    return currentRequests.find((request) => String(request._id) === String(id));
  }

  function setViewText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || "-";
  }

  function openViewModal(id) {
    const item = findRequestById(id);
    if (!item || !viewModal) return;

    setViewText("maintenance-view-date", formatDate(item.createdAt));
    setViewText("maintenance-view-room", item.roomNumber || "-");
    setViewText("maintenance-view-sender", item.senderName || "-");
    setViewText("maintenance-view-type", item.type || "-");
    setViewText("maintenance-view-status", item.status || "รอดำเนินการ");
    setViewText("maintenance-view-appointment", formatDate(item.appointmentDate));
    setViewText("maintenance-view-completed", formatDate(item.completedDate));
    setViewText("maintenance-view-topic", item.title || "-");
    setViewText("maintenance-view-description", item.description || "-");

    viewModal.classList.add("is-open");
    viewModal.setAttribute("aria-hidden", "false");
  }

  function closeViewModal() {
    viewModal?.classList.remove("is-open");
    viewModal?.setAttribute("aria-hidden", "true");
  }

  function openDeleteModal(id) {
    const item = findRequestById(id);
    if (!item || !deleteModal) return;
    deletingId = id;
    if (deleteSummary) deleteSummary.textContent = "ห้อง " + (item.roomNumber || "-") + " • " + (item.senderName || "-") + " • " + (item.type || "-");
    if (deleteMessage) deleteMessage.textContent = "";
    deleteModal.classList.add("is-open");
    deleteModal.setAttribute("aria-hidden", "false");
  }

  function closeDeleteModal() {
    deleteModal?.classList.remove("is-open");
    deleteModal?.setAttribute("aria-hidden", "true");
    deletingId = null;
    if (deleteMessage) deleteMessage.textContent = "";
  }

  function openEditModal(id) {
    const item = findRequestById(id);
    if (!item || !editModal) return;
    editingId = id;
    if (editStatus) editStatus.value = item.status || "รอดำเนินการ";
    if (editAppointment) editAppointment.value = toInputDate(item.appointmentDate);
    if (editCompleted) editCompleted.value = toInputDate(item.completedDate);
    if (editSummary) editSummary.textContent = "ห้อง " + (item.roomNumber || "-") + " • " + (item.senderName || "-") + " • " + (item.type || "-");
    if (editMessage) {
      editMessage.textContent = "";
      editMessage.classList.remove("is-success");
    }
    editModal.classList.add("is-open");
    editModal.setAttribute("aria-hidden", "false");
  }

  function closeEditModal() {
    editModal?.classList.remove("is-open");
    editModal?.setAttribute("aria-hidden", "true");
    editingId = null;
    editForm?.reset();
  }

  function toInputDate(value) {
    if (!value || value === "-") return "";
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    if (typeof value === "string" && value.includes("/")) {
      const [day, month, year] = value.split("/");
      return year + "-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  tbody?.addEventListener("click", (event) => {
    const button = event.target.closest(".maintenance-action-btn");
    if (!button) return;

    if (button.classList.contains("btn-view-row")) {
      openViewModal(button.dataset.id);
      return;
    }

    if (button.classList.contains("btn-edit-row")) {
      openEditModal(button.dataset.id);
      return;
    }

    if (button.classList.contains("btn-delete-row")) {
      openDeleteModal(button.dataset.id);
    }
  });

  viewClose?.addEventListener("click", closeViewModal);
  viewModal?.addEventListener("click", (event) => {
    if (event.target === viewModal) closeViewModal();
  });

  deleteCancel?.addEventListener("click", closeDeleteModal);
  deleteModal?.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeDeleteModal();
  });

  deleteConfirm?.addEventListener("click", async () => {
    if (!deletingId) return;
    try {
      await API.delete("/api/maintenance/" + deletingId);
      currentRequests = currentRequests.filter((item) => String(item._id) !== String(deletingId));
      renderTable(currentRequests);
      updateLastModifiedDate(currentRequests);
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting maintenance:", error);
      if (deleteMessage) deleteMessage.textContent = error.message || "ลบไม่สำเร็จ";
    }
  });

  editClose?.addEventListener("click", closeEditModal);
  editCancel?.addEventListener("click", closeEditModal);
  editModal?.addEventListener("click", (event) => {
    if (event.target === editModal) closeEditModal();
  });

  editForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!editingId) return;

    try {
      const response = await API.put("/api/maintenance/" + editingId, {
        status: editStatus?.value || "รอดำเนินการ",
        appointmentDate: editAppointment?.value || "",
        completedDate: editCompleted?.value || "",
      });

      if (editMessage) {
        editMessage.textContent = "บันทึกข้อมูลแล้ว";
        editMessage.classList.add("is-success");
      }

      const updated = response.data || response;
      currentRequests = currentRequests.map((item) => String(item._id) === String(editingId) ? updated : item);
      renderTable(currentRequests);
      updateLastModifiedDate(currentRequests);
      setTimeout(closeEditModal, 500);
    } catch (error) {
      console.error("Error updating maintenance:", error);
      if (editMessage) {
        editMessage.textContent = error.message || "บันทึกไม่สำเร็จ";
        editMessage.classList.remove("is-success");
      }
    }
  });

  let searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(fetchMaintenanceRequests, 250);
    });
  }

  if (filterType) filterType.addEventListener("change", fetchMaintenanceRequests);
  if (filterStatus) filterStatus.addEventListener("change", fetchMaintenanceRequests);
  if (dateFrom) dateFrom.addEventListener("change", fetchMaintenanceRequests);
  if (dateTo) dateTo.addEventListener("change", fetchMaintenanceRequests);


  fetchMaintenanceRequests();
});