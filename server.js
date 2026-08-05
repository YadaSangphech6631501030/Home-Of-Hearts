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
  note: String
}, { timestamps: true });
const Billing = mongoose.models.Billing || mongoose.model("Billing", billingSchema);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/js", express.static(path.join(__dirname, "public/js")));

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
    // get rooms
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({
      status: { $in: ["occupied", "ไม่ว่าง"] }
    });
    const availableRooms = totalRooms - occupiedRooms;

    // get maintenance
    const maintPending = await Maintenance.countDocuments({ status: "รอดำเนินการ" });
    const maintProgress = await Maintenance.countDocuments({ status: "กำลังดำเนินการ" });
    const maintCompleted = await Maintenance.countDocuments({ status: "เสร็จสิ้น" });

    // get billing
    const totalBillings = await Billing.countDocuments();
    const billingPending = await Billing.countDocuments({ status: { $in: ["pending", "รอดำเนินการ"] } });
    const billingCompleted = await Billing.countDocuments({ status: { $in: ["completed", "เสร็จสิ้น"] } });

    // get parcels
    const parcelTotal = await Parcel.countDocuments({ status: "pending" });
    const parcelBox = await Parcel.countDocuments({ status: "pending", type: "กล่อง" });
    const parcelEnvelope = await Parcel.countDocuments({ status: "pending", type: "ซอง" });

    // get announcements
    const recentAnnouncements = await Announcement.find()
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: availableRooms
        },
        maintenance: {
          pending: maintPending,
          progress: maintProgress,
          completed: maintCompleted
        },
        billing: {
          total: totalBillings,
          pending: billingPending,
          completed: billingCompleted
        },
        parcels: {
          total: parcelTotal,
          box: parcelBox,
          envelope: parcelEnvelope
        },
        alerts: recentAnnouncements
      }
    });
  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ success: false, error: "ไม่สามารถดึงข้อมูลสรุปได้" });
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