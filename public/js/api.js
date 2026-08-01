window.API = {
  // get token from localStorage
  getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY) || "";
  },

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`; 
    }
    return headers;
  },

  async get(path) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || "เกิดข้อผิดพลาด");
    }

    return data;
  },

  async post(path, body) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || "เกิดข้อผิดพลาด");
    }

    return data;
  },

  async put(path, body) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || "เกิดข้อผิดพลาด");
    }

    return data;
  },

  async delete(path) {
    const response = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || data.message || "เกิดข้อผิดพลาด");
    }

    return data;
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || "{}");
    } catch (error) {
      return {};
    }
  },

  logout() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = "/";
  },
};