const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Upload file stream to Supabase Storage
 * @param {Stream} fileStream - File stream from Google Drive
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {string} Public URL of uploaded file
 */
async function uploadToSupabase(fileStream, fileName, mimeType) {
  try {
    console.log(`⬆️  Uploading to Supabase: ${fileName}`);

    // Convert stream to buffer
    const chunks = [];

    return new Promise((resolve, reject) => {
      fileStream.on("data", (chunk) => chunks.push(chunk));

      fileStream.on("error", (error) => {
        console.error("❌ Stream error:", error);
        reject(error);
      });

      fileStream.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks);

          // Generate unique file path
          const timestamp = Date.now();
          const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
          const filePath = `imported/${timestamp}-${sanitizedName}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from("imported-images")
            .upload(filePath, buffer, {
              contentType: mimeType,
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.error("❌ Upload error:", error);
            throw error;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("imported-images").getPublicUrl(filePath);

          console.log(`✓ Uploaded successfully: ${publicUrl}`);
          resolve(publicUrl);
        } catch (err) {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Check if file already exists in storage
 * @param {string} filePath - File path in storage
 * @returns {boolean} True if exists
 */
async function fileExists(filePath) {
  try {
    const { data, error } = await supabase.storage
      .from("imported-images")
      .list("imported", {
        search: filePath,
      });

    return !error && data && data.length > 0;
  } catch (error) {
    console.error("Error checking file existence:", error);
    return false;
  }
}

module.exports = {
  uploadToSupabase,
  fileExists,
  supabase,
};
