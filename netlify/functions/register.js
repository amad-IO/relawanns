// Netlify Function: Registration Handler
// Handles form submission, file upload, database storage, Google Sheets/Drive (OAuth), and Telegram notification

const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy');
const { getOrCreateSheet, appendToSheet, uploadToDrive, getOrCreateFolder } = require('./utils/oauth-google');

exports.handler = async function (event, context) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: 'Method not allowed' })
    };
  }

  try {
    // Environment variables
    const DATABASE_URL = process.env.DATABASE_URL;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BOT_TOKEN = process.env.BOT_RELAWANNS_TOKEN;
    const CHAT_ID = process.env.NOTIFICATION_CHAT_ID;

    if (!DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Parse multipart form data with busboy
    const formData = await new Promise((resolve, reject) => {
      const fields = {};
      const files = {};

      const busboy = Busboy({
        headers: {
          'content-type': event.headers['content-type'] || event.headers['Content-Type']
        }
      });

      busboy.on('file', (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        const chunks = [];

        file.on('data', (data) => chunks.push(data));
        file.on('end', () => {
          files[fieldname] = {
            buffer: Buffer.concat(chunks),
            filename: filename,
            mimeType: mimeType
          };
        });
      });

      busboy.on('field', (fieldname, value) => {
        fields[fieldname] = value;
      });

      busboy.on('finish', () => resolve({ fields, files }));
      busboy.on('error', reject);

      // Netlify provides body as base64
      const bodyBuffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
      busboy.write(bodyBuffer);
      busboy.end();
    });

    // Extract form fields
    const name = formData.fields.name;
    const email = formData.fields.email;
    const phone = formData.fields.phone;
    const age = formData.fields.age;
    const city = formData.fields.city;

    // New Fields
    const participationHistory = formData.fields.participationHistory;
    const vestSize = formData.fields.vestSize;
    const instagramUsername = formData.fields.instagramUsername;

    const paymentProofFile = formData.files.paymentProof;
    const tiktokProofFile = formData.files.tiktokProof;
    const instagramProofFile = formData.files.instagramProof;

    // Validate required fields
    if (!name || !email || !phone || !age || !city || !paymentProofFile || !vestSize || !instagramUsername) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Semua field wajib diisi (termasuk bukti pembayaran, vest, dan instagram)'
        })
      };
    }

    // Connect to database
    const sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Get current registration number, max quota, and event details
    const [registrationData] = await sql`
      SELECT 
        COALESCE(MAX(registration_number), 0) + 1 as next_number,
        (SELECT value::int FROM event_settings WHERE key = 'max_quota') as max_quota,
        (SELECT value::int FROM event_settings WHERE key = 'current_registrants') as current_count,
        (SELECT value FROM event_settings WHERE key = 'event_title') as event_title,
        (SELECT value FROM event_settings WHERE key = 'event_date') as event_date
      FROM registrations
    `;

    const registrationNumber = registrationData.next_number;
    const maxQuota = registrationData.max_quota || 0;
    const currentCount = registrationData.current_count || 0;
    const eventTitle = registrationData.event_title || 'Event Relawanns';
    const eventDate = registrationData.event_date || '2026-01-01';

    // Check if registration is full
    if (currentCount >= maxQuota) {
      await sql.end();
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Maaf, pendaftaran sudah penuh'
        })
      };
    }

    // Initialize Supabase (still used for other data operations)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ❌ REMOVED: Payment proof upload to Supabase (redundant - already uploaded to Google Drive)
    // This saves 2-3 seconds upload time! 🚀


    // === HELPER FUNCTIONS FOR NAME TRUNCATION ===

    // Truncate event title if too long (max 25 chars for event name part)
    const truncateEventTitle = (title, maxLength = 25) => {
      if (title.length <= maxLength) return title;
      return title.substring(0, maxLength) + '...';
    };

    // Extract first name from full name (for file naming)
    const getFirstName = (fullName) => {
      return fullName.trim().split(' ')[0];
    };

    // === GOOGLE WORKSPACE INTEGRATION ===
    // Declare variables outside try block so they're accessible for database insert
    let paymentProofUrl = null;
    let tiktokDriveLink = 'Tidak ada';
    let instagramDriveLink = 'Tidak ada';
    let paymentDriveLink = null;

    // Generate sheet/folder name based on event
    // Normalize date format if it's in Indonesian long format
    let normalizedDate = eventDate;
    if (eventDate && eventDate.includes(',')) {
      // Convert "Minggu, 15 Maret 2026" to "15 Mar 2026"
      const dateMatch = eventDate.match(/(\d+)\s+(\w+)\s+(\d{4})/);
      if (dateMatch) {
        const monthMap = {
          'Januari': 'Jan', 'Februari': 'Feb', 'Maret': 'Mar',
          'April': 'Apr', 'Mei': 'May', 'Juni': 'Jun',
          'Juli': 'Jul', 'Agustus': 'Aug', 'September': 'Sep',
          'Oktober': 'Okt', 'November': 'Nov', 'Desember': 'Des'
        };
        normalizedDate = `${dateMatch[1]} ${monthMap[dateMatch[2]] || dateMatch[2]} ${dateMatch[3]}`;
      }
    }

    // Truncate event title and sanitize name
    const truncatedEventTitle = truncateEventTitle(eventTitle);
    const sheetFolderName = `${truncatedEventTitle} - ${normalizedDate}`.replace(/[/\\:*?"<>|]/g, '');
    console.log(`📋 Sheet/Folder name: "${sheetFolderName}"`);

    // Get first name for file naming (to avoid long file names)
    const firstName = getFirstName(name);


    try {
      // 1. Create or get event-specific folder in Google Drive
      const eventFolderId = await getOrCreateFolder(sheetFolderName);

      // 2. Create subfolders for better organization
      const paymentFolderId = await getOrCreateFolder('Bukti Pembayaran', eventFolderId);
      const sosmedFolderId = await getOrCreateFolder('Screenshot Sosmed', eventFolderId);

      // 3. 🚀 PARALLEL UPLOAD: Upload all 3 files to Drive SIMULTANEOUSLY
      // This saves 4-6 seconds by running uploads in parallel instead of sequential!
      console.log('🚀 Starting parallel file uploads to Google Drive...');

      [paymentProofUrl, tiktokDriveLink, instagramDriveLink] = await Promise.all([
        // Upload payment proof (WAJIB - full name for clarity)
        uploadToDrive(
          paymentProofFile.buffer,
          `payment_${name}_${Date.now()}.${paymentProofFile.filename.split('.').pop()}`,
          paymentProofFile.mimeType,
          paymentFolderId
        ),

        // Upload TikTok screenshot (WAJIB - first name only)
        tiktokProofFile ? uploadToDrive(
          tiktokProofFile.buffer,
          `tiktok_${firstName}_${Date.now()}.${tiktokProofFile.filename.split('.').pop()}`,
          tiktokProofFile.mimeType,
          sosmedFolderId
        ) : Promise.resolve('Tidak ada'),

        // Upload Instagram screenshot (WAJIB - first name only)
        instagramProofFile ? uploadToDrive(
          instagramProofFile.buffer,
          `instagram_${firstName}_${Date.now()}.${instagramProofFile.filename.split('.').pop()}`,
          instagramProofFile.mimeType,
          sosmedFolderId
        ) : Promise.resolve('Tidak ada')
      ]);

      console.log('✅ All files uploaded to Google Drive successfully!');

      // Alias for compatibility with existing code
      paymentDriveLink = paymentProofUrl;

      // 3. Create or get the sheet for this event
      await getOrCreateSheet(sheetFolderName);

      // 4. Append data to Google Sheets
      const rowData = [
        name,
        email,
        phone,
        age,
        city,
        instagramUsername,
        participationHistory || 'Belum Pernah',
        vestSize,
        paymentDriveLink,
        tiktokDriveLink,
        instagramDriveLink
      ];

      await appendToSheet(sheetFolderName, rowData);
      console.log(`✅ Data written to Google Sheet: ${sheetFolderName}`);

    } catch (googleError) {
      console.error('❌ Google Workspace Integration FAILED:', googleError);
      console.error('Error details:', {
        message: googleError.message,
        stack: googleError.stack,
        envVarsSet: {
          GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID,
          GOOGLE_DRIVE_FOLDER_ID: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
          GOOGLE_CREDENTIALS_JSON: !!process.env.GOOGLE_CREDENTIALS_JSON,
        }
      });
      // Continue execution even if Google integration fails (PostgreSQL is still saved)
    }
    // === END GOOGLE WORKSPACE INTEGRATION ===

    // Insert registration data
    // tiktok_proof_url and instagram_proof_url are set to NULL as requested
    await sql`
      INSERT INTO registrations (
        name, email, phone, age, city, 
        payment_proof_url, registration_number,
        participation_history, vest_size, instagram_username,
        tiktok_proof_url, instagram_proof_url
      ) VALUES (
        ${name}, ${email}, ${phone}, ${parseInt(age)}, ${city}, 
        ${paymentProofUrl}, ${registrationNumber},
        ${participationHistory || 'Belum Pernah'}, ${vestSize}, ${instagramUsername},
        NULL, NULL
      )
    `;

    // Update current_registrants
    await sql`
      UPDATE event_settings 
      SET value = ${(currentCount + 1).toString()}
      WHERE key = 'current_registrants'
    `;

    // CHECK QUOTA & AUTO-CLOSE
    const newCount = currentCount + 1;
    let isQuotaFull = false;

    if (newCount >= maxQuota) {
      isQuotaFull = true;
      await sql`
        UPDATE event_settings 
        SET value = 'closed'
        WHERE key = 'registration_status'
      `;
    }

    await sql.end();

    // === PREPARE SUCCESS RESPONSE (return to user immediately) ===
    const successResponse = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        data: {
          registration_number: registrationNumber,
          name: name
        }
      })
    };

    // === SEND TELEGRAM NOTIFICATIONS IN BACKGROUND (non-blocking) ===
    // Don't await! Let it run asynchronously so user gets immediate response
    console.log('🚀 Sending Telegram notifications in background...');

    sendTelegramNotificationAsync({
      name,
      email,
      phone,
      age: age.toString(),
      city,
      instagramUsername,
      participationHistory,
      vestSize,
      paymentProofUrl,
      registrationNumber,
      maxQuota
    }).catch(error => {
      // Log error but don't fail the request (user already got success response)
      console.error('🔥 Background Telegram notification failed:', error);
      // TODO Phase 2: Log to database for manual retry
    });

    // Send quota full notification if needed (also async, non-blocking)
    if (isQuotaFull) {
      console.log('🚨 Quota full - sending alert notification...');
      sendQuotaFullNotification({
        newCount,
        maxQuota
      }).catch(error => {
        console.error('🔥 Quota notification failed:', error);
      });
    }

    // === RETURN SUCCESS TO USER IMMEDIATELY ===
    // User gets response in ~2.5s instead of waiting for Telegram (~9.5s)
    console.log(`✅ Registration response sent to user (${registrationNumber}/${maxQuota})`);
    return successResponse;

  } catch (error) {
    console.error('Registration error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Terjadi kesalahan saat mendaftar. Silakan coba lagi.'
      })
    };
  }
};

