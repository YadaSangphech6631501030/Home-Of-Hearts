const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied'], default: 'available' },
  tenant: {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    moveInDate: { type: Date, default: null },
    contractEndDate: { type: Date, default: null },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

roomSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Room', roomSchema);
