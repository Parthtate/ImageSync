import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection with cloud support
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_PASSWORD ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Connection event handlers
connection.on('connect', () => {
  console.log('✓ Redis connected successfully');
});

connection.on('ready', () => {
  console.log('✓ Redis is ready');
});

connection.on('error', (err) => {
  console.error('✗ Redis connection error:', err.message);
});

// Create BullMQ Queue for image import jobs
const importQueue = new Queue('image-import', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      count: 500,
    },
  },
});

// Queue event handlers
importQueue.on('error', (err) => {
  console.error('✗ Queue error:', err);
});

export { importQueue, connection };
