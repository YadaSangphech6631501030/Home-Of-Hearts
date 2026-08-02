const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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

  if (
    (username === "admin" || username === "admin@example.com") &&
    password === "12345678"
  ) {
    return res.json({
      token: "mock-jwt-token-home-of-hearts",
      user: {
        username: "admin",
        name: "สำนักงานหอพักบ้านแห่งหัวใจ",
        role: "admin",
      },
    });
  }

  return res.status(401).json({
    message: "Username or password is incorrect",
  });
});

// login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// admin dashboard page
app.get("/admin/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
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

// Update Room / Tenant Details 
app.put("/api/rooms/:roomNumber", async (req, res) => {
  try {
    const { roomNumber } = req.params;
    const { status, tenant, price } = req.body;

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

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});