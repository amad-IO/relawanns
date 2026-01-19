// Netlify Function: Check Registration Status
// Queries Supabase database for real-time status

import postgres from 'postgres';

export default async function handler(req, res) {
  try {
    // Get DATABASE_URL from environment variable
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return res.status(500).json({
        success: false,
        error: 'Database connection not configured'
      });
    }

    // Connect to Supabase
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Query registration status from event_settings table
    const result = await sql`
      SELECT value 
      FROM event_settings 
      WHERE key = 'registration_status'
      LIMIT 1
    `;

    await sql.end();

    // Check if data exists
    if (!result || result.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          isOpen: false,
          message: 'Pendaftaran ditutup',
          description: 'Status pendaftaran tidak ditemukan'
        }
      });
    }

    const status = result[0].value;
    const isOpen = status === 'open';

    return res.status(200).json({
      success: true,
      data: {
        isOpen,
        message: isOpen ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup',
        description: 'Bergabung dengan Relawanns dan wujudkan perubahan nyata untuk Indonesia'
      }
    });

  } catch (error) {
    console.error('API Error:', error);

    // Return closed status on error (safe default)
    return res.status(200).json({
      success: true,
      data: {
        isOpen: false,
        message: 'Pendaftaran ditutup',
        description: 'Terjadi kesalahan saat mengecek status'
      }
    });
  }
}
