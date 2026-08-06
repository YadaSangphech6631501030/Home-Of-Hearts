document.addEventListener("DOMContentLoaded", () => {
  // Element selectors
  const profileTrigger = document.getElementById("profile-trigger");
  const profileMenu = document.querySelector(".profile-menu");

  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("is-open");
      const isExpanded = profileMenu.classList.contains("is-open");
      profileTrigger.setAttribute("aria-expanded", isExpanded);
    });

    document.addEventListener("click", (e) => {
      if (!profileMenu.contains(e.target)) {
        profileMenu.classList.remove("is-open");
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Edit contact modal
  const modal = document.getElementById("edit-contact-modal");
  const openModalBtn = document.getElementById("open-edit-modal");
  const closeModalBtn = document.getElementById("close-modal-btn");
  const editForm = document.getElementById("edit-contact-form");

  // Display Elements
  const displayTel = document.getElementById("display-tel");
  const displayEmail = document.getElementById("display-email");
  const displayFacebook = document.getElementById("display-facebook");
  const displayLine = document.getElementById("display-line");
  const displayAddress = document.getElementById("display-address");

  // Form Input Elements
  const inputTel = document.getElementById("input-tel");
  const inputEmail = document.getElementById("input-email");
  const inputFacebook = document.getElementById("input-facebook");
  const inputLine = document.getElementById("input-line");
  const inputAddress = document.getElementById("input-address");

  const qrImages = {
    qrMain: document.getElementById("qr-img-1"),
    qrShop: document.getElementById("qr-img-2"),
    qrOffice: document.getElementById("qr-img-3"),
  };

  // ตัวแปรเก็บค่า QR Code ปัจจุบันไว้
  let currentQRs = {
    qrMain: "",
    qrShop: "",
    qrOffice: "",
  };

  loadContactData();

  async function loadContactData() {
    try {
      const response = await API.get("/api/contact");
      applyContactData(response.data || response);
    } catch (error) {
      console.error("Error loading contact data:", error);
    }
  }

  function applyContactData(data = {}) {
    if (displayTel) displayTel.textContent = data.tel || "-";
    if (displayEmail) displayEmail.textContent = data.email || "-";
    if (displayFacebook) displayFacebook.textContent = data.facebook || "-";
    if (displayLine) displayLine.textContent = data.line || "-";
    if (displayAddress) displayAddress.textContent = data.address || "-";

    if (data.qrMain) {
      currentQRs.qrMain = data.qrMain;
      if (qrImages.qrMain) qrImages.qrMain.src = data.qrMain;
    }
    if (data.qrShop) {
      currentQRs.qrShop = data.qrShop;
      if (qrImages.qrShop) qrImages.qrShop.src = data.qrShop;
    }
    if (data.qrOffice) {
      currentQRs.qrOffice = data.qrOffice;
      if (qrImages.qrOffice) qrImages.qrOffice.src = data.qrOffice;
    }
  }

  async function saveContactData(dataPayload = {}) {
    const payload = {
      tel: inputTel?.value.trim() || (displayTel?.textContent === "-" ? "" : displayTel?.textContent) || "",
      email: inputEmail?.value.trim() || (displayEmail?.textContent === "-" ? "" : displayEmail?.textContent) || "",
      facebook: inputFacebook?.value.trim() || (displayFacebook?.textContent === "-" ? "" : displayFacebook?.textContent) || "",
      line: inputLine?.value.trim() || (displayLine?.textContent === "-" ? "" : displayLine?.textContent) || "",
      address: inputAddress?.value.trim() || (displayAddress?.textContent === "-" ? "" : displayAddress?.textContent) || "",
      ...currentQRs,
      ...dataPayload,
    };

    const response = await API.put("/api/contact", payload);
    applyContactData(response.data || response);
  }

  openModalBtn?.addEventListener("click", () => {
    if (inputTel && displayTel)
      inputTel.value = displayTel.textContent === "-" ? "" : displayTel.textContent;
    if (inputEmail && displayEmail)
      inputEmail.value = displayEmail.textContent === "-" ? "" : displayEmail.textContent;
    if (inputFacebook && displayFacebook)
      inputFacebook.value = displayFacebook.textContent === "-" ? "" : displayFacebook.textContent;
    if (inputLine && displayLine)
      inputLine.value = displayLine.textContent === "-" ? "" : displayLine.textContent;
    if (inputAddress && displayAddress)
      inputAddress.value = displayAddress.textContent === "-" ? "" : displayAddress.textContent;

    modal?.classList.add("active");
  });

  const closeModal = () => {
    modal?.classList.remove("active");
  };

  closeModalBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // บันทึกข้อมูลเมื่อกดปุ่มใน Modal
  editForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const newContactData = {
        tel: inputTel?.value.trim() || "-",
        email: inputEmail?.value.trim() || "-",
        facebook: inputFacebook?.value.trim() || "-",
        line: inputLine?.value.trim() || "-",
        address: inputAddress?.value.trim() || "-",
      };

      await saveContactData(newContactData);
      closeModal();
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลติดต่อ (อาจต้องล็อกอิน Admin ใหม่อีกครั้ง)");
    }
  });

  // Qr code upload
  const setupQRUpload = (inputId, imgId, payloadKey) => {
    const fileInput = document.getElementById(inputId);
    const imgElement = document.getElementById(imgId);

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file || !imgElement) return;

      const reader = new FileReader();
      reader.addEventListener("load", async () => {
        const newImgUrl = reader.result;
        imgElement.src = newImgUrl;
        fileInput.value = "";

        try {
          await saveContactData({ [payloadKey]: newImgUrl });
        } catch (error) {
          alert(error.message || "เกิดข้อผิดพลาดในการบันทึก QR Code");
        }
      });
      reader.readAsDataURL(file);
    });
  };

  const logoutButton = document.getElementById("logout-button");
  logoutButton?.addEventListener("click", () => {
    if (typeof API !== "undefined" && typeof API.logout === "function") {
      API.logout();
    } else {
      localStorage.removeItem("token");
      sessionStorage.clear();
      window.location.href = "/";
    }
  });

  setupQRUpload("upload-qr-1", "qr-img-1", "qrMain");
  setupQRUpload("upload-qr-2", "qr-img-2", "qrShop");
  setupQRUpload("upload-qr-3", "qr-img-3", "qrOffice");
});