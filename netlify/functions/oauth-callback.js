// OAuth Callback Handler
// Exchanges authorization code for refresh token

const { google } = require('googleapis');

exports.handler = async function (event, context) {
  try {
    const OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    // Get authorization code from query params
    const code = event.queryStringParameters?.code;

    if (!code) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'text/html',
        },
        body: `
          <h1>❌ Error: No authorization code</h1>
          <p>Please start from /oauth-authorize endpoint</p>
        `
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      'https://relawanns.netlify.app/.netlify/functions/oauth-callback'
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'text/html',
        },
        body: `
          <h1>⚠️ Warning: No refresh token received</h1>
          <p>This might happen if you've authorized before. Try revoking access and authorizing again.</p>
          <p>Go to <a href="https://myaccount.google.com/permissions">Google Account Permissions</a> and remove "Relawanns Registration System", then try again.</p>
        `
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Success!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              max-width: 700px;
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
              color: #28a745;
              margin-top: 0;
            }
            .token-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 5px;
              border: 2px solid #dee2e6;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
              font-size: 12px;
            }
            .copy-btn {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin-top: 10px;
            }
            .copy-btn:hover {
              background: #0056b3;
            }
            .success {
              background: #d4edda;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #28a745;
              color: #155724;
            }
            .steps {
              background: #e3f2fd;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #2196f3;
            }
            ol {
              line-height: 1.8;
              margin: 10px 0;
            }
            code {
              background: #f8f9fa;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ Authorization Successful!</h1>
            
            <div class="success">
              <strong>🎉 Selamat!</strong> Anda telah berhasil authorize aplikasi. Sekarang tinggal langkah terakhir.
            </div>

            <h2>🔑 Refresh Token Anda:</h2>
            <div class="token-box" id="tokenBox">${refreshToken}</div>
            <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>

            <div class="steps">
              <strong>📝 Langkah Selanjutnya:</strong>
              <ol>
                <li><strong>Copy refresh token</strong> di atas (klik tombol "Copy Token")</li>
                <li>Buka <strong>Netlify Dashboard</strong> → Site "relawanns"</li>
                <li>Masuk ke <strong>Site Settings</strong> → <strong>Environment Variables</strong></li>
                <li>Tambahkan variabel baru:
                  <ul>
                    <li>Key: <code>GOOGLE_OAUTH_REFRESH_TOKEN</code></li>
                    <li>Value: <em>(paste token yang sudah di-copy)</em></li>
                  </ul>
                </li>
                <li>Klik <strong>Save</strong></li>
                <li>Tunggu Netlify auto-deploy (~1-2 menit)</li>
                <li><strong>Test registrasi!</strong> File sekarang akan upload ke Google Drive relawanns</li>
              </ol>
            </div>

            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              ⚠️ <strong>Penting:</strong> Jangan share refresh token ini ke siapa pun. Token ini memberikan akses penuh ke Google Drive & Sheets Anda.
            </p>
          </div>

          <script>
            function copyToken() {
              const tokenBox = document.getElementById('tokenBox');
              const textArea = document.createElement('textarea');
              textArea.value = tokenBox.textContent;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
              
              const btn = event.target;
              const originalText = btn.textContent;
              btn.textContent = '✅ Copied!';
              btn.style.background = '#28a745';
              
              setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#007bff';
              }, 2000);
            }
          </script>
        </body>
        </html>
      `
    };

  } catch (error) {
    console.error('Callback error:', error);
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
