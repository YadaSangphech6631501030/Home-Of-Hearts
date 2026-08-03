document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     Profile Dropdown Menu System
    ============================ */

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

  /* ============================
     Edit Contact Modal System
    ============================ */

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

  openModalBtn?.addEventListener("click", () => {
    if (inputTel && displayTel)
      inputTel.value =
        displayTel.textContent === "-" ? "" : displayTel.textContent;
    if (inputEmail && displayEmail)
      inputEmail.value =
        displayEmail.textContent === "-" ? "" : displayEmail.textContent;
    if (inputFacebook && displayFacebook)
      inputFacebook.value =
        displayFacebook.textContent === "-" ? "" : displayFacebook.textContent;
    if (inputLine && displayLine)
      inputLine.value =
        displayLine.textContent === "-" ? "" : displayLine.textContent;
    if (inputAddress && displayAddress)
      inputAddress.value =
        displayAddress.textContent === "-" ? "" : displayAddress.textContent;

    modal?.classList.add("active");
  });

  const closeModal = () => {
    modal?.classList.remove("active");
  };

  closeModalBtn?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  editForm?.addEventListener("submit", (e) => {
    e.preventDefault();

    if (displayTel && inputTel)
      displayTel.textContent = inputTel.value.trim() || "-";
    if (displayEmail && inputEmail)
      displayEmail.textContent = inputEmail.value.trim() || "-";
    if (displayFacebook && inputFacebook)
      displayFacebook.textContent = inputFacebook.value.trim() || "-";
    if (displayLine && inputLine)
      displayLine.textContent = inputLine.value.trim() || "-";
    if (displayAddress && inputAddress)
      displayAddress.textContent = inputAddress.value.trim() || "-";

    closeModal();
  });

  /* ============================
     QR Code Upload Preview System
    ============================ */

  const setupQRUpload = (inputId, imgId) => {
    const fileInput = document.getElementById(inputId);
    const imgElement = document.getElementById(imgId);

    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (file && imgElement) {
        const newImgUrl = URL.createObjectURL(file);
        imgElement.src = newImgUrl;
        fileInput.value = "";
      }
    });
  };

  setupQRUpload("upload-qr-1", "qr-img-1");
  setupQRUpload("upload-qr-2", "qr-img-2");
  setupQRUpload("upload-qr-3", "qr-img-3");
});
