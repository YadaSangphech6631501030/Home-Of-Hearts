const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/homeofhearts';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }
    const hashed = await bcrypt.hash('12345678', 10);
    const admin = new User({ username: 'admin', email: 'admin@example.com', password: hashed, role: 'admin' });
    await admin.save();
    console.log('Admin created: email=admin@example.com password=12345678');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
