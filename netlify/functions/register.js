// Netlify Function for Registration
// Handles form submission + file upload + Telegram notification

const formidable = require('formidable');
const fs = require('fs');
const https = require('https');

// Sanitize input to prevent XSS and SQL injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  let sanitized = input;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove SQL injection patterns
  sanitized = sanitized.replace(/(\bSELECT\b.*\bFROM\b)/gi, '');
  sanitized = sanitized.replace(/(\bINSERT\b.*\bINTO\b)/gi, '');
  sanitized = sanitized.replace(/(\bUPDATE\b.*\bSET\b)/gi, '');
  sanitized = sanitized.replace(/(\bDELETE\b.*\bFROM\b)/gi, '');
  sanitized = sanitized.replace(/(\bDROP\b.*\bTABLE\b)/gi, '');

  // Remove dangerous characters
  sanitized = sanitized.replace(/['";`]/g, '');

  return sanitized.trim();
};

// Validation functions
const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  if (!/^[a-zA-Z\s.]+$/.test(name)) return false;
  if (name.length < 3 || name.length > 50) return false;
  return true;
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  return /^(08|62)\d{8,13}$/.test(phone);
};

const validateAge = (age) => {
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return false;
  return ageNum >= 17 && ageNum <= 60;
};

const validateCity = (city) => {
  if (!city || typeof city !== 'string') return false;
  if (!/^[a-zA-Z\s]+$/.test(city)) return false;
  return city.length <= 30;
};

// Parse form data using formidable
const parseForm = (event) => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 2 * 1024 * 1024, // 2MB
      keepExtensions: true,
      filter: function ({ mimetype }) {
        return ['image/jpeg', 'image/png', 'application/pdf'].includes(mimetype);
      },
    });

    // Create a mock request object for formidable
    const req = {
      headers: event.headers,
      method: event.httpMethod,
    };

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });

    // Write body to form
    form.write(Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'));
    form.end();
  });
};

// Send notification to Telegram Bot
const sendToTelegram = async (formData, file) => {
  const BOT_TOKEN = process.env.BOT_TOKEN_NOTIFIKASI;
  const CHAT_ID = process.env.CHAT_ID_NOTIFIKASI;

  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('Telegram Bot credentials not configured');
  }

  try {
    const caption = `✅ Pendaftaran Baru\n\nNama: ${formData.name}\nEmail: ${formData.email}\nWhatsApp: ${formData.phone}\nUsia: ${formData.age}\nKota: ${formData.city}`;

    // Use fetch API (available in Node 18+)
    const FormData = require('form-data');
    const formDataTelegram = new FormData();
    formDataTelegram.append('chat_id', CHAT_ID);
    formDataTelegram.append('caption', caption);

    // Read file and send
    const fileBuffer = fs.readFileSync(file.filepath);
    formDataTelegram.append('photo', fileBuffer, {
      filename: file.originalFilename || 'bukti_transfer.jpg',
      contentType: file.mimetype
    });

    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formDataTelegram,
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending to Telegram:', error);
    throw error;
  }
};

exports.handler = async (event) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: 'Method not allowed',
      }),
    };
  }

  try {
    // Parse form data
    const { fields, files } = await parseForm(event);

    // Extract and sanitize fields
    const name = sanitizeInput(fields.name?.[0] || fields.name);
    const email = sanitizeInput(fields.email?.[0] || fields.email);
    const phone = sanitizeInput(fields.phone?.[0] || fields.phone);
    const age = sanitizeInput(fields.age?.[0] || fields.age);
    const city = sanitizeInput(fields.city?.[0] || fields.city);
    const paymentProof = files.paymentProof?.[0] || files.paymentProof;

    // Validate all fields
    const errors = {};

    if (!validateName(name)) {
      errors.name = 'Nama tidak valid';
    }
    if (!validateEmail(email)) {
      errors.email = 'Format email tidak valid';
    }
    if (!validatePhone(phone)) {
      errors.phone = 'Nomor WhatsApp tidak valid';
    }
    if (!validateAge(age)) {
      errors.age = 'Usia harus antara 17–60 tahun';
    }
    if (!validateCity(city)) {
      errors.city = 'Nama kota tidak valid';
    }
    if (!paymentProof) {
      errors.file = 'Bukti pembayaran wajib diunggah';
    }

    // Return errors if validation fails
    if (Object.keys(errors).length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          errors: errors,
        }),
      };
    }

    // Validate file type and size
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimes.includes(paymentProof.mimetype)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Tipe file tidak valid. Gunakan JPG, PNG, atau PDF',
        }),
      };
    }

    if (paymentProof.size > 2 * 1024 * 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Ukuran file maksimal 2MB',
        }),
      };
    }

    // Send to Telegram Bot
    await sendToTelegram(
      { name, email, phone, age, city },
      paymentProof
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(paymentProof.filepath);
    } catch (e) {
      console.error('Error deleting temp file:', e);
    }

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Pendaftaran berhasil! Tim kami akan menghubungi Anda dalam 3-5 hari kerja.',
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Terjadi kesalahan server. Silakan coba lagi.',
      }),
    };
  }
};
