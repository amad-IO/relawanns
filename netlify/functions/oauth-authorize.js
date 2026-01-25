// OAuth Authorization Endpoint
// One-time endpoint for admin to authorize application

const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/html',
        },
        body: `
          <h1>❌ Error: Missing OAuth Credentials</h1>
          <p>Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in Netlify environment variables.</p>
          <p>Check the implementation plan for setup instructions.</p>
        `
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      'https://relawanns.netlify.app/.netlify/functions/oauth-callback'
    );

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required to get refresh token
      scope: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorize Relawanns App</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .card {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #333;
              margin-top: 0;
            }
            .button {
              display: inline-block;
              background: #4285f4;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 5px;
              font-weight: 500;
              margin-top: 20px;
            }
            .button:hover {
              background: #357ae8;
            }
            .info {
              background: #e3f2fd;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #2196f3;
            }
            .warning {
              background: #fff3cd;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #ffc107;
            }
            ol {
              line-height: 1.8;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🔐 Authorize Relawanns App</h1>
            
            <div class="warning">
              <strong>⚠️ Penting:</strong> Ini adalah setup <strong>sekali saja</strong>. Setelah authorize, sistem akan jalan otomatis selamanya.
            </div>

            <div class="info">
              <strong>📋 Yang akan terjadi:</strong>
              <ol>
                <li>Klik tombol "Authorize" di bawah</li>
                <li>Login dengan akun Gmail <strong>relawanns</strong></li>
                <li>Klik "<strong>Izinkan</strong>" untuk memberikan akses ke Google Drive & Sheets</li>
                <li>Copy <strong>Refresh Token</strong> yang muncul</li>
                <li>Paste token ke Netlify Environment Variables</li>
              </ol>
            </div>

            <a href="${authUrl}" class="button">🚀 Authorize with Google</a>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              Setelah selesai, file upload akan menggunakan quota dan Drive milik akun relawanns.
            </p>
          </div>
        </body>
        </html>
      `
    };

  } catch (error) {
    console.error('Authorization error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <h1>❌ Error</h1>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      `
    };
  }
};
