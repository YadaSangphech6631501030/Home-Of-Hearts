const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/homeofhearts";


const parcelSchema = new mongoose.Schema(
  {
    receivedDate: String,
    roomNumber: String,
    recipientName: String,
    type: String,
    courier: String,
    status: String,
    statusText: String,
    completedDate: String,
    note: String,
  },
  { timestamps: true }
);

const Parcel = mongoose.models.Parcel || mongoose.model("Parcel", parcelSchema);

const emptyParcels = [
  {
    receivedDate: "",
    roomNumber: "",
    recipientName: "",
    type: "",
    courier: "",
    status: "",
    statusText: "",
    completedDate: "",
    note: "",
  },
];

const seedEmptyDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("🟢 เชื่อมต่อกับ MongoDB สำเร็จ");

    await Parcel.deleteMany({});
    console.log("🧹 ลบข้อมูลพัสดุเดิมเรียบร้อยแล้ว");

  
    await Parcel.insertMany(emptyParcels);
    console.log("✨ บันทึกโครงสร้างข้อมูลค่าว่างเรียบร้อยแล้ว!");

    await mongoose.connection.close();
    console.log("🔌 ปิดการเชื่อมต่อเรียบร้อยครับ");
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    process.exit(1);
  }
};

seedEmptyDatabase();