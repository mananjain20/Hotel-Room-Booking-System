require('dotenv').config();
const mongoose = require('mongoose');
const Guest = require('../models/Guest');

const seedManager = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotel_booking';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);

    const name = process.env.MANAGER_NAME || 'System Manager';
    const email = (process.env.MANAGER_EMAIL || 'manager@hotel.com').toLowerCase();
    const password = process.env.MANAGER_PASSWORD || 'ManagerSecret123!';

    console.log(`Checking if manager account '${email}' exists...`);
    const existing = await Guest.findOne({ email });

    if (existing) {
      if (existing.role === 'manager') {
        console.log(`ℹ️  Manager account '${email}' already exists.`);
      } else {
        console.log(`⚠️  Updating existing account '${email}' to role 'manager'...`);
        existing.role = 'manager';
        await existing.save();
        console.log('✅  Account updated to manager role successfully.');
      }
    } else {
      console.log(`Creating new manager account '${email}'...`);
      await Guest.create({
        name,
        email,
        password,
        role: 'manager',
      });
      console.log('✅  Manager account created successfully!');
    }
  } catch (err) {
    console.error('❌  Error seeding manager account:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  }
};

seedManager();
