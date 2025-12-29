import { google } from "googleapis";

// Initialize Google Drive API with API Key (for public folders)
const drive = google.drive({
  version: "v3",
  auth: process.env.GOOGLE_API_KEY,
});

/**
 * List all image files in a public Google Drive folder
 * @param {string} folderId - Google Drive folder ID
 * @returns {Array} Array of file objects
 */
async function listFilesInFolder(folderId) {
  try {
    console.log(`Listing files in folder: ${folderId}`);

    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
      fields:
        "nextPageToken, files(id, name, size, mimeType, webContentLink, thumbnailLink)",
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} image(s) in folder`);

    return files;
  } catch (error) {
    console.error("Error listing files:", error.message);

    if (error.code === 404) {
      throw new Error(
        "Folder not found. Make sure the folder is publicly accessible."
      );
    } else if (error.code === 403) {
      throw new Error(
        "Permission denied. Ensure the folder is shared publicly and API key is valid."
      );
    }

    throw error;
  }
}

/**
 * Download a file from Google Drive as a stream
 * @param {string} fileId - Google Drive file ID
 * @returns {Stream} File stream
 */
async function downloadFile(fileId) {
  try {
    console.log(`Downloading file: ${fileId}`);

    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "stream" }
    );

    return response.data;
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error.message);

    if (error.code === 404) {
      throw new Error("File not found or not accessible.");
    } else if (error.code === 403) {
      throw new Error(
        "Permission denied. File might not be publicly accessible."
      );
    }

    throw error;
  }
}

/**
 * Get file metadata
 * @param {string} fileId - Google Drive file ID
 * @returns {Object} File metadata
 */
async function getFileMetadata(fileId) {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: "id, name, size, mimeType, createdTime",
      supportsAllDrives: true,
    });

    return response.data;
  } catch (error) {
    console.error(`Error getting metadata for ${fileId}:`, error.message);
    throw error;
  }
}

export {
  listFilesInFolder,
  downloadFile,
  getFileMetadata,
};
