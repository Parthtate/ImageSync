import "dotenv/config";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { listFilesInFolder, downloadFile } from "./config/googleDrive.js";
import { uploadToSupabase } from "./config/supabase.js";

// Initialize Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_PASSWORD ? {} : undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Test connections on startup
connection.on("connect", () => {
  console.log("Worker connected to Redis");
});

connection.on("error", (err) => {
  console.error("Redis error:", err.message);
});

pool.on("error", (err) => {
  console.error("Database error:", err.message);
});

/**
 * Process image import job
 */
const worker = new Worker(
  "image-import",
  async (job) => {
    const { folderId, source } = job.data;
    const jobId = job.id;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚀 Starting Job: ${jobId}`);
    console.log(`📁 Folder ID: ${folderId}`);
    console.log(`📊 Source: ${source}`);
    console.log(`${"=".repeat(60)}\n`);

    try {
      // Step 1: List all images in the folder
      await job.updateProgress(10);
      console.log("Step 1: Listing files from Google Drive...");

      const files = await listFilesInFolder(folderId);

      if (files.length === 0) {
        console.log("No images found in folder");
        return {
          success: true,
          message: "No images found in folder",
          total: 0,
          processed: 0,
          failed: 0,
          skipped: 0,
        };
      }

      console.log(`Found ${files.length} image(s)\n`);

      let processed = 0;
      let failed = 0;
      let skipped = 0;

      // Step 2: Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = 10 + Math.round((i / files.length) * 85);
        await job.updateProgress(progress);

        console.log(`\n[${i + 1}/${files.length}] Processing: ${file.name}`);

        try {
          // Check if already imported
          const existsQuery = await pool.query(
            "SELECT id FROM images WHERE google_drive_id = $1",
            [file.id]
          );

          if (existsQuery.rows.length > 0) {
            console.log(`Already imported, skipping...`);
            skipped++;
            continue;
          }

          // Download from Google Drive
          console.log(`Downloading from Google Drive...`);
          const fileStream = await downloadFile(file.id);

          // Upload to Supabase Storage
          console.log(`Uploading to Supabase Storage...`);
          const publicUrl = await uploadToSupabase(
            fileStream,
            file.name,
            file.mimeType
          );

          // Save metadata to database
          console.log(`Saving metadata to database...`);
          await pool.query(
            `INSERT INTO images (name, google_drive_id, size, mime_type, storage_path, source)
           VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              file.name,
              file.id,
              parseInt(file.size) || 0,
              file.mimeType,
              publicUrl,
              source,
            ]
          );

          processed++;
          console.log(`Successfully imported!`);
        } catch (error) {
          failed++;
          console.error(`Failed: ${error.message}`);

          // Continue with next file instead of stopping
          continue;
        }
      }

      // Step 3: Complete
      await job.updateProgress(100);

      const result = {
        success: true,
        message: `Import completed: ${processed} processed, ${failed} failed, ${skipped} skipped`,
        total: files.length,
        processed,
        failed,
        skipped,
      };

      console.log(`\n${"=".repeat(60)}`);
      console.log(`Job ${jobId} Completed`);
      console.log(
        `Results: ${processed} processed | ${failed} failed | ${skipped} skipped`
      );
      console.log(`${"=".repeat(60)}\n`);

      return result;
    } catch (error) {
      console.error(`Job ${jobId} Failed:`, error.message);
      console.error(`${"=".repeat(60)}\n`);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 images concurrently
    limiter: {
      max: 10,
      duration: 1000, // Max 10 jobs per second
    },
  }
);

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("\nSIGTERM received, closing worker...");
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received, closing worker...");
  await worker.close();
  await connection.quit();
  await pool.end();
  process.exit(0);
});

console.log("\nWorker Service Started");
console.log("Listening for jobs on queue: image-import");
console.log("Concurrency: 5 jobs at a time");
console.log("Waiting for jobs...\n");
