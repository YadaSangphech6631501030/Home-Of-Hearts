const http = require("http");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const ADMIN_USERNAME = process.env.SMOKE_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD;
const USER_USERNAME = process.env.SMOKE_USER_USERNAME;
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD;
const ROOM_NUMBER = process.env.SMOKE_ROOM_NUMBER || USER_USERNAME || "101";

function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const body = options.body ? JSON.stringify(options.body) : null;
  const headers = {
    ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: options.method || "GET", headers }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        let data = raw;
        try { data = raw ? JSON.parse(raw) : {}; } catch (error) {}
        resolve({ status: res.statusCode, data, raw });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectStatus(label, path, expected, options) {
  const response = await request(path, options);
  assert(response.status === expected, `${label} expected ${expected}, got ${response.status}`);
  console.log(`PASS ${label} (${response.status})`);
  return response;
}

async function login(label, username, password) {
  const response = await expectStatus(label, "/auth/login", 200, {
    method: "POST",
    body: { username, password },
  });
  assert(response.data && response.data.token, `${label} did not return token`);
  return response.data.token;
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}`);

  await expectStatus("login page", "/", 200);
  await expectStatus("admin dashboard page", "/admin/index.html", 200);
  await expectStatus("user dashboard page", "/user/index.html", 200);
  await expectStatus("public contact api", "/api/contact", 200);
  await expectStatus("admin endpoint without token", "/api/billings", 403);

  if (ADMIN_USERNAME && ADMIN_PASSWORD) {
    const adminToken = await login("admin login", ADMIN_USERNAME, ADMIN_PASSWORD);
    await expectStatus("admin me", "/api/me", 200, { token: adminToken });
    await expectStatus("admin dashboard summary", "/api/dashboard/summary", 200, { token: adminToken });
    await expectStatus("rooms", "/api/rooms", 200, { token: adminToken });
    await expectStatus("room overview", `/api/rooms/${encodeURIComponent(ROOM_NUMBER)}/overview`, 200, { token: adminToken });
    await expectStatus("maintenance list", "/api/maintenance", 200, { token: adminToken });
    await expectStatus("billing list", "/api/billings", 200, { token: adminToken });
    await expectStatus("parcel list", "/api/parcels", 200, { token: adminToken });
    await expectStatus("announcements", "/api/announcements", 200, { token: adminToken });
  } else {
    console.log("SKIP admin authenticated checks (set SMOKE_ADMIN_USERNAME and SMOKE_ADMIN_PASSWORD)");
  }

  if (USER_USERNAME && USER_PASSWORD) {
    const userToken = await login("user login", USER_USERNAME, USER_PASSWORD);
    await expectStatus("user me", "/api/me", 200, { token: userToken });
    await expectStatus("user home data", "/api/user/home-data", 200, { token: userToken });
    await expectStatus("user billing", "/api/user/billing-data", 200, { token: userToken });
    await expectStatus("user billing history", "/api/user/billing-history", 200, { token: userToken });
    await expectStatus("user parcels", "/api/user/parcels", 200, { token: userToken });
  } else {
    console.log("SKIP user authenticated checks (set SMOKE_USER_USERNAME and SMOKE_USER_PASSWORD)");
  }

  console.log("Smoke test completed successfully.");
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
