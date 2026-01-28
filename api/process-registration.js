// Vercel Serverless Function: Registration Processing
// Handles background tasks: Upload to Drive, Sync to Spreadsheet, Send Telegram, Cleanup Supabase

const { VercelRequest, VercelResponse } = require('@vercel/node');
const postgres = require('postgres');
const { createClient } = require('@supabase/supabase-js');
const {
  getOrCreateSheet,
  appendToSheet,
  uploadToDrive,
  getOrCreateFolder,
  extractFileName
} = require('./google-oauth');

// Environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BOT_TOKEN = process.env.BOT_RELAWANNS_TOKEN;
const CHAT_ID = process.env.NOTIFICATION_CHAT_ID;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { registrationData, files } = req.body;

    console.log('🚀 Registration processing started');
    console.log('📝 Registrant:', registrationData.name);
    console.log('📁 Files received:', Object.keys(files).length);

    // Validate required data
    if (!registrationData || !files) {
      return res.status(400).json({
        success: false,
        message: 'Missing registration data or files'
      });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get event details from database for folder/sheet naming
    const sql = postgres(DATABASE_URL, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    // Get event details from database - SQL execution handled by postgres lib
    const eventTitle = registrationData.eventTitle || 'Event Relawanns';
    const eventDate = registrationData.eventDate || '2026-01-01';
    const maxQuota = registrationData.maxQuota || 100;

    // ===== STEP 1: DOWNLOAD FILES FROM SUPABASE =====
    console.log('⬇️ Step 1: Downloading files from Supabase Storage...');

    const fetch = (await import('node-fetch')).default;

    const [paymentBuffer, tiktokBuffer, instagramBuffer] = await Promise.all([
      fetch(files.paymentProof.url).then(r => r.arrayBuffer()),
      fetch(files.tiktokProof.url).then(r => r.arrayBuffer()),
      fetch(files.instagramProof.url).then(r => r.arrayBuffer())
    ]);

    console.log('✅ All files downloaded');

    // ===== STEP 2: UPLOAD TO GOOGLE DRIVE (PARALLEL) =====
    console.log('☁️ Step 2: Uploading to Google Drive...');

    // Normalize date format
    let normalizedDate = eventDate;
    if (eventDate && eventDate.includes(',')) {
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

    // Truncate event title if too long
    const truncatedEventTitle = eventTitle.length > 25
      ? eventTitle.substring(0, 25) + '...'
      : eventTitle;

    const sheetFolderName = `${truncatedEventTitle} - ${normalizedDate}`.replace(/[/\\:*?"<>|]/g, '');
    console.log(`📋 Event folder name: "${sheetFolderName}"`);

    // Get first name for file naming
    const firstName = registrationData.name.trim().split(' ')[0];

    // Create folder structure
    const eventFolderId = await getOrCreateFolder(sheetFolderName);
    const paymentFolderId = await getOrCreateFolder('Bukti Pembayaran', eventFolderId);
    const sosmedFolderId = await getOrCreateFolder('Screenshot Sosmed', eventFolderId);

    // Upload all 3 files in parallel
    const [paymentUrl, tiktokUrl, instagramUrl] = await Promise.all([
      uploadToDrive(
        paymentBuffer,
        `payment_${registrationData.name}_${Date.now()}.${files.paymentProof.filename.split('.').pop()}`,
        'image/jpeg',
        paymentFolderId
      ),
      uploadToDrive(
        tiktokBuffer,
        `tiktok_${firstName}_${Date.now()}.${files.tiktokProof.filename.split('.').pop()}`,
        'image/jpeg',
        sosmedFolderId
      ),
      uploadToDrive(
        instagramBuffer,
        `instagram_${firstName}_${Date.now()}.${files.instagramProof.filename.split('.').pop()}`,
        'image/jpeg',
        sosmedFolderId
      )
    ]);

    console.log('✅ All files uploaded to Google Drive');

    // ===== STEP 3: UPDATE DATABASE WITH DRIVE URLS =====
    console.log('💾 Step 3: Updating database with Drive URLs...');

    await sql`
      UPDATE registrations
      SET 
        payment_proof_url = ${paymentUrl},
        tiktok_proof_url = ${tiktokUrl},
        instagram_proof_url = ${instagramUrl}
      WHERE id = ${registrationData.id}
    `;

    console.log('✅ Database updated');

    // ===== STEP 4: INSERT TO GOOGLE SPREADSHEET =====
    console.log('📊 Step 4: Inserting to Google Spreadsheet...');

    // Create or get sheet
    await getOrCreateSheet(sheetFolderName);

    // Prepare row data
    const rowData = [
      registrationData.name,
      registrationData.email,
      registrationData.phone,
      registrationData.age,
      registrationData.city,
      registrationData.instagramUsername,
      registrationData.participationHistory || 'Belum Pernah',
      registrationData.vestSize,
      paymentUrl,
      tiktokUrl,
      instagramUrl
    ];

    await appendToSheet(sheetFolderName, rowData);
    console.log('✅ Data inserted to Spreadsheet');

    // ===== STEP 5: DELETE FILES FROM SUPABASE STORAGE =====
    console.log('🗑️ Step 5: Deleting files from Supabase Storage...');

    const filesToDelete = [
      extractFileName(files.paymentProof.url),
      extractFileName(files.tiktokProof.url),
      extractFileName(files.instagramProof.url)
    ];

    const { error: deleteError } = await supabase.storage
      .from('registrations')
      .remove(filesToDelete);

    if (deleteError) {
      console.warn('⚠️ Failed to delete some files from Supabase:', deleteError);
    } else {
      console.log('✅ Files deleted from Supabase Storage');
    }

    // ===== STEP 6: SEND TELEGRAM NOTIFICATION (ASYNC) =====
    console.log('📱 Step 6: Sending Telegram notification...');

    sendTelegramNotification({
      name: registrationData.name,
      email: registrationData.email,
      phone: registrationData.phone,
      age: registrationData.age,
      city: registrationData.city,
      instagramUsername: registrationData.instagramUsername,
      participationHistory: registrationData.participationHistory,
      vestSize: registrationData.vestSize,
      paymentProofUrl: paymentUrl,
      registrationNumber: registrationData.registrationNumber || 0,
      maxQuota
    }).catch(err => {
      console.error('❌ Telegram notification failed:', err);
    });

    // Close DB connection
    await sql.end();

    console.log('🎉 Registration processing completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Registration processed successfully',
      data: {
        paymentUrl,
        tiktokUrl,
        instagramUrl
      }
    });

  } catch (error) {
    console.error('❌ Error processing registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===== TELEGRAM NOTIFICATION HELPER =====

async function sendTelegramNotification(data, maxRetries = 3) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('⚠️ Telegram credentials not configured');
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
  const fetch = (await import('node-fetch')).default;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.all(
        chatIds.map(chatId =>
          fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: telegramMessage,
              parse_mode: 'Markdown',
              disable_web_page_preview: false
            })
          })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              console.log(`✅ Telegram sent to chat ${chatId}`);
            })
        )
      );

      console.log(`✅ All Telegram notifications sent (attempt ${attempt}/${maxRetries})`);
      return;

    } catch (error) {
      console.error(`⚠️ Telegram attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt === maxRetries) {
        console.error(`❌ All ${maxRetries} Telegram attempts failed`);
        return;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffDelay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}