// Start Retry Helper
async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);

    // If 429 (Too Many Requests) or Server Error, throw to trigger retry
    if (!response.ok && (response.status === 429 || response.status >= 500)) {
      const errorBody = await response.text();
      throw new Error(`HTTP Error ${response.status}: ${errorBody}`);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`[Smart Retry] Request failed. Retrying in ${backoff}ms... (${retries} attempts left). Reason: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2); // Exponential backoff
    }
    throw error;
  }
}

/**
 * Send Telegram notification asynchronously with retry logic
 * This function runs in the background and doesn't block the user response
 * @param {Object} data - Registration data
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 */
async function sendTelegramNotificationAsync(data, maxRetries = 3) {
  const BOT_TOKEN = process.env.BOT_RELAWANNS_TOKEN;
  const CHAT_ID = process.env.NOTIFICATION_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️ Telegram credentials not configured - skipping notification');
    return;
  }

  const telegramMessage = `🆕 *PENDAFTAR BARU!*

No. Pendaftar: *${data.registrationNumber} / ${data.maxQuota}*
━━━━━━━━━━━━━━━━━
👤 *DATA DIRI*
Nama: ${data.name}
Email: ${data.email}
WA: ${data.phone}
Usia: ${data.age} th | Kota: ${data.city}
IG: [${data.instagramUsername}](https://instagram.com/${data.instagramUsername.replace('@', '')})
History: ${data.participationHistory || '-'}

👕 *ATRIBUT*
Ukuran Vest: *${data.vestSize}*

📎 *LAMPIRAN*
• [Bukti Bayar (Link)](${data.paymentProofUrl})
━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString('id-ID')}`;

  const chatIds = CHAT_ID.split(',').map(id => id.trim()).filter(id => id);

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Send to all chat IDs in parallel for speed
      await Promise.all(
        chatIds.map(chatId =>
          fetchWithRetry(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: telegramMessage,
              parse_mode: 'Markdown',
              disable_web_page_preview: false
            })
          })
            .then(() => console.log(`✅ Telegram notification sent to chat ${chatId} (attempt ${attempt})`))
            .catch(err => {
              console.error(`❌ Failed to send to chat ${chatId}:`, err.message);
              throw err; // Propagate to trigger retry
            })
        )
      );

      console.log(`✅ All Telegram notifications sent successfully (attempt ${attempt}/${maxRetries})`);
      return; // Success! Exit retry loop

    } catch (error) {
      console.error(`⚠️ Telegram notification attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} Telegram notification attempts failed. Giving up.`);
        // TODO Phase 2: Log to database for manual retry
        return;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffDelay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Send quota full notification to admin (async)
 * @param {Object} data - Quota data (newCount, maxQuota)
 */
async function sendQuotaFullNotification(data) {
  const BOT_TOKEN = process.env.BOT_RELAWANNS_TOKEN;
  const CHAT_ID = process.env.NOTIFICATION_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️ Telegram credentials not configured - skipping quota notification');
    return;
  }

  try {
    const quotaMessage = `🚨 *KUOTA TERPENUHI!*\n\n` +
      `Pendaftaran otomatis DITUTUP sistem.\n` +
      `Total: ${data.newCount} / ${data.maxQuota}`;

    const chatIds = CHAT_ID.split(',').map(id => id.trim()).filter(id => id);

    // Send to all chats in parallel
    await Promise.all(
      chatIds.map(chatId =>
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: quotaMessage,
            parse_mode: 'Markdown'
          })
        })
          .then(res => {
            if (!res.ok) throw new Error(`Chat ${chatId}: ${res.statusText}`);
            console.log(`✅ Quota notification sent to chat ${chatId}`);
          })
          .catch(err => {
            console.error(`❌ Failed to send quota notification to ${chatId}:`, err);
          })
      )
    );

    console.log('✅ Quota full notifications sent');
  } catch (error) {
    console.error('❌ Quota notification failed:', error);
  }
}
