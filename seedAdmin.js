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
      existing.username = existing.username || 'admin';
      existing.name = 'สำนักงานหอพักบ้านแห่งหัวใจ';
      existing.phone = existing.phone || '02-123-4567';
      existing.role = 'admin';
      if (!existing.password.startsWith('$2')) {
        existing.password = await bcrypt.hash(existing.password || '12345678', 10);
      }
      await existing.save();
      console.log('Admin updated:', existing.email);
      process.exit(0);
    }
    const hashed = await bcrypt.hash('12345678', 10);
    const admin = new User({ username: 'admin', name: 'สำนักงานหอพักบ้านแห่งหัวใจ', phone: '02-123-4567', email: 'admin@example.com', password: hashed, role: 'admin' });
    await admin.save();
    console.log('Admin created: email=admin@example.com password=12345678');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
