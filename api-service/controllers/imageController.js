import { pool } from '../config/database.js';
import { importQueue } from '../config/redis.js';
import { deleteFileFromStorage, checkFileExists } from '../config/supabase.js';

// GET /api/images
export const getAllImages = async (req, res) => {
  try {
    const { source, limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM images';
    let params = [];
    let paramCount = 0;

    if (source) {
      paramCount++;
      query += ` WHERE source = $${paramCount}`;
      params.push(source);
    }

    query += ' ORDER BY created_at DESC';

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(parseInt(limit));

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(parseInt(offset));

    const result = await pool.query(query, params);

    let countQuery = 'SELECT COUNT(*) as total FROM images';
    let countParams = [];
    
    if (source) {
      countQuery += ' WHERE source = $1';
      countParams.push(source);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        images: result.rows,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: offset + result.rows.length < total
        }
      }
    });

  } catch (error) {
    console.error('Fetch images error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch images',
      message: error.message
    });
  }
};

// GET /api/images/:id
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM images WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Fetch image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch image',
      message: error.message
    });
  }
};

// GET /api/jobs/:jobId
export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await importQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        message: `No job found with ID: ${jobId}`
      });
    }

    const state = await job.getState();
    const progress = job.progress || 0;
    const returnValue = job.returnvalue;

    res.json({
      success: true,
      data: {
        jobId: job.id,
        state,
        progress,
        data: job.data,
        result: returnValue,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
        failedReason: job.failedReason
      }
    });

  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job status',
      message: error.message
    });
  }
};

// GET /api/stats
export const getStats = async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM images');
    const total = parseInt(totalResult.rows[0].total);

    const sourceResult = await pool.query(`
      SELECT source, COUNT(*) as count 
      FROM images 
      GROUP BY source
    `);

    const sizeResult = await pool.query('SELECT SUM(size) as total_size FROM images');
    const totalSize = parseInt(sizeResult.rows[0].total_size || 0);

    const recentResult = await pool.query(`
      SELECT COUNT(*) as recent 
      FROM images 
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    const recentImports = parseInt(recentResult.rows[0].recent);

    res.json({
      success: true,
      data: {
        totalImages: total,
        totalSize: totalSize,
        recentImports24h: recentImports,
        bySource: sourceResult.rows.reduce((acc, row) => {
          acc[row.source] = parseInt(row.count);
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
};

// DELETE /api/images/:id
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get image details first
    const result = await pool.query('SELECT * FROM images WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Image not found'
      });
    }

    const image = result.rows[0];

    // 2. Delete from Supabase Storage
    // We attempt to delete even if verification fails, just to be sure
    if (image.storage_path) {
      await deleteFileFromStorage(image.storage_path);
    }

    // 3. Delete from Database
    await pool.query('DELETE FROM images WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      id
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete image',
      message: error.message
    });
  }
};

// POST /api/images/sync
export const syncImages = async (req, res) => {
  try {
    console.log('Starting gallery sync...');
    
    // 1. Get all images from DB
    const result = await pool.query('SELECT * FROM images');
    const images = result.rows;
    
    const removedIds = [];
    const errors = [];

    // 2. Verify each image
    // Process in batches to avoid overwhelming Supabase
    const BATCH_SIZE = 5;
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (img) => {
        try {
          const exists = await checkFileExists(img.storage_path);
          
          if (!exists) {
            console.log(`Found orphaned record: ${img.name} (ID: ${img.id})`);
            await pool.query('DELETE FROM images WHERE id = $1', [img.id]);
            removedIds.push(img.id);
          }
        } catch (err) {
          console.error(`Error checking image ${img.id}:`, err);
          errors.push({ id: img.id, error: err.message });
        }
      }));
    }

    res.json({
      success: true,
      message: `Sync complete. Removed ${removedIds.length} orphaned records.`,
      data: {
        totalChecked: images.length,
        removedCount: removedIds.length,
        removedIds,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync gallery',
      message: error.message
    });
  }
};
