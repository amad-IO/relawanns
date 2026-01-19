const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// === SECURITY MIDDLEWARE ===

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3001', // Frontend URL
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - max 5 submissions per IP per 15 minutes
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Terlalu banyak percobaan, silakan coba lagi dalam 15 menit'
});

// === INPUT SANITIZATION ===

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
  sanitized = sanitized.replace(/['"`;]/g, '');

  return sanitized.trim();
};

// === VALIDATION FUNCTIONS ===

const validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  // Hanya huruf, spasi, dan titik
  if (!/^[a-zA-Z\s.]+$/.test(name)) return false;
  if (name.length < 3 || name.length > 50) return false;
  return true;
};

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  // Email regex strict
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // WhatsApp: 08 atau 62, 10-15 digit
  return /^(08|62)\d{8,13}$/.test(phone);
};

const validateAge = (age) => {
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) return false;
  // Usia 17-60 tahun
  return ageNum >= 17 && ageNum <= 60;
};

const validateCity = (city) => {
  if (!city || typeof city !== 'string') return false;
  // Hanya huruf dan spasi, max 30 karakter
  if (!/^[a-zA-Z\s]+$/.test(city)) return false;
  return city.length <= 30;
};

// === FILE  UPLOAD CONFIGURATION ===

// Multer storage config with hash renaming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    // Generate hash for filename: sha256_timestamp.ext
    const hash = crypto.createHash('sha256')
      .update(file.originalname + Date.now())
      .digest('hex')
      .substring(0, 16);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${hash}_${Date.now()}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check MIME type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Format file tidak valid'), false);
  }

  // Check extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
  if (!allowedExts.includes(ext)) {
    return cb(new Error('Ekstensi file tidak valid'), false);
  }

  // Check for double extension (e.g., .jpg.php)
  const filenameParts = file.originalname.split('.');
  if (filenameParts.length > 2) {
    return cb(new Error('Double extension terdeteksi'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max
  },
  fileFilter: fileFilter
});

// === REGISTRATION ENDPOINT ===

app.post('/api/register', submitLimiter, upload.single('paymentProof'), (req, res) => {
  try {
    // Extract and sanitize inputs
    const name = sanitizeInput(req.body.name);
    const email = sanitizeInput(req.body.email);
    const phone = sanitizeInput(req.body.phone);
    const age = sanitizeInput(req.body.age);
    const city = sanitizeInput(req.body.city);

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
    if (!req.file) {
      errors.file = 'Bukti pembayaran wajib diunggah';
    }

    // Return errors if validation fails
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    // === DATABASE INSERT (USING PARAMETERIZED QUERY) ===
    // Example with MySQL prepared statement
    /*
    const query = 'INSERT INTO registrations (name, email, phone, age, city, payment_proof) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [name, email, phone, age, city, req.file.filename];
    
    db.execute(query, values, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
        
        res.json({
            success: true,
            message: 'Pendaftaran berhasil',
            data: {
                id: results.insertId
            }
        });
    });
    */

    // For now, just return success (implement database later)
    res.json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        name, email, phone, age, city,
        payment_proof: req.file.filename
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// === ERROR HANDLER ===

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file maksimal 2MB'
      });
    }
  }

  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan server'
  });
});

// === START SERVER ===

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🛡️  Security features enabled: Helmet, CORS, Rate Limiting`);
});

module.exports = app;
