require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET environment variable");
}

function createSessionToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");

  return body + "." + signature;
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return null;

  const [body, signature] = token.split(".");
  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");

  if (signature !== expected) return null;

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (error) {
    return null;
  }
}

function getSessionUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  return verifySessionToken(token);
}

// MongoDB
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/homeofhearts";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Room schema
const roomSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true, unique: true },
    floor: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance"],
      default: "available",
    },
    price: { type: Number, default: 0 },
    tenant: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      idCard: { type: String, default: "" },
      startDate: { type: String, default: "" },
      endDate: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", roomSchema);

// Parcel schema
const parcelSchema = new mongoose.Schema(
  {
    roomNumber: { type: String, required: true },
    recipientName: { type: String, default: "-" },
    courier: { type: String, required: true },
    type: { type: String, required: true },
    receivedDate: { type: String, required: true },
    completedDate: { type: String, default: "-" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    statusText: { type: String, default: "รอรับพัสดุ" },
    note: { type: String, default: "-" },
    imageUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

const Parcel = mongoose.model("Parcel", parcelSchema);

// announcement schema
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, default: "สำนักงานหอพักบ้านแห่งหัวใจ" },
    date: { type: String, required: true }, 
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

// Maintenance schema
const maintenanceSchema = new mongoose.Schema({
  roomNumber: String,
  senderName: String,
  type: String,
  title: String,
  description: String,
  imageUrl: String,
  status: { type: String, default: "รอดำเนินการ" },
  appointmentDate: String,
  completedDate: String
}, { timestamps: true });
const Maintenance = mongoose.models.Maintenance || mongoose.model("Maintenance", maintenanceSchema);

// Bill schema
const billingSchema = new mongoose.Schema({
  roomNumber: String,
  tenantName: String,
  amount: Number,
  dueDate: String,
  completedDate: String,
  status: { type: String, default: "pending" }, // 'pending', 'completed'
  note: String,
  cycleId: String,
  rentAmount: { type: Number, default: 0 },
  waterRate: { type: Number, default: 0 },
  waterUnits: { type: Number, default: 0 },
  waterTotal: { type: Number, default: 0 },
  electricityRate: { type: Number, default: 0 },
  electricityUnits: { type: Number, default: 0 },
  electricityTotal: { type: Number, default: 0 }
}, { timestamps: true });
const Billing = mongoose.models.Billing || mongoose.model("Billing", billingSchema);

const billingCycleSchema = new mongoose.Schema({
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  rentAmount: { type: Number, default: 0 },
  waterRate: { type: Number, default: 0 },
  electricityRate: { type: Number, default: 0 },
  targetRooms: { type: String, default: "occupied" },
  status: { type: String, default: "active" }
}, { timestamps: true });
const BillingCycle = mongoose.models.BillingCycle || mongoose.model("BillingCycle", billingCycleSchema);

const contactInfoSchema = new mongoose.Schema({
  tel: { type: String, default: "" },
  email: { type: String, default: "" },
  facebook: { type: String, default: "" },
  line: { type: String, default: "" },
  address: { type: String, default: "" },
  qrMain: { type: String, default: "" },
  qrShop: { type: String, default: "" },
  qrOffice: { type: String, default: "" }
}, { timestamps: true });
const ContactInfo = mongoose.models.ContactInfo || mongoose.model("ContactInfo", contactInfoSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

// contact info
app.get("/api/contact", async (req, res) => {
  try {
    const contact = await ContactInfo.findOne().sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: contact || {
        tel: "",
        email: "",
        facebook: "",
        line: "",
        address: "",
        qrMain: "",
        qrShop: "",
        qrOffice: ""
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/contact", async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "ไม่มีสิทธิ์แก้ไขข้อมูลติดต่อ" });
    }

    const allowedFields = ["tel", "email", "facebook", "line", "address", "qrMain", "qrShop", "qrOffice"];
    const payload = {};

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = String(req.body[field] || "").trim();
      }
    });

    const existing = await ContactInfo.findOne().sort({ updatedAt: -1 });
    const contact = existing
      ? await ContactInfo.findByIdAndUpdate(existing._id, payload, { new: true })
      : await ContactInfo.create(payload);

    res.json({ success: true, data: contact });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// login
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "กรุณากรอกเลขห้อง/อีเมลและรหัสผ่านให้ครบ" });
  }

  try {
    const adminUser = await User.findOne({
      role: "admin",
      $or: [{ username }, { email: username }],
    });

    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
      const token = createSessionToken({ role: "admin", userId: String(adminUser._id) });

      return res.json({
        success: true,
        token,
        user: {
          id: adminUser._id,
          role: adminUser.role,
          username: adminUser.username,
          name: adminUser.name || adminUser.username || "สำนักงานหอพักบ้านแห่งหัวใจ",
          roomNumber: "-",
          phone: adminUser.phone || "-",
          email: adminUser.email || "-",
        },
      });
    }

    const tenantUser = await User.findOne({
      role: "user",
      $or: [{ username }, { email: username }],
    });

    if (tenantUser && await bcrypt.compare(password, tenantUser.password)) {
      const room = await Room.findOne({ roomNumber: tenantUser.username });
      const token = createSessionToken({ role: "tenant", roomNumber: tenantUser.username, userId: String(tenantUser._id) });

      return res.json({
        success: true,
        token,
        user: {
          id: tenantUser._id,
          role: "tenant",
          username: tenantUser.username,
          name: tenantUser.name || (room && room.tenant && room.tenant.fullName) || "ผู้เช่า",
          roomNumber: tenantUser.username,
          phone: tenantUser.phone || (room && room.tenant && room.tenant.phone) || "-",
          email: tenantUser.email || (room && room.tenant && room.tenant.email) || "-",
        },
      });
    }

    const room = await Room.findOne({ roomNumber: username });

    if (room && room.tenant && room.tenant.fullName) {
      if (password === room.tenant.phone || password === "12345678") {
        const token = createSessionToken({ role: "tenant", roomNumber: room.roomNumber });

        return res.json({
          success: true,
          token,
          user: {
            role: "tenant",
            name: room.tenant.fullName,
            roomNumber: room.roomNumber,
            phone: room.tenant.phone,
            email: room.tenant.email || "-",
          },
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: "เลขห้อง เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// get user info
app.get("/api/me", async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser) {
      return res.status(401).json({ success: false, message: "กรุณาเข้าสู่ระบบอีกครั้ง" });
    }

    if (sessionUser.role === "admin") {
      const adminUser = await User.findOne({ _id: sessionUser.userId, role: "admin" });

      if (!adminUser) {
        return res.status(404).json({ success: false, message: "ไม่พบข้อมูลบัญชีผู้ดูแล" });
      }

      return res.json({
        success: true,
        data: {
          id: adminUser._id,
          role: adminUser.role,
          username: adminUser.username,
          name: adminUser.name || adminUser.username || "สำนักงานหอพักบ้านแห่งหัวใจ",
          room: "Admin",
          phone: adminUser.phone || "-",
          email: adminUser.email || "-",
        },
      });
    }

    const tenantUser = sessionUser.userId
      ? await User.findOne({ _id: sessionUser.userId, role: "user" })
      : null;
    const roomNumber = tenantUser ? tenantUser.username : sessionUser.roomNumber;
    const room = await Room.findOne({ roomNumber });

    if (!tenantUser && (!room || !room.tenant)) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้เช่า" });
    }

    res.json({
      success: true,
      data: {
        id: tenantUser ? tenantUser._id : undefined,
        role: "tenant",
        username: tenantUser ? tenantUser.username : room.roomNumber,
        name: (tenantUser && tenantUser.name) || (room && room.tenant && room.tenant.fullName) || "ไม่ระบุชื่อ",
        room: roomNumber,
        roomNumber,
        phone: (tenantUser && tenantUser.phone) || (room && room.tenant && room.tenant.phone) || "-",
        email: (tenantUser && tenantUser.email) || (room && room.tenant && room.tenant.email) || "-",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// admin dashboard page
app.get("/admin/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const latestCycle = await BillingCycle.findOne().sort({ endDate: -1, createdAt: -1 });
    const billingQuery = latestCycle
      ? { $or: [{ cycleId: String(latestCycle._id) }, { dueDate: latestCycle.endDate }] }
      : {};

    const [rooms, maintenanceItems, billings, parcels, recentAnnouncements] = await Promise.all([
      Room.find().lean(),
      Maintenance.find().lean(),
      Billing.find(billingQuery).lean(),
      Parcel.find({ status: { $nin: ["completed", "เสร็จสิ้น"] } }).lean(),
      Announcement.find().sort({ createdAt: -1 }).limit(6).lean()
    ]);

    const occupiedRooms = rooms.filter((room) => {
      const status = String(room.status || "").toLowerCase().trim();
      return status === "occupied" || status === "ไม่ว่าง" || Boolean(room.tenant && room.tenant.fullName);
    }).length;

    const availableRooms = rooms.filter((room) => {
      const status = String(room.status || "").toLowerCase().trim();
      return status === "available" || status === "ว่าง" || (!room.tenant?.fullName && status !== "maintenance");
    }).length;

    const maintenanceSummary = maintenanceItems.reduce((summary, item) => {
      const status = String(item.status || "รอดำเนินการ").trim();
      if (status === "เสร็จสิ้น" || status === "completed") summary.completed += 1;
      else if (status === "กำลังดำเนินการ" || status === "in-progress") summary.progress += 1;
      else summary.pending += 1;
      return summary;
    }, { pending: 0, progress: 0, completed: 0 });

    const billingSummary = billings.reduce((summary, item) => {
      const status = String(item.status || "pending").trim();
      if (status === "completed" || status === "เสร็จสิ้น") summary.completed += 1;
      else summary.pending += 1;
      return summary;
    }, { total: billings.length, pending: 0, completed: 0 });

    const parcelSummary = parcels.reduce((summary, item) => {
      const type = String(item.type || "").trim().toLowerCase();
      summary.total += 1;
      if (["envelope", "ซอง", "ซองเอกสาร"].includes(type)) summary.envelope += 1;
      else summary.box += 1;
      return summary;
    }, { total: 0, box: 0, envelope: 0 });

    res.json({
      success: true,
      data: {
        rooms: {
          total: rooms.length,
          occupied: occupiedRooms,
          available: availableRooms
        },
        maintenance: maintenanceSummary,
        billing: {
          ...billingSummary,
          date: latestCycle?.endDate || billings[0]?.dueDate || "-",
          cycleStart: latestCycle?.startDate || "",
          cycleEnd: latestCycle?.endDate || ""
        },
        parcels: parcelSummary,
        alerts: recentAnnouncements
      }
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ success: false, error: "ไม่สามารถดึงข้อมูลสรุปได้" });
  }
});

// maintenance requests
app.get('/api/maintenance', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const { search, type, status, from, to } = req.query;
    const query = {};

    if (search && String(search).trim()) {
      const keyword = String(search).trim();
      query.$or = [
        { roomNumber: { $regex: keyword, $options: 'i' } },
        { senderName: { $regex: keyword, $options: 'i' } },
        { type: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const list = await Maintenance.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/maintenance', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== 'tenant') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้เช่าเท่านั้น' });
    }

    const { type, title, description, imageUrl } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลแจ้งซ่อมให้ครบ' });
    }

    const tenantUser = sessionUser.userId
      ? await User.findOne({ _id: sessionUser.userId, role: 'user' })
      : null;
    const roomNumber = tenantUser ? tenantUser.username : sessionUser.roomNumber;
    const room = await Room.findOne({ roomNumber });
    const senderName = (tenantUser && tenantUser.name) || (room && room.tenant && room.tenant.fullName) || 'ผู้เช่า';

    const item = await Maintenance.create({
      roomNumber,
      senderName,
      type,
      title,
      description,
      imageUrl: imageUrl || '',
      status: 'รอดำเนินการ',
      appointmentDate: '',
      completedDate: '',
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


app.put('/api/maintenance/:id', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    const sessionAdmin = sessionUser && sessionUser.role === 'admin';
    const mongoAdmin = sessionUser && sessionUser.userId
      ? await User.findOne({ _id: sessionUser.userId, role: 'admin' }).select('_id')
      : null;

    if (!sessionAdmin && !mongoAdmin) {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'รหัสรายการแจ้งซ่อมไม่ถูกต้อง' });
    }

    const { status, appointmentDate, completedDate } = req.body;
    const allowedStatuses = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'สถานะแจ้งซ่อมไม่ถูกต้อง' });
    }

    const payload = {
      ...(status !== undefined && { status }),
      ...(appointmentDate !== undefined && { appointmentDate }),
      ...(completedDate !== undefined && { completedDate }),
    };

    const item = await Maintenance.findByIdAndUpdate(id, payload, { new: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการแจ้งซ่อม' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/maintenance/:id', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    const sessionAdmin = sessionUser && sessionUser.role === 'admin';
    const mongoAdmin = sessionUser && sessionUser.userId
      ? await User.findOne({ _id: sessionUser.userId, role: 'admin' }).select('_id')
      : null;

    if (!sessionAdmin && !mongoAdmin) {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'รหัสรายการแจ้งซ่อมไม่ถูกต้อง' });
    }

    const item = await Maintenance.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการแจ้งซ่อม' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// user homepage data - only for the logged-in tenant
app.get('/api/user/home-data', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== 'tenant') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้เช่าเท่านั้น' });
    }

    const roomNumber = sessionUser.roomNumber;
    const [latestBill, pendingParcels, latestMaintenance, announcements] = await Promise.all([
      Billing.findOne({ roomNumber }).sort({ dueDate: -1, createdAt: -1 }),
      Parcel.find({ roomNumber, status: { $nin: ['completed', 'เสร็จสิ้น'] } }).sort({ createdAt: -1 }),
      Maintenance.findOne({ roomNumber }).sort({ createdAt: -1 }),
      Announcement.find().sort({ createdAt: -1 }).limit(2),
    ]);

    res.json({
      success: true,
      data: {
        billing: latestBill,
        pendingParcelCount: pendingParcels.length,
        maintenance: latestMaintenance,
        announcements,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// billing helpers
function parseBillingNumber(value) {
  const number = Number(String(value ?? "0").replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : 0;
}

function formatBillingStatus(status) {
  if (status === "completed") return "เสร็จสิ้น";
  if (status === "pending") return "รอดำเนินการ";
  return status || "รอดำเนินการ";
}

// admin billing cycles
app.get('/api/billing-cycles', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }
    const cycles = await BillingCycle.find().sort({ endDate: -1, createdAt: -1 });
    res.json({ success: true, data: cycles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/billings/batch', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const { startDate, endDate, targetRooms } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกช่วงวันที่ให้ครบถ้วน' });
    }

    const cycle = await BillingCycle.findOneAndUpdate(
      { startDate, endDate },
      {
        $set: {
          startDate,
          endDate,
          targetRooms: targetRooms || 'occupied',
          rentAmount: parseBillingNumber(req.body.rentAmount),
          waterRate: parseBillingNumber(req.body.waterRate),
          electricityRate: parseBillingNumber(req.body.electricityRate),
          status: 'active',
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// admin billing records
app.get('/api/billings', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }
    const billings = await Billing.find().sort({ createdAt: -1 });
    res.json(billings);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/billings', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const { cycleId, roomNumber, note } = req.body;
    if (!cycleId || !roomNumber) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกรอบบิลและห้องให้ครบถ้วน' });
    }

    const cycle = await BillingCycle.findById(cycleId);
    if (!cycle) return res.status(404).json({ success: false, message: 'ไม่พบรอบบิล' });

    const room = await Room.findOne({ roomNumber });
    const tenantName = room?.tenant?.fullName || '-';
    const payload = {
      cycleId: String(cycle._id),
      roomNumber,
      tenantName,
      dueDate: cycle.endDate,
      amount: parseBillingNumber(req.body.amount),
      rentAmount: parseBillingNumber(req.body.rentAmount),
      waterRate: parseBillingNumber(req.body.waterRate),
      waterUnits: parseBillingNumber(req.body.waterUnits),
      waterTotal: parseBillingNumber(req.body.waterTotal),
      electricityRate: parseBillingNumber(req.body.electricityRate),
      electricityUnits: parseBillingNumber(req.body.electricityUnits),
      electricityTotal: parseBillingNumber(req.body.electricityTotal),
      note: note || '',
      status: 'pending',
    };

    const billing = await Billing.findOneAndUpdate(
      { cycleId: String(cycle._id), roomNumber },
      { $set: payload },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/billings/:id', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }

    const payload = {
      amount: parseBillingNumber(req.body.amount),
      rentAmount: parseBillingNumber(req.body.rentAmount),
      waterRate: parseBillingNumber(req.body.waterRate),
      waterUnits: parseBillingNumber(req.body.waterUnits),
      waterTotal: parseBillingNumber(req.body.waterTotal),
      electricityRate: parseBillingNumber(req.body.electricityRate),
      electricityUnits: parseBillingNumber(req.body.electricityUnits),
      electricityTotal: parseBillingNumber(req.body.electricityTotal),
      note: req.body.note || '',
    };

    const billing = await Billing.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!billing) return res.status(404).json({ success: false, message: 'ไม่พบบิล' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/billings/:id', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้ดูแลระบบเท่านั้น' });
    }
    const billing = await Billing.findByIdAndDelete(req.params.id);
    if (!billing) return res.status(404).json({ success: false, message: 'ไม่พบบิล' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// user billing - latest bill for logged-in tenant room
app.get('/api/user/billing-data', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'tenant') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้เช่าเท่านั้น' });
    }

    const roomNumber = sessionUser.roomNumber;
    const [room, billing] = await Promise.all([
      Room.findOne({ roomNumber }),
      Billing.findOne({ roomNumber }).sort({ dueDate: -1, createdAt: -1 }),
    ]);
    let cycle = billing?.cycleId ? await BillingCycle.findById(billing.cycleId) : null;
    if (!cycle && billing?.dueDate) {
      cycle = await BillingCycle.findOne({ endDate: billing.dueDate }).sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      data: {
        tenant: sessionUser,
        room,
        billing,
        cycle,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// user billing history - all bills for logged-in tenant room
app.get('/api/user/billing-history', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== 'tenant') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้เช่าเท่านั้น' });
    }

    const roomNumber = sessionUser.roomNumber;
    const billings = await Billing.find({ roomNumber }).sort({ dueDate: -1, createdAt: -1 });
    const cycleIds = [...new Set(billings.map((billing) => billing.cycleId).filter(Boolean))];
    const cycles = cycleIds.length ? await BillingCycle.find({ _id: { $in: cycleIds } }) : [];
    const cycleMap = new Map(cycles.map((cycle) => [String(cycle._id), cycle]));

    const history = billings.map((billing) => {
      const cycle = billing.cycleId ? cycleMap.get(String(billing.cycleId)) : null;
      return {
        id: billing._id,
        cycle: cycle ? { startDate: cycle.startDate, endDate: cycle.endDate } : null,
        roomNumber: billing.roomNumber,
        tenantName: billing.tenantName,
        dueDate: billing.dueDate,
        completedDate: billing.completedDate,
        status: billing.status,
        amount: billing.amount,
        note: billing.note,
        createdAt: billing.createdAt,
        updatedAt: billing.updatedAt,
      };
    });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// dormitory page - fetch all rooms
app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json({
      success: true,
      data: rooms,
      rooms: rooms,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create tenant account and attach it to a room
app.post("/api/rooms/:roomNumber/tenant-account", async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "ต้องเป็นผู้ดูแลระบบเท่านั้น" });
    }

    const { roomNumber } = req.params;
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword || !roomNumber) {
      return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบทุกช่อง" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "รหัสผ่านไม่ตรงกัน" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const room = await Room.findOne({ roomNumber });

    if (!room) {
      return res.status(404).json({ success: false, message: "ไม่พบห้องพัก" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: roomNumber,
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user",
    });

    room.status = "occupied";
    room.tenant.fullName = name;
    room.tenant.phone = phone;
    room.tenant.email = email;
    await room.save();

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, username: user.username, name: user.name, email: user.email, phone: user.phone, role: user.role },
        room,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch room details by room number
app.get("/api/rooms/:roomNumber", async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const room = await Room.findOne({ roomNumber: roomNumber });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const roomObj = room.toObject ? room.toObject() : room;
    const tenant = roomObj.tenant || {};
    const hasTenant =
      tenant.fullName && tenant.fullName.trim() !== "" && tenant.fullName !== "-";

    if (hasTenant) {
      roomObj.status = "occupied";
    } else if (!roomObj.status) {
      roomObj.status = "available";
    }

    res.json(roomObj);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/rooms/:roomNumber/overview", async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);
    if (!sessionUser || sessionUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "ต้องเป็นผู้ดูแลระบบเท่านั้น" });
    }

    const { roomNumber } = req.params;
    const [room, maintenanceList, latestBilling, parcelList] = await Promise.all([
      Room.findOne({ roomNumber }).lean(),
      Maintenance.find({ roomNumber }).sort({ createdAt: -1 }).lean(),
      Billing.findOne({ roomNumber }).sort({ dueDate: -1, createdAt: -1 }).lean(),
      Parcel.find({ roomNumber }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    let cycle = null;
    if (latestBilling && latestBilling.cycleId && mongoose.Types.ObjectId.isValid(latestBilling.cycleId)) {
      cycle = await BillingCycle.findById(latestBilling.cycleId).lean();
    }
    if (!cycle && latestBilling && latestBilling.dueDate) {
      cycle = await BillingCycle.findOne({ endDate: latestBilling.dueDate }).sort({ createdAt: -1 }).lean();
    }

    const pendingMaintenanceStatuses = ["รอดำเนินการ", "กำลังดำเนินการ", "pending", "in_progress"];
    const pendingMaintenance = maintenanceList.filter((item) => pendingMaintenanceStatuses.includes(item.status));
    const pendingParcels = parcelList.filter((item) => item.status !== "completed" && item.status !== "เสร็จสิ้น");
    const completedParcels = parcelList.filter((item) => item.status === "completed" || item.status === "เสร็จสิ้น");
    const billingDueDate = (latestBilling && latestBilling.dueDate) || (cycle && cycle.endDate) || "";
    const cycleStartDate = (cycle && cycle.startDate) || "";
    const cycleEndDate = (cycle && cycle.endDate) || billingDueDate;
    const period = cycleStartDate && cycleEndDate ? cycleStartDate + " ถึง " + cycleEndDate : billingDueDate || "-";
    const overdueDays = getOverdueDays(billingDueDate, latestBilling ? latestBilling.status : "");
    const tenant = room.tenant || {};
    const tenantName = (tenant.fullName || "").trim();
    const hasTenant = tenantName && tenantName !== "-";
    const tenantHistory = hasTenant
      ? [{
          year: extractYear(tenant.startDate || room.updatedAt),
          name: tenantName,
          period: formatTenantPeriod(tenant.startDate, tenant.endDate),
          status: hasTenant ? "ผู้เช่าปัจจุบัน" : "ย้ายออก",
        }]
      : [];

    res.json({
      success: true,
      data: {
        maintenance: {
          total: maintenanceList.length,
          pending: pendingMaintenance.length,
          latest: maintenanceList[0] || null,
        },
        billing: {
          latest: latestBilling || null,
          period,
          overdueDays,
          statusText: latestBilling ? formatBillingStatus(latestBilling.status) : "-",
          amount: latestBilling ? latestBilling.amount || 0 : 0,
        },
        parcels: {
          total: parcelList.length,
          pending: pendingParcels.length,
          completed: completedParcels.length,
          latest: parcelList[0] || null,
        },
        tenantHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function getOverdueDays(dateValue, status) {
  if (!dateValue || status === "completed") return 0;
  const dueDate = parseStoredDate(dateValue);
  if (!dueDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  if (dueDate >= today) return 0;
  return Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
}

function parseStoredDate(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const text = String(value).trim();
  const isoDate = new Date(text);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function extractYear(value) {
  const date = parseStoredDate(value);
  return date ? date.getFullYear() : "-";
}

function formatTenantPeriod(startDate, endDate) {
  if (!startDate && !endDate) return "-";
  return (startDate || "-") + " - " + (endDate || "-");
}

// Update Room 
app.put("/api/rooms/:roomNumber", async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { status, tenant, price } = req.body;

    const tenantEmail = tenant && tenant.email ? tenant.email.trim() : "";

    if (tenantEmail) {
      const existingEmailUser = await User.findOne({ email: tenantEmail, username: { $ne: roomNumber } });

      if (existingEmailUser) {
        return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
    }

    const updatedRoom = await Room.findOneAndUpdate(
      { roomNumber },
      {
        $set: {
          ...(status && { status }),
          ...(price !== undefined && { price }),
          ...(tenant && {
            "tenant.fullName": tenant.fullName || "",
            "tenant.phone": tenant.phone || "",
            "tenant.email": tenant.email || "",
            "tenant.idCard": tenant.idCard || "",
            "tenant.startDate": tenant.startDate || "",
            "tenant.endDate": tenant.endDate || "",
          }),
        },
      },
      { new: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (tenant) {
      await User.findOneAndUpdate(
        { username: roomNumber, role: "user" },
        {
          $set: {
            name: tenant.fullName || "",
            phone: tenant.phone || "",
            ...(tenantEmail && { email: tenantEmail }),
          },
        }
      );
    }

    res.json({ success: true, data: updatedRoom });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check-out button
app.post("/api/rooms/:roomNumber/checkout", async (req, res) => {
  try {
    const { roomNumber } = req.params;

    const room = await Room.findOneAndUpdate(
      { roomNumber },
      {
        $set: {
          status: "available",
          tenant: {
            fullName: "",
            phone: "",
            email: "",
            idCard: "",
            startDate: "",
            endDate: "",
          },
        },
      },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, message: "Check-out successful", data: room });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// user parcels - only parcels for the logged-in tenant room
app.get('/api/user/parcels', async (req, res) => {
  try {
    const sessionUser = getSessionUser(req);

    if (!sessionUser || sessionUser.role !== 'tenant') {
      return res.status(403).json({ success: false, message: 'ต้องเป็นผู้เช่าเท่านั้น' });
    }

    const parcels = await Parcel.find({ roomNumber: sessionUser.roomNumber }).sort({ createdAt: -1 });
    res.json({ success: true, data: parcels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// get parcels pages
app.get('/api/parcels', async (req, res) => {
  try {
    const parcels = await Parcel.find().sort({ createdAt: -1 });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// add new parcel
app.post('/api/parcels', async (req, res) => {
  try {
    const newParcel = new Parcel(req.body);
    await newParcel.save();
    res.status(201).json({ success: true, data: newParcel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// delete parcel
app.delete('/api/parcels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedParcel = await Parcel.findByIdAndDelete(id);

    if (!deletedParcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    res.json({ success: true, message: 'Parcel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// updates parcel
app.put('/api/parcels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedParcel = await Parcel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedParcel) {
      return res.status(404).json({ success: false, message: 'Parcel not found' });
    }

    res.json({ success: true, data: updatedParcel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//  get announcements 
app.get("/api/announcements", async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//  add new announcement
app.post("/api/announcements", async (req, res) => {
  try {
    const { title, content, date } = req.body;
    const newAnnouncement = new Announcement({
      title,
      content,
      date: date || new Date().toLocaleDateString("th-TH"),
    });
    await newAnnouncement.save();
    res.status(201).json({ success: true, data: newAnnouncement });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// delete announcement
app.delete("/api/announcements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
