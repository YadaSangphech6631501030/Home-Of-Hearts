document.addEventListener("DOMContentLoaded", () => {
  // Elements User
  const userTel = document.getElementById("contact-tel");
  const userEmail = document.getElementById("contact-email");
  const userFacebook = document.getElementById("contact-facebook");
  const userLine = document.getElementById("contact-line");
  const userAddress = document.getElementById("contact-address");
  const userQrImg = document.getElementById("contact-qr-img");
  const userLineSubtext = document.getElementById("contact-line-subtext");

  const DEFAULT_QR = "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=LineHormpak&color=7d8153";

  fetchContactData();

  async function fetchContactData() {
    try {
      const res = await fetch("/api/contact");
      if (res.ok) {
        const response = await res.json();
        const data = response.data || response;
        renderUserData(data);
      }
    } catch (err) {
      console.error("Failed to fetch contact info:", err);
      if (userQrImg) userQrImg.src = DEFAULT_QR;
    }
  }

  function renderUserData(data) {
    if (userTel) userTel.textContent = data.tel || "-";
    if (userEmail) userEmail.textContent = data.email || "-";
    if (userFacebook) userFacebook.textContent = data.facebook || "-";
    if (userLine) userLine.textContent = data.line || "-";
    if (userAddress) userAddress.textContent = data.address || "-";
    
    if (userLineSubtext) {
      userLineSubtext.textContent = "สแกนเพิ่มเพื่อน หรือ @1234";
    }

    if (userQrImg) {
      userQrImg.src = (data.qrMain && data.qrMain.trim() !== "") ? data.qrMain : DEFAULT_QR;
      userQrImg.style.display = "block";
    }
  }
});