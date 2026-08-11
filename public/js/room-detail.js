document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const roomNumber = params.get("roomNumber") || params.get("room") || "101";

  // UI Elements
  const roomDetailTitle = document.getElementById("room-detail-title");
  const tenantName = document.getElementById("tenant-name");
  const tenantPhone = document.getElementById("tenant-phone");
  const tenantEmail = document.getElementById("tenant-email");
  const tenantMoveIn = document.getElementById("tenant-move-in");
  const tenantContractEnd = document.getElementById("tenant-contract-end");
  const tenantAvatarInitials = document.getElementById("tenant-avatar-initials");
  const roomStatusBadge = document.getElementById("room-status");
  const maintenanceTotal = document.getElementById("maintenance-total");
  const maintenancePending = document.getElementById("maintenance-pending");
  const billingPeriod = document.getElementById("billing-period");
  const billingOverdue = document.getElementById("billing-overdue");
  const billingStatus = document.getElementById("billing-status");
  const parcelTotal = document.getElementById("parcel-total");
  const parcelPending = document.getElementById("parcel-pending");
  const tenantHistory = document.getElementById("tenant-history");

  // Modal Elements
  const tenantModal = document.getElementById("tenant-modal");
  const btnAddTenant = document.getElementById("btn-add-tenant");
  const btnEditTenant = document.getElementById("btn-edit-tenant");
  const modalClose = document.getElementById("modal-close");
  const modalBtnCancel = document.getElementById("modal-btn-cancel");
  const modalTenantForm = document.getElementById("modal-tenant-form");

  const modalName = document.getElementById("modal-tenant-name");
  const modalPhone = document.getElementById("modal-tenant-phone");
  const modalEmail = document.getElementById("modal-tenant-email");
  const modalMoveIn = document.getElementById("modal-move-in");
  const modalContractEnd = document.getElementById("modal-contract-end");

  //updates web
  if (roomDetailTitle) {
    roomDetailTitle.textContent = `ข้อมูลผู้เช่า ห้อง ${roomNumber}`;
  }


  async function fetchRoomDetail() {
    try {
      const [response, overviewPayload] = await Promise.all([
        fetch(`/api/rooms/${roomNumber}`),
        window.API ? API.get(`/api/rooms/${roomNumber}/overview`).catch((error) => {
          console.error("Error fetching room overview:", error);
          return null;
        }) : null,
      ]);
      if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลห้องได้");
      
      const room = await response.json();
      renderRoomDetail(room);

      if (overviewPayload) {
        renderRoomOverview(overviewPayload.data || overviewPayload);
      }
    } catch (err) {
      console.error("Error fetching room detail:", err);
    }
  }

  function renderRoomDetail(room) {

    const tenant = room.tenant || {};
    
    const fullName = (tenant.fullName || "").trim() || "-";
    const phone = tenant.phone || "-";
    const email = tenant.email || "-";
    const moveIn = tenant.moveInDate || tenant.startDate;
    const contractEnd = tenant.contractEndDate || tenant.endDate;

    if (tenantName) tenantName.textContent = fullName;
    if (tenantPhone) tenantPhone.textContent = phone;
    if (tenantEmail) tenantEmail.textContent = email;
    if (tenantMoveIn) tenantMoveIn.textContent = formatDateForDisplay(moveIn);
    if (tenantContractEnd) tenantContractEnd.textContent = formatDateForDisplay(contractEnd);

    // avatar profile
    if (tenantAvatarInitials) {
      tenantAvatarInitials.textContent = (fullName !== "-") ? fullName.charAt(0) : "ส";
    }

    //status rooms
    if (roomStatusBadge) {
      const statusMap = {
        available: "สถานะ : ว่าง 🟢",
        occupied: "สถานะ : ไม่ว่าง 🔴",
        maintenance: "สถานะ : ปรับปรุง 🟡"
      };
      roomStatusBadge.textContent = statusMap[room.status] || room.status;
    }

    if (modalName) modalName.value = fullName !== "-" ? fullName : "";
    if (modalPhone) modalPhone.value = phone !== "-" ? phone : "";
    if (modalEmail) modalEmail.value = email !== "-" ? email : "";
    if (modalMoveIn) modalMoveIn.value = formatDateForInput(moveIn);
    if (modalContractEnd) modalContractEnd.value = formatDateForInput(contractEnd);
  }

  function renderRoomOverview(data) {
    if (!data) return;

    const maintenance = data.maintenance || {};
    const billing = data.billing || {};
    const parcels = data.parcels || {};

    if (maintenanceTotal) maintenanceTotal.textContent = `${maintenance.total || 0} ครั้ง`;
    if (maintenancePending) maintenancePending.textContent = `${maintenance.pending || 0} ครั้ง`;

    if (billingPeriod) billingPeriod.textContent = billing.period || "-";
    if (billingOverdue) billingOverdue.textContent = `${billing.overdueDays || 0} วัน`;
    if (billingStatus) billingStatus.textContent = billing.statusText || "-";

    if (parcelTotal) parcelTotal.textContent = `${parcels.total || 0} ครั้ง`;
    if (parcelPending) parcelPending.textContent = `${parcels.pending || 0} ครั้ง`;

    renderTenantHistory(data.tenantHistory || []);
  }

  function renderTenantHistory(history) {
    if (!tenantHistory) return;

    if (!history.length) {
      tenantHistory.innerHTML = '<p class="tenant-history-empty">ยังไม่มีประวัติผู้เช่า</p>';
      return;
    }

    tenantHistory.innerHTML = history.map((item) => `
      <div class="history-item">
        <div class="history-year">ปี ${item.year || "-"}</div>
        <div class="history-details">
          <p>ชื่อ : ${item.name || "-"}</p>
          <p>สัญญาผู้เช่า : ${item.period || "-"}</p>
          <p>สถานะ : ${item.status || "-"}</p>
        </div>
      </div>
    `).join("");
  }

  function formatDateForDisplay(dateStr) {
    if (!dateStr || dateStr === "-") return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatDateForInput(dateStr) {
    if (!dateStr || dateStr === "-") return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }
  function openModal() {
    if (tenantModal) {
      tenantModal.classList.add("is-open");
      tenantModal.setAttribute("aria-hidden", "false");
    }
  }

  function closeModal() {
    if (tenantModal) {
      tenantModal.classList.remove("is-open");
      tenantModal.setAttribute("aria-hidden", "true");
    }
  }

  if (btnAddTenant) {
    btnAddTenant.addEventListener("click", () => {
      window.location.href = `/admin/create-tenant.html?room=${encodeURIComponent(roomNumber)}`;
    });
  }

  if (btnEditTenant) btnEditTenant.addEventListener("click", openModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalBtnCancel) modalBtnCancel.addEventListener("click", closeModal);

  if (modalTenantForm) {
    modalTenantForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updatedTenant = {
        fullName: modalName.value,
        phone: modalPhone.value,
        email: modalEmail.value,
        startDate: modalMoveIn.value || "",
        endDate: modalContractEnd.value || "",
      };

      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomNumber)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenant: updatedTenant }),
        });

        if (response.ok) {
          closeModal();
          fetchRoomDetail(); 
        } else {
          alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } catch (err) {
        console.error("Error updating tenant:", err);
      }
    });
  }

  fetchRoomDetail();
});
