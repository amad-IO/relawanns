// Enqueue API Endpoint - Add registration job to Redis queue
const { enqueueRegistration, getQueueStats } = require('./lib/queue');

/**
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { registrationId, files, eventTitle, eventDate } = req.body;

    // Validation
    if (!registrationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing registrationId'
      });
    }

    if (!files || !files.paymentProof || !files.tiktokProof || !files.instagramProof) {
      return res.status(400).json({
        success: false,
        error: 'Missing file information'
      });
    }

    console.log(`📋 Enqueueing job for registration #${registrationId}`);

    // Add job to Redis queue
    const jobId = await enqueueRegistration({
      registrationId,
      files,
      eventTitle: eventTitle || 'Event Relawanns',
      eventDate: eventDate || new Date().toISOString().split('T')[0]
    });

    // Get current queue stats
    const stats = await getQueueStats();

    return res.status(200).json({
      success: true,
      message: 'Pendaftaran berhasil! Data Anda sedang diproses di background.',
      jobId,
      queueStats: {
        pending: stats.pending,
        estimatedProcessingTime: stats.pending * 5 // Estimate 5s per job
      }
    });

  } catch (error) {
    console.error('❌ Error enqueueing job:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to queue registration job',
      message: error.message
    });
  }
};
