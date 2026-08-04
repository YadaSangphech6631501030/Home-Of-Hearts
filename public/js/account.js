(function () {
  const storedUser = API.getUser();

  const fields = {
    name: document.getElementById("acc-name"),
    room: document.getElementById("acc-room"),
    phone: document.getElementById("acc-phone"),
    email: document.getElementById("acc-email"),
    password: document.getElementById("acc-password"),
  };

  const avatars = [
    document.getElementById("main-avatar"),
    document.getElementById("avatar-initials"),
    document.getElementById("avatar-dropdown-initials"),
  ].filter(Boolean);

  function setValue(input, value) {
    if (input) input.value = value || "-";
  }

  function getInitial(name) {
    const text = String(name || "").trim();
    return text ? text.charAt(0) : "ส";
  }

  function applyAccount(user) {
    const name = user.name || user.username || storedUser.name || "-";
    const room = user.room || user.roomNumber || storedUser.roomNumber || (user.role === "admin" ? "Admin" : "-");
    const phone = user.phone || storedUser.phone || "-";
    const email = user.email || storedUser.email || "-";

    setValue(fields.name, name);
    setValue(fields.room, room === "-" && user.role === "admin" ? "Admin" : room);
    setValue(fields.phone, phone);
    setValue(fields.email, email);
    setValue(fields.password, "********");

    avatars.forEach((avatar) => {
      avatar.textContent = getInitial(name);
    });

    const profileName = document.getElementById("profile-name");
    const profileMenuName = document.getElementById("profile-menu-name");
    const shortName = name.length > 12 ? `${name.slice(0, 10)}...` : name;

    if (profileName) profileName.textContent = shortName;
    if (profileMenuName) profileMenuName.textContent = name;
  }

  async function loadAccount() {
    applyAccount(storedUser);
    const response = await API.get("/api/me");
    const user = response.data || response.user || response;

    applyAccount({ ...storedUser, ...user });
  }

  loadAccount().catch((error) => {
    console.error("Account load error:", error);
    applyAccount(storedUser);
  });
})();
