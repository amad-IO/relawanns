// Netlify Function: Registration Handler
// Handles form submission, file upload, database storage, Google Sheets/Drive, and Telegram notification

const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy');
const { getOrCreateSheet, appendToSheet, uploadToDrive, getOrCreateFolder } = require('./utils/google');

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

    // Initialize Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Helper to upload file
    const uploadFile = async (file, folder = 'payment-proofs') => {
      if (!file) return null;

      const fileExt = file.filename.split('.').pop();
      const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('payment-proofs') // Using same bucket for simplicity
        .upload(fileName, file.buffer, {
          contentType: file.mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw new Error(`Upload failed: ${error.message}`);

      const { data: publicData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    };

    // Upload ONLY Payment Proof to Supabase (keeping as backup)
    const paymentProofUrl = await uploadFile(paymentProofFile, 'payment');

    // === GOOGLE WORKSPACE INTEGRATION ===
    // Generate sheet/folder name based on event
    const sheetFolderName = `${eventTitle} - ${eventDate}`;

    try {
      // 1. Create or get event-specific folder in Google Drive
      const eventFolderId = await getOrCreateFolder(sheetFolderName);

      // 2. Upload files to Google Drive
      const paymentDriveLink = await uploadToDrive(
        paymentProofFile.buffer,
        `payment_${name}_${Date.now()}.${paymentProofFile.filename.split('.').pop()}`,
        paymentProofFile.mimeType,
        eventFolderId
      );

      const tiktokDriveLink = tiktokProofFile ? await uploadToDrive(
        tiktokProofFile.buffer,
        `tiktok_${name}_${Date.now()}.${tiktokProofFile.filename.split('.').pop()}`,
        tiktokProofFile.mimeType,
        eventFolderId
      ) : 'Tidak ada';

      const instagramDriveLink = instagramProofFile ? await uploadToDrive(
        instagramProofFile.buffer,
        `instagram_${name}_${Date.now()}.${instagramProofFile.filename.split('.').pop()}`,
        instagramProofFile.mimeType,
        eventFolderId
      ) : 'Tidak ada';

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

    // Send Telegram notification
    if (BOT_TOKEN && CHAT_ID) {
      const FormData = require('form-data');

      try {
        const telegramMessage = `🆕 *PENDAFTAR BARU!*

No. Pendaftar: *${registrationNumber} / ${maxQuota}*
━━━━━━━━━━━━━━━━━
👤 *DATA DIRI*
Nama: ${name}
Email: ${email}
WA: ${phone}
Usia: ${age} th | Kota: ${city}
IG: [${instagramUsername}](https://instagram.com/${instagramUsername.replace('@', '')})
History: ${participationHistory || '-'}

👕 *ATRIBUT*
Ukuran Vest: *${vestSize}*

📎 *LAMPIRAN*
• [Bukti Bayar (Link)](${paymentProofUrl})
━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString('id-ID')}`;

        const chatIds = CHAT_ID.split(',').map(id => id.trim()).filter(id => id);

        for (const chatId of chatIds) {
          try {
            // 1. Send Main Message with Payment Proof
            await fetchWithRetry(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                photo: paymentProofUrl,
                caption: telegramMessage,
                parse_mode: 'Markdown'
              })
            });

          } catch (singleChatError) {
            console.error(`Failed to send to chat ${chatId}:`, singleChatError);
          }
        }
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }

      // Special Notification if Quota Full
      if (isQuotaFull) {
        // ... (existing quota logic omitted for brevity, logic remains same if I don't touch it, but I need to make sure I don't delete it inadvertently)
        // Actually I'm replacing until line 288, so I need to include the quota logic or end the replacement usage carefully.
        // Let's include the quota logic in the replacement content to be safe.
        try {
          const quotaMessage = `🚨 *KUOTA TERPENUHI!*\n\n` +
            `Pendaftaran otomatis DITUTUP sistem.\n` +
            `Total: ${newCount} / ${maxQuota}`;

          const chatIds = CHAT_ID.split(',').map(id => id.trim()).filter(id => id);
          for (const chatId of chatIds) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: quotaMessage,
                parse_mode: 'Markdown'
              })
            });
          }
        } catch (e) { console.error('Quota notify error', e); }
      }
    }

    return {
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
