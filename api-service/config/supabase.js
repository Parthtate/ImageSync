import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const BUCKET_NAME = "imported-images";

/**
 * Delete a file from Supabase Storage
 * @param {string} publicUrl - Public URL of the file
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteFileFromStorage(publicUrl) {
  try {
    // Extract path from public URL
    // Format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlParts = publicUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];
    
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error("❌ Delete storage error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete file helper error:", error);
    return false;
  }
}

/**
 * Check if a file exists in Supabase Storage
 * @param {string} publicUrl - Public URL of the file
 * @returns {Promise<boolean>} True if exists
 */
export async function checkFileExists(publicUrl) {
  try {
    const urlParts = publicUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length < 2) return false;
    
    const filePath = urlParts[1];
    // filePath is like "imported/123-filename.jpg"
    // We want to list the folder "imported" and search for the filename
    
    const pathParts = filePath.split('/');
    const fileName = pathParts.pop();
    const folderPath = pathParts.join('/'); // e.g., "imported"

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        search: fileName,
      });

    if (error) {
        console.error("Check exists error:", error);
        return false;
    }

    // Exact match check
    return data && data.some(f => f.name === fileName);
  } catch (error) {
    console.error("Check file exists helper error:", error);
    return false;
  }
}

export default supabase;
