// Netlify Function: Registration Handler
// Handles form submission, file upload, database storage, and Telegram notification

const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const multiparty = require('multiparty');

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

    // Parse multipart form data
    const form = new multiparty.Form();
    const formData = await new Promise((resolve, reject) => {
      form.parse(event, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    // Extract form fields
    const name = formData.fields.name?.[0];
    const email = formData.fields.email?.[0];
    const phone = formData.fields.phone?.[0];
    const age = formData.fields.age?.[0];
    const city = formData.fields.city?.[0];
    const paymentProofFile = formData.files.paymentProof?.[0];

    // Validate required fields
    if (!name || !email || !phone || !age || !city || !paymentProofFile) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Semua field harus diisi termasuk bukti pembayaran'
        })
      };
    }

    // Connect to database
    const sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Get current registration number and max quota
    const [registrationData] = await sql`
      SELECT 
        COALESCE(MAX(registration_number), 0) + 1 as next_number,
        (SELECT value::int FROM event_settings WHERE key = 'max_quota') as max_quota,
        (SELECT value::int FROM event_settings WHERE key = 'current_registrants') as current_count
    `;

    const registrationNumber = registrationData.next_number;
    const maxQuota = registrationData.max_quota || 0;
    const currentCount = registrationData.current_count || 0;

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

    // Upload file to Supabase Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read file
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(paymentProofFile.path);
    const fileExt = paymentProofFile.originalFilename.split('.').pop();
    const fileName = `payment_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, fileBuffer, {
        contentType: paymentProofFile.headers['content-type'],
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      await sql.end();
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    const paymentProofUrl = publicData.publicUrl;

    // Insert registration data
    await sql`
      INSERT INTO registrations (
        name, email, phone, age, city, payment_proof_url, registration_number
      ) VALUES (
        ${name}, ${email}, ${phone}, ${parseInt(age)}, ${city}, ${paymentProofUrl}, ${registrationNumber}
      )
    `;

    // Update current_registrants
    await sql`
      UPDATE event_settings 
      SET value = ${(currentCount + 1).toString()}
      WHERE key = 'current_registrants'
    `;

    await sql.end();

    // Send Telegram notification
    if (BOT_TOKEN && CHAT_ID) {
      try {
        const telegramMessage = `🆕 *PENDAFTAR BARU!*

No. Pendaftar: *${registrationNumber} / ${maxQuota}*
━━━━━━━━━━━━━━━━━
👤 Nama: ${name}
📧 Email: ${email}
📱 WhatsApp: ${phone}
🎂 Usia: ${age} tahun
🏙️ Kota: ${city}
━━━━━━━━━━━━━━━━━
📅 Waktu: ${new Date().toLocaleString('id-ID')}`;

        // Support multiple chat IDs (comma-separated)
        // Format: "8278108288,1234567890,9876543210"
        const chatIds = CHAT_ID.split(',').map(id => id.trim()).filter(id => id);

        // Send to each chat ID
        for (const chatId of chatIds) {
          try {
            // Send message
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: telegramMessage,
                parse_mode: 'Markdown'
              })
            });

            // Send photo
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                photo: paymentProofUrl,
                caption: '💳 Bukti Transfer'
              })
            });
          } catch (singleChatError) {
            console.error(`Failed to send to chat ${chatId}:`, singleChatError);
            // Continue sending to other chats even if one fails
          }
        }
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
        // Don't fail the registration if Telegram fails
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
