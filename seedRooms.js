const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Room = require('./models/Room');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/homeofhearts';

const rooms = [
  ...Array.from({ length: 10 }, (_, index) => ({ floor: 1, roomNumber: String(101 + index) })),
  ...Array.from({ length: 10 }, (_, index) => ({ floor: 2, roomNumber: String(201 + index) })),
  ...Array.from({ length: 10 }, (_, index) => ({ floor: 3, roomNumber: String(301 + index) })),
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    await Room.bulkWrite(
      rooms.map((room) => ({
        updateOne: {
          filter: { roomNumber: room.roomNumber },
          update: {
            $set: { 
              ...room,
              status: 'available',
              tenant: {
                fullName: '',
                phone: '',
                moveInDate: null,
                contractEndDate: null,
              },
            },
          },
          upsert: true,
        },
      })),
    );

    console.log(`Rooms seeded: ${rooms.length} rooms across 3 floors`);
    process.exit(0);
  } catch (err) {
    console.error('Seed rooms error', err);
    process.exit(1);
  }
}

seed();