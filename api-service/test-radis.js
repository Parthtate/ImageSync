require("dotenv").config();
const { Redis } = require("ioredis");

console.log("🧪 Testing Upstash Redis connection...\n");

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {},
});

redis.on("connect", () => {
  console.log("✅ Redis connected!");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
  process.exit(1);
});

redis.on("ready", async () => {
  console.log("✅ Redis is ready!\n");

  try {
    // Test 1: Set/Get
    console.log("Test 1: Set/Get");
    await redis.set("test:hello", "Hello from Upstash!");
    const value = await redis.get("test:hello");
    console.log("✓ Stored and retrieved:", value);

    // Test 2: Increment
    console.log("\nTest 2: Increment");
    await redis.set("test:counter", 0);
    await redis.incr("test:counter");
    await redis.incr("test:counter");
    const counter = await redis.get("test:counter");
    console.log("✓ Counter value:", counter);

    // Test 3: Expiry
    console.log("\nTest 3: TTL/Expiry");
    await redis.set("test:temp", "temporary", "EX", 10);
    const ttl = await redis.ttl("test:temp");
    console.log("✓ TTL (time to live):", ttl, "seconds");

    // Cleanup
    await redis.del("test:hello", "test:counter", "test:temp");
    console.log("\n✓ Cleanup complete");

    console.log("\n🎉 All tests passed! Redis is working perfectly.\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  } finally {
    await redis.quit();
  }
});
