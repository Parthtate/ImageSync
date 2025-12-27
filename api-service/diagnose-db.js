import 'dotenv/config';
import { Pool } from 'pg';

console.log('🔍 Database Connection Diagnostics\n');
console.log('═══════════════════════════════════════════════════════════════');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 
  `✓ Set (${process.env.DATABASE_URL.substring(0, 20)}...)` : 
  '✗ NOT SET');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || '✗ NOT SET');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || '✗ NOT SET');

if (!process.env.DATABASE_URL) {
  console.error('\n❌ DATABASE_URL is not set in .env file!');
  process.exit(1);
}

// Parse DATABASE_URL
console.log('\n🔗 Connection String Parse:');
try {
  const url = new URL(process.env.DATABASE_URL);
  console.log('  Protocol:', url.protocol);
  console.log('  Host:', url.hostname);
  console.log('  Port:', url.port || '5432 (default)');
  console.log('  Database:', url.pathname.substring(1));
  console.log('  Username:', url.username);
  console.log('  Password:', url.password ? '✓ Set' : '✗ NOT SET');
  console.log('  SSL:', url.searchParams.has('sslmode') ? url.searchParams.get('sslmode') : 'default');
} catch (err) {
  console.error('  ✗ Invalid DATABASE_URL format:', err.message);
}

// Test connection with detailed error handling
console.log('\n🔌 Testing Connection...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 5,
  connectionTimeoutMillis: 10000,
  query_timeout: 5000,
});

async function testConnection() {
  const client = await pool.connect();
  try {
    console.log('  ✓ Connection acquired from pool');
    
    const result = await client.query('SELECT NOW(), version()');
    console.log('  ✓ Query executed successfully');
    console.log('  Server time:', result.rows[0].now);
    console.log('  PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    // Test table existence
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'images'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('  ✓ "images" table exists');
      
      // Count records
      const countResult = await client.query('SELECT COUNT(*) FROM images');
      console.log('  ✓ Records in images table:', countResult.rows[0].count);
    } else {
      console.log('  ⚠ "images" table does NOT exist - run schema.sql first');
    }
    
    console.log('\n✅ All connection tests passed!');
    return true;
  } catch (err) {
    console.error('\n❌ Connection test failed:');
    console.error('  Error type:', err.code || 'UNKNOWN');
    console.error('  Message:', err.message);
    console.error('  Details:', err.detail || 'N/A');
    return false;
  } finally {
    client.release();
  }
}

testConnection()
  .then(() => pool.end())
  .catch(err => {
    console.error('\n❌ Fatal error:', err.message);
    pool.end();
    process.exit(1);
  });
