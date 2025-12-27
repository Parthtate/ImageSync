import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { testConnection } from './config/database.js';
import { connection } from './config/redis.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Middleware ====================
// CORS Configuration - Allow Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://imagesync.vercel.app',
    'https://*.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ==================== Routes ====================
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Image Import System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      import: '/api/import/google-drive',
      images: '/api/images',
      jobs: '/api/jobs/:jobId',
      stats: '/api/stats'
    }
  });
});

// ==================== Error Handling ====================
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== Graceful Shutdown ====================
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  await connection.quit();
  process.exit(0);
});

// ==================== Start Server ====================
async function startServer() {
  try {
    console.log('🔌 Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    console.log('🔌 Connecting to Redis...');
    await new Promise((resolve, reject) => {
      if (connection.status === 'ready') {
        resolve();
      } else {
        connection.once('ready', resolve);
        connection.once('error', reject);
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n================================');
      console.log(`✅ API Service running on port ${PORT}`);
      console.log(`🌐 Railway URL: https://imagesync-api-production.up.railway.app`);
      console.log(`📚 API Docs: https://imagesync-api-production.up.railway.app/api`);
      console.log('================================\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
