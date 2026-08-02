function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

async function fetchBillingData() {
  try {
    const response = await fetch("/api/billings");
    const data = await response.json();

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

    if (!data || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-state-cell" style="padding: 40px; color: #888;">
            ไม่พบข้อมูลรายการเงินหอพัก
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = data
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
        <td><button class="btn-edit-row" title="แก้ไข">✏️</button></td>
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

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("btn-create-cycle");
  const modal = document.getElementById("create-batch-modal");
  const cancelBtn = document.getElementById("cancel-batch-modal");
  const submitBtn = document.getElementById("submit-batch-modal");

  const closeModal = () => modal?.classList.remove("active");

  // open Pop-up
  if (openBtn && modal) {
    openBtn.addEventListener("click", (e) => {
      e.preventDefault();
      modal.classList.add("active");
    });
  }

  // close Pop-up
  cancelBtn?.addEventListener("click", closeModal);

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

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
          headers: { "Content-Type": "application/json" },
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
          fetchBillingData();
        } else {
          alert("ไม่สามารถสร้างรอบบิลได้");
        }
      } catch (err) {
        console.error("Error creating batch:", err);
        alert("การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
      }
    });
  }

  fetchBillingData();
});