const DEFAULT_BILLING_NOTE = "กรุณาชำระค่าเช่าภายในวันที่ 1-7 ของทุกเดือน หากเกินกำหนด<br />ปรับเพิ่มวันละ 50บาท";
const PAYMENT_QR_SECONDS = 5 * 60;
let paymentCountdownTimer = null;
let paymentSecondsLeft = PAYMENT_QR_SECONDS;
let currentBillingTotal = 0;
let currentBillingRoom = "-";

document.addEventListener("DOMContentLoaded", () => {
  loadUserBilling();

  const payButton = document.getElementById("billing-pay-button");
  const historyButton = document.getElementById("billing-history-button");

  payButton?.addEventListener("click", openPaymentModal);

  document.getElementById("payment-modal-close")?.addEventListener("click", closePaymentModal);
  document.getElementById("payment-qr-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "payment-qr-modal") closePaymentModal();
  });
  document.getElementById("payment-refresh-button")?.addEventListener("click", refreshPaymentQr);

  historyButton?.addEventListener("click", () => {
    window.location.href = "/user/billing-history.html";
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
    const cycle = data.cycle || null;

    const name = tenant.name || room.tenant?.fullName || storedUser.name || "-";
    const roomNumber = tenant.roomNumber || storedUser.roomNumber || room.roomNumber || billing?.roomNumber || "-";
    const status = billing?.status || "pending";
    const rentAmount = Number(billing?.rentAmount ?? billing?.amount ?? 0);
    const waterRate = Number(billing?.waterRate ?? 0);
    const waterUnits = Number(billing?.waterUnits ?? 0);
    const waterTotal = Number(billing?.waterTotal ?? waterRate * waterUnits);
    const electricityRate = Number(billing?.electricityRate ?? 0);
    const electricityUnits = Number(billing?.electricityUnits ?? 0);
    const electricityTotal = Number(billing?.electricityTotal ?? electricityRate * electricityUnits);
    const total = Number(billing?.amount ?? rentAmount + waterTotal + electricityTotal);
    currentBillingTotal = total;
    currentBillingRoom = roomNumber;

    setText("billing-tenant-code", tenant.username || roomNumber || "-");
    setText("billing-tenant-name", name);
    setText("billing-status", billing ? formatStatus(status) : "ยังไม่มีข้อมูล");
    setText("billing-due-date", formatDate(billing?.dueDate));
    setText("billing-note-cycle", formatBillingCycle(cycle, billing));
    setText("billing-room", roomNumber);

    setText("billing-rent-units", "-");
    setText("billing-water-units", formatUnit(waterUnits));
    setText("billing-electricity-units", formatUnit(electricityUnits));
    setText("billing-other-units", "-");

    setText("billing-rent-rate", "-");
    setText("billing-water-rate", formatUnit(waterRate));
    setText("billing-electricity-rate", formatUnit(electricityRate));
    setText("billing-other-rate", "-");

    setText("billing-rent-amount", formatMoney(rentAmount));
    setText("billing-water-total", formatMoney(waterTotal));
    setText("billing-electricity-total", formatMoney(electricityTotal));
    setText("billing-other-total", "-");
    setText("billing-total", formatMoney(total));

    setNote(billing?.note);

    const dot = document.getElementById("billing-status-dot");
    dot?.classList.toggle("is-paid", status === "completed" || status === "เสร็จสิ้น");

    if (!billing) renderEmptyBilling(roomNumber, name);
  } catch (error) {
    if (!API.getToken()) {
      window.location.href = "/";
      return;
    }
    renderEmptyBilling("-", "-");
  }
}

function renderEmptyBilling(roomNumber, name) {
  setText("billing-tenant-code", roomNumber || "-");
  setText("billing-tenant-name", name || "-");
  setText("billing-status", "ยังไม่มีข้อมูล");
  setText("billing-due-date", "-");
  setText("billing-note-cycle", "รอบบิล -");
  setText("billing-room", roomNumber || "-");
  setText("billing-water-rate", "0");
  setText("billing-electricity-rate", "0");
  setText("billing-rent-amount", "0.00");
  setText("billing-water-total", "0.00");
  setText("billing-electricity-total", "0.00");
  setText("billing-total", "0.00");
  currentBillingTotal = 0;
  currentBillingRoom = roomNumber || "-";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setNote(note) {
  const element = document.getElementById("billing-note-text");
  if (!element) return;
  element.innerHTML = DEFAULT_BILLING_NOTE;
  const cleanNote = String(note || "").trim();
  if (cleanNote && !cleanNote.startsWith("รอบบิล")) {
    const adminNote = document.createElement("span");
    adminNote.textContent = " " + cleanNote;
    element.appendChild(document.createElement("br"));
    element.appendChild(adminNote);
  }
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

function formatBillingCycle(cycle, billing) {
  const endDate = normalizeIsoDate(cycle?.endDate || billing?.endDate || billing?.dueDate);
  const startDate = normalizeIsoDate(cycle?.startDate || billing?.startDate) || getDefaultCycleStartDate(endDate);
  if (!startDate && !endDate) return "รอบบิล -";
  if (startDate && endDate) return "รอบบิล " + startDate + " ถึง " + endDate;
  return "รอบบิล " + (startDate || endDate);
}

function normalizeIsoDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getDefaultCycleStartDate(endDate) {
  if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return "";
  const date = new Date(endDate + "T00:00:00");
  date.setDate(date.getDate() - 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function formatUnit(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(2);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function openPaymentModal() {
  const modal = document.getElementById("payment-qr-modal");
  if (!modal) return;
  buildPaymentQr();
  setText("payment-modal-amount", formatMoney(currentBillingTotal) + " บาท");
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  startPaymentCountdown();
}

function closePaymentModal() {
  const modal = document.getElementById("payment-qr-modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  stopPaymentCountdown();
}

function refreshPaymentQr() {
  const button = document.getElementById("payment-refresh-button");
  if (button) {
    button.classList.remove("is-spinning");
    void button.offsetWidth;
    button.classList.add("is-spinning");
  }
  buildPaymentQr();
  startPaymentCountdown();
}

function buildPaymentQr() {
  const image = document.getElementById("payment-qr-image");
  if (!image) return;
  image.src = createLocalPaymentQr();
}

function createLocalPaymentQr() {
  const cells = 17;
  const size = 238;
  const cell = Math.floor(size / cells);
  const seed = String(currentBillingRoom) + "|" + String(currentBillingTotal) + "|" + Date.now();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const isFinder = (x, y) => (x < 5 && y < 5) || (x > cells - 6 && y < 5) || (x < 5 && y > cells - 6);
  let rects = "";
  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      const finder = isFinder(x, y);
      const ring = finder && (x % (cells - 5) === 0 || y % (cells - 5) === 0 || x % (cells - 5) === 4 || y % (cells - 5) === 4);
      const center = finder && x % (cells - 5) >= 1 && x % (cells - 5) <= 3 && y % (cells - 5) >= 1 && y % (cells - 5) <= 3;
      const randomBit = ((hash + x * 17 + y * 29 + x * y * 7) % 5) < 2;
      if (ring || center || (!finder && randomBit)) {
        rects += `<rect x="${x * cell + 8}" y="${y * cell + 8}" width="${cell}" height="${cell}" rx="1"/>`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="#7d8153">${rects}</g></svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function startPaymentCountdown() {
  stopPaymentCountdown();
  paymentSecondsLeft = PAYMENT_QR_SECONDS;
  updatePaymentCountdown();
  paymentCountdownTimer = window.setInterval(() => {
    paymentSecondsLeft -= 1;
    updatePaymentCountdown();
    if (paymentSecondsLeft <= 0) stopPaymentCountdown();
  }, 1000);
}

function stopPaymentCountdown() {
  if (paymentCountdownTimer) {
    window.clearInterval(paymentCountdownTimer);
    paymentCountdownTimer = null;
  }
}

function updatePaymentCountdown() {
  const time = document.getElementById("payment-countdown-time");
  if (!time) return;
  const safeSeconds = Math.max(paymentSecondsLeft, 0);
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const seconds = String(safeSeconds % 60).padStart(2, "0");
  time.textContent = minutes + ":" + seconds;
}
