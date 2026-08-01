const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/homeofhearts';

const billingSchema = new mongoose.Schema({
  roomNumber: String,
  tenantName: String,
  amount: Number,
  dueDate: Date,
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  completedDate: Date,
  note: String
}, { timestamps: true });

const Billing = mongoose.model('Billing', billingSchema);

const emptyBillingSample = [
  {
    roomNumber: "-",
    tenantName: "-",
    amount: 0,
    dueDate: null,
    status: "pending",
    completedDate: null,
    note: "-"
  }
];

async function seedEmptyBillingData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🌱 Connected to MongoDB...');

    await Billing.deleteMany({});
    console.log('🗑️ ลบข้อมูลในระบบเงินหอพักเดิมเรียบร้อยแล้ว!');

    await Billing.insertMany(emptyBillingSample);
    console.log('✨ สร้างข้อมูลตัวอย่างค่าว่างสำเร็จ!');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล:', error);
  }
}

seedEmptyBillingData();