document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("repair-modal");
  const closeButton = document.getElementById("repair-modal-close");
  const form = document.getElementById("repair-form");
  const title = document.getElementById("repair-title");
  const description = document.getElementById("repair-description");
  const imageInput = document.getElementById("repair-image");
  const imageButton = document.getElementById("repair-image-button");
  const fileName = document.getElementById("repair-file-name");
  const message = document.getElementById("repair-message");
  const modalTitle = document.getElementById("repair-modal-title");
  const senderName = document.getElementById("repair-sender-name");
  const repairDate = document.getElementById("repair-date");
  const repairRoom = document.getElementById("repair-room");
  const contactTel = document.getElementById("repair-contact-tel");

  let selectedType = "";
  let currentUser = API.getUser();
  let imageDataUrl = "";

  applyUser(currentUser);
  loadUser();
  loadContact();

  document.querySelectorAll(".repair-card").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.type || "แจ้งซ่อม"));
  });

  closeButton?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  imageButton?.addEventListener("click", () => imageInput?.click());
  imageInput?.addEventListener("change", () => {
    const file = imageInput.files && imageInput.files[0];
    imageDataUrl = "";
    if (!file) {
      if (fileName) fileName.textContent = "";
      return;
    }

    if (fileName) fileName.textContent = file.name;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      imageDataUrl = reader.result || "";
    });
    reader.readAsDataURL(file);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const payload = {
      type: selectedType,
      title: title.value.trim(),
      description: description.value.trim(),
      imageUrl: imageDataUrl,
    };

    if (!payload.title || !payload.description) {
      setMessage("กรุณากรอกหัวข้อและรายละเอียด");
      return;
    }

    try {
      await API.post("/api/maintenance", payload);
      setMessage("ส่งแจ้งซ่อมเรียบร้อยแล้ว", true);
      window.setTimeout(closeModal, 700);
    } catch (error) {
      setMessage(error.message || "เกิดข้อผิดพลาดในการส่งแจ้งซ่อม");
    }
  });

  async function loadUser() {
    try {
      const response = await API.get("/api/me");
      currentUser = { ...currentUser, ...(response.data || response) };
      applyUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  async function loadContact() {
    try {
      const response = await fetch("/api/contact");
      const result = await response.json();
      const data = result.data || result;
      if (contactTel) contactTel.textContent = data.tel || "-";
    } catch (error) {
      if (contactTel) contactTel.textContent = "-";
    }
  }

  function openModal(type) {
    selectedType = type;
    if (modalTitle) modalTitle.textContent = "แจ้งซ่อม " + type + getTypeIcon(type);
    if (repairDate) repairDate.textContent = formatDate(new Date());
    applyUser(currentUser);
    form?.reset();
    imageDataUrl = "";
    if (fileName) fileName.textContent = "";
    setMessage("");
    modal?.classList.add("is-open");
    modal?.setAttribute("aria-hidden", "false");
    title?.focus();
  }

  function closeModal() {
    modal?.classList.remove("is-open");
    modal?.setAttribute("aria-hidden", "true");
  }

  function applyUser(user = {}) {
    if (senderName) senderName.textContent = user.name || "ผู้เช่า";
    if (repairRoom) repairRoom.textContent = user.roomNumber || user.room || "-";
  }

  function setMessage(text, isSuccess = false) {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle("is-success", isSuccess);
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return day + "/" + month + "/" + year;
  }

  function getTypeIcon(type) {
    if (type.includes("ประปา")) return " 💧";
    if (type.includes("ไฟ")) return " 💡";
    if (type.includes("แอร์")) return " 💨";
    if (type.includes("กุญแจ")) return " 🔑";
    if (type.includes("wifi")) return " 📶";
    return " 🔨";
  }
});
