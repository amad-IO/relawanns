// Netlify Function: Get Event Details
// Queries Supabase database for all event information

const postgres = require('postgres');

exports.handler = async function (event, context) {
  try {
    // Get DATABASE_URL from environment variable
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Database connection not configured'
        })
      };
    }

    // Connect to Supabase
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Query all event settings
    const result = await sql`
      SELECT key, value 
      FROM event_settings 
      WHERE key IN (
        'event_title',
        'event_location_name',
        'event_location_maps',
        'event_date',
        'event_description',
        'max_quota',
        'current_registrants',
        'event_category',
        'requirements'
      )
    `;

    await sql.end();

    // Transform array to object
    const eventData = {};
    result.forEach(row => {
      eventData[row.key] = row.value;
    });

    // Parse requirements JSON if exists
    if (eventData.requirements) {
      try {
        eventData.requirements = JSON.parse(eventData.requirements);
      } catch (e) {
        eventData.requirements = [];
      }
    }

    // Format response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          title: eventData.event_title || 'Event Relawanns',
          location: eventData.event_location_name || 'Belum diset',
          locationMaps: eventData.event_location_maps || '#',
          date: eventData.event_date || 'Belum diset',
          description: eventData.event_description || 'Deskripsi belum tersedia',
          maxQuota: parseInt(eventData.max_quota) || 0,
          currentRegistrants: parseInt(eventData.current_registrants) || 0,
          category: eventData.event_category || 'volunteer',
          requirements: eventData.requirements || []
        }
      })
    };

  } catch (error) {
    console.error('API Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch event details',
        message: error.message
      })
    };
  }
};
