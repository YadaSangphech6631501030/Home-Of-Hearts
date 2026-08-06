let billingData = [];

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// fetch billing from api
async function fetchBillingData() {
  try {
    const response = await fetch("/api/billings", { headers: API.getHeaders() });
    const data = await response.json();
    billingData = Array.isArray(data) ? data : [];

    const tableBody = document.getElementById("billing-tbody");
    const updateDateEl = document.getElementById("last-update-date");

    if (updateDateEl) {
      if (data && data.length > 0) {
        const latestItem = data.reduce(
          (max, item) =>
            new Date(item.updatedAt || item.createdAt) >
            new Date(max.updatedAt || max.createdAt)
              ? item
              : max,
          data[0]
        );

        updateDateEl.textContent = formatDate(
          latestItem.updatedAt || latestItem.createdAt
        );
      } else {
        updateDateEl.textContent = formatDate(new Date());
      }
    }

    if (!tableBody) return;

    if (!billingData || billingData.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state-cell" style="padding: 40px; color: #888;">
            ไม่พบข้อมูลรายการเงินหอพัก
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = billingData
      .map(
        (item) => `
      <tr>
        <td>${formatDate(item.createdAt)}</td>
        <td>${item.roomNumber || "-"}</td>
        <td>${item.tenantName || "-"}</td>
        <td>${item.amount ? item.amount.toLocaleString() : "0"}</td>
        <td>${formatDate(item.dueDate)}</td>
        <td>
          <span class="status-cell">
            <span class="status-dot ${item.status === "completed" ? "dot--completed" : "dot--progress"}"></span>
            ${item.status === "completed" ? "เสร็จสิ้น" : "รอดำเนินการ"}
          </span>
        </td>
        <td>${item.completedDate ? formatDate(item.completedDate) : "-"}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-action view-image-btn" type="button" title="ดูรายละเอียด" aria-label="ดูรายละเอียด" data-id="${item._id}">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="btn-action edit-btn" type="button" title="แก้ไข" aria-label="แก้ไข" data-id="${item._id}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
              </svg>
            </button>
            <button class="btn-action delete-btn" type="button" title="ลบ" aria-label="ลบ" data-id="${item._id}">
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
  } catch (error) {
    console.warn("⚠️ ไม่พบข้อมูล API:", error);
    const tableBody = document.getElementById("billing-tbody");
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state-cell" style="padding: 40px; color: #888;">
            ไม่พบข้อมูลรายการเงินหอพัก
          </td>
        </tr>
      `;
    }
  }
}

// Event listeners and modal handling
document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("btn-create-cycle");
  const modal = document.getElementById("create-batch-modal");
  const cancelBtn = document.getElementById("cancel-batch-modal");
  const submitBtn = document.getElementById("submit-batch-modal");
  const openBillBtn = document.getElementById("btn-create-bill");
  const billModal = document.getElementById("create-single-bill-modal");
  const cancelBillBtn = document.getElementById("cancel-single-bill-modal");
  const submitBillBtn = document.getElementById("submit-single-bill-modal");
  const billCycleSelect = document.getElementById("single-bill-cycle");
  const billRoomSelect = document.getElementById("single-bill-room");
  const billRentInput = document.getElementById("single-bill-rent");
  const billWaterRateInput = document.getElementById("single-bill-water-rate");
  const billWaterUnitsInput = document.getElementById("single-bill-water-units");
  const billWaterTotalInput = document.getElementById("single-bill-water-total");
  const billElectricityRateInput = document.getElementById("single-bill-electricity-rate");
  const billElectricityUnitsInput = document.getElementById("single-bill-electricity-units");
  const billElectricityTotalInput = document.getElementById("single-bill-electricity-total");
  const billTotalDisplay = document.getElementById("single-bill-total-display");
  const billNoteInput = document.getElementById("single-bill-note");
  const billMessage = document.getElementById("single-bill-message");
  const detailModal = document.getElementById("bill-detail-modal");
  const detailClose = document.getElementById("bill-detail-close");
  const deleteModal = document.getElementById("bill-delete-modal");
  const deleteClose = document.getElementById("bill-delete-close");
  const cancelDeleteBtn = document.getElementById("cancel-delete-bill");
  const confirmDeleteBtn = document.getElementById("confirm-delete-bill");
  const deleteMessage = document.getElementById("bill-delete-message");
  let billingCycles = [];
  let editingBillId = null;
  let deletingBillId = null;

  const closeModal = () => modal?.classList.remove("active");
  const closeBillModal = () => billModal?.classList.remove("active");
  const closeDetailModal = () => detailModal?.classList.remove("active");
  const closeDeleteModal = () => {
    deleteModal?.classList.remove("active");
    deletingBillId = null;
    if (deleteMessage) deleteMessage.textContent = "";
  };


  async function loadBillingCycles() {
    const response = await fetch("/api/billing-cycles", { headers: API.getHeaders() });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || result.error || "ไม่สามารถดึงข้อมูลรอบบิลได้");
    }

    billingCycles = Array.isArray(result.data) ? result.data : [];
    if (billCycleSelect) {
      billCycleSelect.innerHTML = '<option value="">เลือกรอบบิล</option>' + billingCycles.map((cycle) => (
        '<option value="' + cycle._id + '">' + formatDate(cycle.startDate) + ' - ' + formatDate(cycle.endDate) + '</option>'
      )).join("");
    }
  }

  async function loadOccupiedRooms() {
    const response = await fetch("/api/rooms", { headers: API.getHeaders() });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || result.error || "ไม่สามารถดึงข้อมูลห้องได้");
    }

    const rooms = Array.isArray(result.data) ? result.data : (Array.isArray(result.rooms) ? result.rooms : []);
    const occupiedRooms = rooms.filter((room) => room.status === "occupied" || (room.tenant && room.tenant.fullName));
    if (billRoomSelect) {
      billRoomSelect.innerHTML = '<option value="">เลือกห้อง</option>' + occupiedRooms.map((room) => (
        '<option value="' + room.roomNumber + '">ห้อง ' + room.roomNumber + ' - ' + ((room.tenant && room.tenant.fullName) || '-') + '</option>'
      )).join("");
    }
  }

  function parseMoney(value) {
    const number = Number(String(value || "0").replace(/,/g, "").trim());
    return Number.isFinite(number) ? number : 0;
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString();
  }

  function calculateSingleBillTotal() {
    const rent = parseMoney(billRentInput?.value);
    const waterRate = parseMoney(billWaterRateInput?.value);
    const waterUnits = parseMoney(billWaterUnitsInput?.value);
    const electricityRate = parseMoney(billElectricityRateInput?.value);
    const electricityUnits = parseMoney(billElectricityUnitsInput?.value);
    const waterTotal = waterRate * waterUnits;
    const electricityTotal = electricityRate * electricityUnits;
    const total = rent + waterTotal + electricityTotal;

    if (billWaterTotalInput) billWaterTotalInput.value = formatMoney(waterTotal);
    if (billElectricityTotalInput) billElectricityTotalInput.value = formatMoney(electricityTotal);
    if (billTotalDisplay) billTotalDisplay.textContent = formatMoney(total);
    return { rent, waterRate, waterUnits, waterTotal, electricityRate, electricityUnits, electricityTotal, total };
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function openDeleteBillModal(bill) {
    deletingBillId = bill._id;
    setText("delete-room", bill.roomNumber || "-");
    setText("delete-tenant", bill.tenantName || "-");
    setText("delete-total", formatMoney(bill.amount || 0));
    if (deleteMessage) deleteMessage.textContent = "";
    deleteModal?.classList.add("active");
  }

  // Open bill detail modal
  function openBillDetailModal(bill) {
    setText("detail-room", bill.roomNumber || "-");
    setText("detail-tenant", bill.tenantName || "-");
    setText("detail-due-date", formatDate(bill.dueDate));
    setText("detail-status", bill.status === "completed" ? "เสร็จสิ้น" : "รอดำเนินการ");
    setText("detail-rent", formatMoney(bill.rentAmount || 0));
    setText("detail-water-rate", formatMoney(bill.waterRate || 0));
    setText("detail-water-units", formatMoney(bill.waterUnits || 0));
    setText("detail-water-total", formatMoney(bill.waterTotal || 0));
    setText("detail-electricity-rate", formatMoney(bill.electricityRate || 0));
    setText("detail-electricity-units", formatMoney(bill.electricityUnits || 0));
    setText("detail-electricity-total", formatMoney(bill.electricityTotal || 0));
    setText("detail-total", formatMoney(bill.amount || 0));
    setText("detail-note", bill.note || "-");
    detailModal?.classList.add("active");
  }

  function fillAmountFromCycle() {
    if (!billCycleSelect) return;
    const cycle = billingCycles.find((item) => String(item._id) === String(billCycleSelect.value));
    if (!cycle) return;
    if (billRentInput) billRentInput.value = formatMoney(cycle.rentAmount || 0);
    if (billWaterRateInput) billWaterRateInput.value = formatMoney(cycle.waterRate || 0);
    if (billElectricityRateInput) billElectricityRateInput.value = formatMoney(cycle.electricityRate || 0);
    calculateSingleBillTotal();
  }

  // open Pop-up
  if (openBtn && modal) {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("active");
    });
  }

  // close Pop-up
  cancelBtn?.addEventListener("click", closeModal);
  cancelBillBtn?.addEventListener("click", closeBillModal);
  detailClose?.addEventListener("click", closeDetailModal);
  deleteClose?.addEventListener("click", closeDeleteModal);
  cancelDeleteBtn?.addEventListener("click", closeDeleteModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  if (billModal) {
    billModal.addEventListener("click", (e) => {
      if (e.target === billModal) closeBillModal();
    });
  }

  if (detailModal) {
    detailModal.addEventListener("click", (e) => {
      if (e.target === detailModal) closeDetailModal();
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  billCycleSelect?.addEventListener("change", fillAmountFromCycle);
  [billRentInput, billWaterRateInput, billWaterUnitsInput, billElectricityRateInput, billElectricityUnitsInput].forEach((input) => {
    input?.addEventListener("input", calculateSingleBillTotal);
  });

  openBillBtn?.addEventListener("click", async () => {
    try {
      if (billMessage) {
        billMessage.textContent = "";
        billMessage.classList.remove("is-success");
      }
      await Promise.all([loadBillingCycles(), loadOccupiedRooms()]);
      if (!billingCycles.length) {
        alert("กรุณาสร้างรอบบิลก่อนสร้างบิลรายห้อง");
        return;
      }
      editingBillId = null;
      if (billCycleSelect && !billCycleSelect.value) {
        billCycleSelect.value = billingCycles[0]._id;
      }
      if (billWaterUnitsInput) billWaterUnitsInput.value = "";
      if (billElectricityUnitsInput) billElectricityUnitsInput.value = "";
      if (billNoteInput) billNoteInput.value = "";
      fillAmountFromCycle();
      billModal?.classList.add("active");
    } catch (error) {
      alert(error.message || "ไม่สามารถเปิดหน้าสร้างบิลได้");
    }
  });

  // Handle click events on billing table
  document.getElementById("billing-tbody")?.addEventListener("click", async (event) => {
    const button = event.target.closest(".btn-action");
    if (!button) return;

    const id = button.dataset.id;
    const bill = billingData.find((item) => String(item._id) === String(id));
    if (!bill) return;

    if (button.classList.contains("view-image-btn")) {
      openBillDetailModal(bill);
      return;
    }

    if (button.classList.contains("edit-btn")) {
      try {
        editingBillId = id;
        await Promise.all([loadBillingCycles(), loadOccupiedRooms()]);
        if (billRoomSelect) billRoomSelect.value = bill.roomNumber || "";
        const cycle = billingCycles.find((item) => item.endDate === bill.dueDate);
        if (billCycleSelect) billCycleSelect.value = cycle ? cycle._id : "";
        if (billRentInput) billRentInput.value = formatMoney(bill.rentAmount || bill.amount || 0);
        if (billWaterRateInput) billWaterRateInput.value = formatMoney(bill.waterRate || 0);
        if (billWaterUnitsInput) billWaterUnitsInput.value = bill.waterUnits || "";
        if (billElectricityRateInput) billElectricityRateInput.value = formatMoney(bill.electricityRate || 0);
        if (billElectricityUnitsInput) billElectricityUnitsInput.value = bill.electricityUnits || "";
        if (billNoteInput) billNoteInput.value = bill.note || "";
        calculateSingleBillTotal();
        if (billMessage) {
          billMessage.textContent = "";
          billMessage.classList.remove("is-success");
        }
        billModal?.classList.add("active");
      } catch (error) {
        alert(error.message || "ไม่สามารถเปิดข้อมูลบิลได้");
      }
      return;
    }

    if (button.classList.contains("delete-btn")) {
      openDeleteBillModal(bill);
    }
  });

  confirmDeleteBtn?.addEventListener("click", async () => {
    if (!deletingBillId) return;

    try {
      const response = await fetch("/api/billings/" + deletingBillId, {
        method: "DELETE",
        headers: API.getHeaders(),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || result.error || "ไม่สามารถลบบิลได้");
      closeDeleteModal();
      fetchBillingData();
    } catch (error) {
      if (deleteMessage) deleteMessage.textContent = error.message || "ไม่สามารถลบบิลได้";
    }
  });

  // Handle click events on expense edit buttons
  document.querySelectorAll(".btn-edit-expense").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const input = e.currentTarget.parentElement.querySelector("input");
      if (input) {
        input.focus();
        input.select();
      }
    });
  });

  if (submitBtn && modal) {
    submitBtn.addEventListener("click", async () => {
      const dateFrom = document.getElementById("batch-date-from")?.value;
      const dateTo = document.getElementById("batch-date-to")?.value;
      const targetRooms = document.querySelector('input[name="target-rooms"]:checked')?.value;
      const rentAmount = document.getElementById("rent-amount")?.value;
      const waterRate = document.getElementById("water-rate")?.value;
      const electricityRate = document.getElementById("electricity-rate")?.value;

      if (!dateFrom || !dateTo) {
        alert("กรุณาเลือกช่วงวันที่ให้ครบถ้วน");
        return;
      }

      try {
        const response = await fetch("/api/billings/batch", {
          method: "POST",
          headers: API.getHeaders(),
          body: JSON.stringify({
            startDate: dateFrom,
            endDate: dateTo,
            targetRooms: targetRooms,
            rentAmount: rentAmount,
            waterRate: waterRate,
            electricityRate: electricityRate,
          }),
        });

        if (response.ok) {
          alert("สร้างรอบบิลเรียบร้อยแล้ว!");
          closeModal();
          loadBillingCycles().catch(() => {});
          fetchBillingData();
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.message || errorData.error || "ไม่สามารถสร้างรอบบิลได้");
        }
      } catch (err) {
        console.error("Error creating batch:", err);
        alert("การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
      }
    });
  }

  submitBillBtn?.addEventListener("click", async () => {
    const cycleId = billCycleSelect?.value || "";
    const roomNumber = billRoomSelect?.value || "";
    const expenseSummary = calculateSingleBillTotal();
    const note = billNoteInput?.value || "";

    if (!editingBillId && (!cycleId || !roomNumber)) {
      if (billMessage) billMessage.textContent = "กรุณาเลือกรอบบิลและห้องให้ครบถ้วน";
      return;
    }

    try {
      const response = await fetch(editingBillId ? "/api/billings/" + editingBillId : "/api/billings", {
        method: editingBillId ? "PUT" : "POST",
        headers: API.getHeaders(),
        body: JSON.stringify({
          cycleId,
          roomNumber,
          amount: expenseSummary.total,
          rentAmount: expenseSummary.rent,
          waterRate: expenseSummary.waterRate,
          waterUnits: expenseSummary.waterUnits,
          waterTotal: expenseSummary.waterTotal,
          electricityRate: expenseSummary.electricityRate,
          electricityUnits: expenseSummary.electricityUnits,
          electricityTotal: expenseSummary.electricityTotal,
          note,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || result.error || "ไม่สามารถสร้างบิลได้");
      }

      if (billMessage) {
        billMessage.textContent = editingBillId ? "แก้ไขบิลเรียบร้อยแล้ว" : "สร้างบิลเรียบร้อยแล้ว";
        billMessage.classList.add("is-success");
      }
      fetchBillingData();
      editingBillId = null;
      setTimeout(closeBillModal, 500);
    } catch (error) {
      if (billMessage) {
        billMessage.textContent = error.message || "ไม่สามารถสร้างบิลได้";
        billMessage.classList.remove("is-success");
      }
    }
  });

  fetchBillingData();
});