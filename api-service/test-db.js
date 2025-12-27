require('dotenv').config();
const { pool, testConnection } = require('./config/database');

async function testDatabase() {
  console.log('🧪 Testing database connection...\n');

  // Test 1: Connection
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Connection failed');
    process.exit(1);
  }

  // Test 2: Check if table exists
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'images'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Table "images" exists');
    } else {
      console.log('✗ Table "images" does not exist');
    }
  } catch (error) {
    console.error('✗ Error checking table:', error.message);
  }

  // Test 3: Count records
  try {
    const result = await pool.query('SELECT COUNT(*) FROM images');
    console.log(`✓ Total images in database: ${result.rows[0].count}`);
  } catch (error) {
    console.error('✗ Error counting records:', error.message);
  }

  // Test 4: Test insert (optional)
  try {
    const testData = {
      name: 'connection-test.jpg',
      google_drive_id: `test-${Date.now()}`,
      size: 1024,
      mime_type: 'image/jpeg',
      storage_path: 'https://example.com/test.jpg',
      source: 'test'
    };

    const insertResult = await pool.query(
      `INSERT INTO images (name, google_drive_id, size, mime_type, storage_path, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [testData.name, testData.google_drive_id, testData.size, testData.mime_type, testData.storage_path, testData.source]
    );

    console.log(`✓ Test insert successful, ID: ${insertResult.rows[0].id}`);

    // Clean up test data
    await pool.query('DELETE FROM images WHERE source = $1', ['test']);
    console.log('✓ Test data cleaned up');

  } catch (error) {
    console.error('✗ Error with test insert:', error.message);
  }

  await pool.end();
  console.log('\n✅ Database tests complete!');
}

testDatabase();
