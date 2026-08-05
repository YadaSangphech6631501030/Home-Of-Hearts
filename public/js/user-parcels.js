document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("user-parcel-tbody");
  const typeFilter = document.getElementById("user-filter-type");
  const courierFilter = document.getElementById("user-filter-courier");
  const statusFilter = document.getElementById("user-filter-status");
  const dateFrom = document.getElementById("user-date-from");
  const dateTo = document.getElementById("user-date-to");
  const searchInput = document.getElementById("user-parcel-search");
  const updateDate = document.getElementById("user-update-date");
  let parcels = [];

  [typeFilter, courierFilter, statusFilter, dateFrom, dateTo, searchInput].forEach((element) => {
    element?.addEventListener("input", renderFiltered);
    element?.addEventListener("change", renderFiltered);
  });

  tbody?.addEventListener("click", (event) => {
    const button = event.target.closest(".btn-view-eye");
    if (!button) return;
    const imageUrl = button.dataset.image || "";
    if (imageUrl) window.open(imageUrl, "_blank");
    else alert("ไม่มีรูปภาพสำหรับพัสดุชิ้นนี้");
  });

  loadParcels();

  async function loadParcels() {
    try {
      const response = await API.get("/api/user/parcels");
      parcels = response.data || [];
      updateLastDate(parcels);
      renderFiltered();
    } catch (error) {
      if (!API.getToken()) {
        window.location.href = "/";
        return;
      }
      parcels = [];
      updateLastDate([]);
      renderRows([]);
    }
  }

  function renderFiltered() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    const selectedType = typeFilter?.value || "";
    const selectedCourier = courierFilter?.value || "";
    const selectedStatus = statusFilter?.value || "";
    const from = dateFrom?.value || "";
    const to = dateTo?.value || "";

    const filtered = parcels.filter((item) => {
      const receivedInputDate = toInputDate(item.receivedDate || item.createdAt);
      const statusText = formatStatus(item.status, item.statusText);
      const haystack = [item.receivedDate, item.roomNumber, item.recipientName, item.type, item.courier, statusText, item.completedDate, item.note].join(" ").toLowerCase();

      if (selectedType && item.type !== selectedType) return false;
      if (selectedCourier && item.courier !== selectedCourier) return false;
      if (selectedStatus && statusText !== selectedStatus) return false;
      if (from && receivedInputDate && receivedInputDate < from) return false;
      if (to && receivedInputDate && receivedInputDate > to) return false;
      if (keyword && !haystack.includes(keyword)) return false;
      return true;
    });

    renderRows(filtered);
  }

  function renderRows(items) {
    if (!tbody) return;
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state-cell">ไม่พบข้อมูลรายการพัสดุ</td></tr>';
      return;
    }

    tbody.innerHTML = items.map((item) => {
      const statusText = formatStatus(item.status, item.statusText);
      const doneDate = item.status === "completed" ? (item.completedDate || "-") : "-";
      const imageButton = item.imageUrl
        ? '<button class="btn-view-eye" type="button" data-image="' + escapeAttribute(item.imageUrl) + '" title="ดูรูปภาพ"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>'
        : '-';
      return '<tr>'
        + '<td>' + escapeHtml(formatDisplayDate(item.receivedDate || item.createdAt)) + '</td>'
        + '<td>' + escapeHtml(item.type || '-') + '</td>'
        + '<td>' + escapeHtml(item.courier || '-') + '</td>'
        + '<td>' + imageButton + '</td>'
        + '<td><span class="status-wrap">' + escapeHtml(statusText) + ' <span class="dot-status ' + (item.status === "completed" ? "dot-green" : "dot-grey") + '"></span></span></td>'
        + '<td>' + escapeHtml(doneDate || '-') + '</td>'
        + '<td>' + escapeHtml(item.recipientName || '-') + '</td>'
        + '<td>' + escapeHtml(item.note || '-') + '</td>'
        + '</tr>';
    }).join("");
  }

  function updateLastDate(items) {
    const latest = items.reduce((max, item) => {
      const current = new Date(item.updatedAt || item.createdAt || 0);
      return current > max ? current : max;
    }, new Date(0));
    setText(updateDate, latest.getTime() ? formatDate(latest) : formatDate(new Date()));
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function formatStatus(status, text) {
    if (status === "completed") return "เสร็จสิ้น";
    return "ยังไม่ได้รับ";
  }

  function formatDisplayDate(value) {
    if (!value) return "-";
    if (typeof value === "string" && value.includes("/")) return value;
    return formatDate(new Date(value));
  }

  function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
    return String(date.getDate()).padStart(2, "0") + "/" + String(date.getMonth() + 1).padStart(2, "0") + "/" + date.getFullYear();
  }

  function toInputDate(value) {
    if (!value) return "";
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      return parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0");
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
});
