const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🏨 Welcome to Hotel Room Booking System API',
    version: '1.0.0',
    endpoints: {
      health:   'GET  /health',
      auth:     'POST /api/auth/register | POST /api/auth/login',
      rooms:    'GET  /api/rooms | GET /api/rooms/:id',
      bookings: 'GET  /api/bookings | POST /api/bookings',
    },
    docs: 'Use the Postman collections in /backend/postman/ for full API reference.',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Room Booking API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

const roomRoutes = require('./routes/roomRoutes');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

app.use('/api/rooms', roomRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

module.exports = app;
