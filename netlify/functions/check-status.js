// Netlify Function for Check Registration Status
// Simple MVP: Always return open status

exports.handler = async (event) => {
  // Only accept GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed',
      }),
    };
  }

  try {
    // MVP: Hardcoded status
    // TODO: Integrate with database for dynamic control via Telegram Bot Admin
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          isOpen: true,
          message: 'Pendaftaran sedang dibuka',
          description: 'Bergabung dengan Relawanns dan wujudkan perubahan nyata untuk Indonesia',
        },
      }),
    };
  } catch (error) {
    console.error('Status check error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Terjadi kesalahan server',
      }),
    };
  }
};
