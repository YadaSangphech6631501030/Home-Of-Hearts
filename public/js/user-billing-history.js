document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("billing-history-back")?.addEventListener("click", () => {
    window.location.href = "/user/billing.html";
  });
  loadBillingHistory();
});

async function loadBillingHistory() {
  const tbody = document.getElementById("billing-history-body");
  if (!tbody) return;

  try {
    const response = await API.get("/api/user/billing-history");
    const history = response.data || [];
    if (!history.length) {
      renderEmptyHistory("ยังไม่มีประวัติการชำระค่าหอพัก");
      return;
    }

    tbody.innerHTML = history.map(renderHistoryRow).join("");
  } catch (error) {
    if (!API.getToken()) {
      window.location.href = "/";
      return;
    }
    renderEmptyHistory("ไม่สามารถโหลดประวัติการชำระได้");
  }
}

function renderHistoryRow(item) {
  const paid = item.status === "completed" || item.status === "เสร็จสิ้น";
  const paidClass = paid ? " is-paid" : "";
  return [
    "<tr>",
    "<td>" + escapeHtml(formatCycle(item.cycle, item.dueDate)) + "</td>",
    "<td>" + escapeHtml(formatDate(item.dueDate)) + "</td>",
    "<td>" + escapeHtml(item.roomNumber || "-") + "</td>",
    '<td><span class="billing-history-status">' + escapeHtml(formatStatus(item.status)) + '<span class="billing-history-dot' + paidClass + '"></span></span></td>',
    "<td>" + escapeHtml(formatDate(item.completedDate)) + "</td>",
    "<td>" + escapeHtml(formatMoney(item.amount)) + "</td>",
    "<td>" + escapeHtml(item.note || "-") + "</td>",
    "</tr>",
  ].join("");
}

function renderEmptyHistory(message) {
  const tbody = document.getElementById("billing-history-body");
  if (tbody) tbody.innerHTML = '<tr><td class="billing-history-empty" colspan="7">' + escapeHtml(message) + '</td></tr>';
}

function formatCycle(cycle, dueDate) {
  if (cycle?.startDate && cycle?.endDate) return cycle.startDate + " ถึง " + cycle.endDate;
  return dueDate || "-";
}

function formatStatus(status) {
  const map = {
    pending: "รอดำเนินการ",
    completed: "เสร็จสิ้น",
    progress: "กำลังดำเนินการ",
    in_progress: "กำลังดำเนินการ",
  };
  return map[status] || status || "-";
}

function formatDate(value) {
  if (!value) return "-";
  if (typeof value === "string" && value.includes("/")) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return day + "/" + month + "/" + year;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}
