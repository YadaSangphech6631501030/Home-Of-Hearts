document.addEventListener("DOMContentLoaded", () => {
  // Elements User
  const userTel = document.getElementById("contact-tel");
  const userEmail = document.getElementById("contact-email");
  const userFacebook = document.getElementById("contact-facebook");
  const userLine = document.getElementById("contact-line");
  const userAddress = document.getElementById("contact-address");
  const userQrImg = document.getElementById("contact-qr-img");

  fetchContactData();

  async function fetchContactData() {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const response = await res.json();
        const data = response.data || response;
        renderUserData(data);
        return;
      }
    } catch (err) {
      console.log("Fetching from local storage fallback...");
    }

    // get localStorage of Admin
    const localData = JSON.parse(localStorage.getItem("contact_info"));
    if (localData) {
      renderUserData(localData);
    }

    const savedQR = localStorage.getItem("qr_code_main");
    if (savedQR && userQrImg) {
      userQrImg.src = savedQR;
    }
  }

  function renderUserData(data) {
    if (userTel) userTel.textContent = data.tel || "-";
    if (userEmail) userEmail.textContent = data.email || "-";
    if (userFacebook) userFacebook.textContent = data.facebook || "-";
    if (userLine) userLine.textContent = data.line || "-";
    if (userAddress) userAddress.textContent = data.address || "-";
    if (userQrImg && data.qrMain) userQrImg.src = data.qrMain;
  }
});