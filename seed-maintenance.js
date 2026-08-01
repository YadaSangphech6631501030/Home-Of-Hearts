const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  roomNumber: String,
  senderName: String,
  type: String,
  details: String,
  status: String,
  appointmentDate: Date,
  completedDate: Date
}, { timestamps: true });

const Maintenance = mongoose.models.Maintenance || mongoose.model('Maintenance', maintenanceSchema);

const initialMaintenanceData = [
  {
    roomNumber: "",
    senderName: "",
    type: "",
    details: "",
    status: "",
    appointmentDate: null,
    completedDate: null,
    createdAt: new Date()
  }
];

const seedMaintenanceDatabase = async () => {
  try {
   await mongoose.connect('mongodb://localhost:27017/homeofhearts');
    console.log('📦 Connected to MongoDB...');

    await Maintenance.deleteMany({});
    console.log('🧹 Cleared existing maintenance records.');

    await Maintenance.insertMany(initialMaintenanceData);
    console.log('✅ Seeded maintenance records successfully!');

  } catch (error) {
    console.error('❌ Error seeding maintenance data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
};

seedMaintenanceDatabase();