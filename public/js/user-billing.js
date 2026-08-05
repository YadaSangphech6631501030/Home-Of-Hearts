document.addEventListener("DOMContentLoaded", () => {
  loadUserBilling();

  const payButton = document.getElementById("billing-pay-button");
  const historyButton = document.getElementById("billing-history-button");

  payButton?.addEventListener("click", () => {
    alert("เตรียมเชื่อมต่อหน้าชำระเงิน");
  });

  historyButton?.addEventListener("click", () => {
    alert("เตรียมแสดงประวัติการชำระค่าหอพัก");
  });
});

async function loadUserBilling() {
  try {
    const response = await API.get("/api/user/billing-data");
    const data = response.data || {};
    const storedUser = API.getUser();
    const tenant = data.tenant || storedUser || {};
    const room = data.room || {};
    const billing = data.billing || null;

    const name = tenant.name || room.tenant?.fullName || storedUser.name || "-";
    const roomNumber = tenant.roomNumber || storedUser.roomNumber || room.roomNumber || billing?.roomNumber || "-";
    const amount = Number(billing?.amount || 0);
    const status = billing?.status || "pending";

    setText("billing-tenant-code", tenant.username || roomNumber || "-");
    setText("billing-tenant-name", name);
    setText("billing-status", formatStatus(status));
    setText("billing-due-date", formatDate(billing?.dueDate));
    setText("billing-room", roomNumber);
    setText("billing-rent-amount", formatMoney(amount));
    setText("billing-total", formatMoney(amount));

    const dot = document.getElementById("billing-status-dot");
    dot?.classList.toggle("is-paid", status === "completed" || status === "เสร็จสิ้น");

    if (!billing) {
      setText("billing-status", "ยังไม่มีข้อมูล");
      setText("billing-rent-amount", "0.00");
      setText("billing-total", "0.00");
    }
  } catch (error) {
    if (!API.getToken()) {
      window.location.href = "/";
      return;
    }
    setText("billing-status", "ยังไม่มีข้อมูล");
    setText("billing-due-date", "-");
    setText("billing-total", "0.00");
  }
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
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
