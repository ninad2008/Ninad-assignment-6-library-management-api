require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Configurations
const { getDb, getIsMock } = require('./src/config/firebase');
const { setupSwagger } = require('./src/config/swagger');

// Middlewares
const { requestLogger } = require('./src/middleware/logger');
const { apiRateLimiter } = require('./src/middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./src/middleware/errorHandler');

// Routes
const authRoutes = require('./src/routes/authRoutes');
const bookRoutes = require('./src/routes/bookRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow Swagger UI inline styles and scripts
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use(requestLogger);

// Global Rate Limiting for API routes
app.use('/api', apiRateLimiter);

// Swagger Documentation UI
setupSwagger(app);

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Library Management API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      users: '/api/users',
      transactions: '/api/transactions'
    }
  });
});

app.get('/health', async (req, res) => {
  try {
    const db = await getDb();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: getIsMock() ? 'In-Memory Firestore Mock' : 'Firebase Firestore Cloud',
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if not imported by test runner
if (require.main === module) {
  app.listen(PORT, async () => {
    // Ensure DB connection is initialized
    await getDb();
    console.log(`====================================================`);
    console.log(`🚀 Library Management API running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
    console.log(`====================================================`);
  });
}

module.exports = app;
