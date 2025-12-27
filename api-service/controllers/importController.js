import { importQueue } from '../config/redis.js';

// Extract folder ID from various Google Drive URL formats
function extractFolderId(url) {
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// POST /api/import/google-drive
export const importFromGoogleDrive = async (req, res) => {
  try {
    const { folderUrl } = req.body;

    if (!folderUrl) {
      return res.status(400).json({
        success: false,
        error: 'Folder URL is required',
        message: 'Please provide a Google Drive folder URL'
      });
    }

    const folderId = extractFolderId(folderUrl);
    
    if (!folderId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google Drive URL',
        message: 'Unable to extract folder ID from the provided URL. Please use a valid Google Drive folder URL.'
      });
    }

    console.log(`📥 Import request received for folder: ${folderId}`);

    const job = await importQueue.add(
      'import-drive-folder',
      {
        folderId,
        source: 'google_drive',
        requestedAt: new Date().toISOString()
      },
      {
        jobId: `gdrive-${folderId}-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    );

    console.log(`✓ Job created with ID: ${job.id}`);

    res.status(202).json({
      success: true,
      message: 'Import job started successfully',
      data: {
        jobId: job.id,
        folderId,
        source: 'google_drive',
        status: 'queued'
      }
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start import',
      message: error.message
    });
  }
};

// Optional: Add Dropbox import for bonus
export const importFromDropbox = async (req, res) => {
  try {
    const { folderUrl } = req.body;

    if (!folderUrl) {
      return res.status(400).json({
        success: false,
        error: 'Folder URL is required'
      });
    }

    res.status(501).json({
      success: false,
      message: 'Dropbox import not implemented yet',
      note: 'This is a bonus feature - coming soon!'
    });

  } catch (error) {
    console.error('❌ Dropbox import error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start import',
      message: error.message
    });
  }
};
