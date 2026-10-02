const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error(
      '❌  MONGO_URI is not defined in environment variables.\n' +
        '    Please check your backend/.env file.'
    );
    process.exit(1);
  }

  if (uri.includes('<YOUR_ATLAS_PASSWORD>') || uri.includes('<username>') || uri.includes('<password>')) {
    console.error(
      '❌  MONGO_URI contains placeholder credentials (<YOUR_ATLAS_PASSWORD>).\n' +
        '    Please open backend/.env and replace <YOUR_ATLAS_PASSWORD> with your actual MongoDB Atlas database password.'
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
