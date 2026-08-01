document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("maintenance-tbody");
  const filterType = document.getElementById("filter-type");
  const filterStatus = document.getElementById("filter-status");
  const dateFrom = document.getElementById("date-from");
  const dateTo = document.getElementById("date-to");
  
  const lastUpdateElement = document.getElementById("last-update-date");

  async function fetchMaintenanceRequests() {
    try {
      const type = filterType ? filterType.value : "";
      const status = filterStatus ? filterStatus.value : "";
      const from = dateFrom ? dateFrom.value : "";
      const to = dateTo ? dateTo.value : "";

      // Query Parameters
      const queryParams = new URLSearchParams({
        ...(type && { type }),
        ...(status && { status }),
        ...(from && { from }),
        ...(to && { to })
      });

      const response = await fetch(`/api/maintenance?${queryParams.toString()}`);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

      const data = await response.json();
      
      // show information in table
      renderTable(data);
      
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
        <td>${item.type || "-"}</td>
        <td>
          <span class="status-cell">
            ${item.status || "รอดำเนินการ"} <span class="status-dot ${dotClass}"></span>
          </span>
        </td>
        <td>${formatDate(item.appointmentDate)}</td>
        <td>${formatDate(item.completedDate)}</td>
        <td>
          <button class="btn-edit-row" data-id="${item._id}" title="แก้ไข">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
            </svg>
          </button>
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

  if (filterType) filterType.addEventListener("change", fetchMaintenanceRequests);
  if (filterStatus) filterStatus.addEventListener("change", fetchMaintenanceRequests);
  if (dateFrom) dateFrom.addEventListener("change", fetchMaintenanceRequests);
  if (dateTo) dateTo.addEventListener("change", fetchMaintenanceRequests);


  fetchMaintenanceRequests();
});