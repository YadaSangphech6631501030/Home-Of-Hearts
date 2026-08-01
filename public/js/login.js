document.addEventListener('DOMContentLoaded', () => {

  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const eyeOpenPath = `
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  `;

  const eyeClosedPath = `
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  `;

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';

      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

      if (eyeIcon) {
        eyeIcon.innerHTML = isPassword ? eyeClosedPath : eyeOpenPath;
      }

      toggleBtn.setAttribute('aria-label', isPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน');
    });
  }

  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-error');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (msg) msg.textContent = '';

      if (window.location.protocol === 'file:') {
        if (msg) msg.textContent = 'เปิดหน้านี้จาก http://localhost:3000/ เท่านั้น ไม่สามารถใช้ไฟล์โดยตรงได้';
        return;
      }

      const username = document.getElementById('username').value.trim();
      const password = passwordInput ? passwordInput.value : '';

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email: username, password }),
        });

        const data = await response.json();
        if (!response.ok) {
          if (msg) msg.textContent = data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
          return;
        }

        localStorage.setItem(CONFIG.TOKEN_KEY, data.token || 'admin-session');
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(data.user || { name: username }));

        window.location.href = '/admin/index.html';
      } catch (error) {
        if (msg) msg.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        console.error('Login error:', error);
      }
    });
  }
});