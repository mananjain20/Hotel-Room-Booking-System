const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀  Server running on port ${PORT}  [${process.env.NODE_ENV || 'development'}]`);
    console.log(`🏥  Health check → http://localhost:${PORT}/health`);
  });

  const shutdown = (signal) => {
    console.log(`\n⚠️   Received ${signal}. Shutting down gracefully…`);
    server.close(() => {
      console.log('🔒  HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('❌  Forced shutdown after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('❌  Unhandled Promise Rejection:', reason);
    server.close(() => process.exit(1));
  });
};

startServer();
