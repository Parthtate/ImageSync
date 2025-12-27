import { pool } from '../config/database.js';
import { importQueue } from '../config/redis.js';

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
    console.error('❌ Fetch images error:', error);
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
    console.error('❌ Fetch image error:', error);
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
    console.error('❌ Job status error:', error);
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
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      message: error.message
    });
  }
};
