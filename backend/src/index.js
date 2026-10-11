const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Ensure DB is initialized
const db = require('./db/database');

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const postRoutes = require('./routes/posts');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const inboxRoutes = require('./routes/inbox');
const notificationRoutes = require('./routes/notifications');

// Import scheduler
const scheduler = require('./services/scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Set db instance for routes that access req.app.get('db')
app.set('db', db);

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Expose db instance to routes via app.get('db')
app.set('db', db);

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Social Media Hub Backend is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🛡️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);

  // Start cron scheduler
  scheduler.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  scheduler.stop();
  db.close();
  server.close(() => {
    console.log('Server terminated.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  scheduler.stop();
  db.close();
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
