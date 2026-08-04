(function () {
  const params = new URLSearchParams(window.location.search);
  const roomNumber = params.get("room") || params.get("roomNumber") || "";

  const form = document.getElementById("tenant-create-form");
  const message = document.getElementById("tenant-message");
  const roomInput = document.getElementById("tenant-room");
  const backButton = document.getElementById("create-back-button");

  const eyeOpenPath = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  `;

  const eyeClosedPath = `
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  `;

  roomInput.value = roomNumber;
  backButton.href = roomNumber ? `/admin/room-detail.html?room=${encodeURIComponent(roomNumber)}` : "/admin/dormitory.html";

  document.querySelectorAll(".tenant-eye-button").forEach((button) => {
    const icon = button.querySelector("svg");
    if (icon) icon.innerHTML = eyeOpenPath;

    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;

      const isPassword = input.getAttribute("type") === "password";
      input.setAttribute("type", isPassword ? "text" : "password");

      if (icon) {
        icon.innerHTML = isPassword ? eyeClosedPath : eyeOpenPath;
      }

      button.setAttribute("aria-label", isPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
    });
  });

  function setMessage(text, isSuccess = false) {
    message.textContent = text;
    message.classList.toggle("is-success", isSuccess);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("");

    const payload = {
      name: document.getElementById("tenant-name").value.trim(),
      email: document.getElementById("tenant-email").value.trim(),
      phone: document.getElementById("tenant-phone").value.trim(),
      password: document.getElementById("tenant-password").value,
      confirmPassword: document.getElementById("tenant-confirm-password").value,
    };

    if (!roomNumber) {
      setMessage("ไม่พบเลขห้อง กรุณากลับไปเลือกห้องอีกครั้ง");
      return;
    }

    if (!payload.name || !payload.email || !payload.phone || !payload.password || !payload.confirmPassword || !roomInput.value.trim()) {
      setMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (payload.password.length < 8) {
      setMessage("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      setMessage("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      await API.post(`/api/rooms/${encodeURIComponent(roomNumber)}/tenant-account`, payload);
      setMessage("สมัครบัญชีสำเร็จ", true);
      window.setTimeout(() => {
        window.location.href = `/admin/room-detail.html?room=${encodeURIComponent(roomNumber)}`;
      }, 650);
    } catch (error) {
      setMessage(error.message || "เกิดข้อผิดพลาดในการสมัครบัญชี");
    }
  });
})();
