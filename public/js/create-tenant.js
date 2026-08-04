(function () {
  const params = new URLSearchParams(window.location.search);
  const roomNumber = params.get("room") || params.get("roomNumber") || "";

  const form = document.getElementById("tenant-create-form");
  const message = document.getElementById("tenant-message");
  const roomInput = document.getElementById("tenant-room");
  const backButton = document.getElementById("create-back-button");

  roomInput.value = roomNumber;
  backButton.href = roomNumber ? `/admin/room-detail.html?room=${encodeURIComponent(roomNumber)}` : "/admin/dormitory.html";

  document.querySelectorAll(".tenant-eye-button").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
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
      password: document.getElementById("tenant-password").value,
      confirmPassword: document.getElementById("tenant-confirm-password").value,
    };

    if (!roomNumber) {
      setMessage("ไม่พบเลขห้อง กรุณากลับไปเลือกห้องอีกครั้ง");
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
