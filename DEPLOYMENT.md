# Deployment Guide untuk Relawans Project

## 🚀 Deploy ke Netlify (Gratis)

### Prerequisites
1. Akun GitHub (untuk push code)
2. Akun Netlify (daftar gratis di [netlify.com](https://netlify.com))
3. Telegram Bot Token (dari [@BotFather](https://t.me/BotFather))
4. Chat ID grup/channel Telegram

---

## 📋 Langkah-langkah Deploy

### 1. Setup GitHub
```bash
# Inisialisasi git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository di GitHub lalu push
git remote add origin https://github.com/username/relawans.git
git branch -M main
git push -u origin main
```

### 2. Deploy ke Netlify

#### Via Netlify Dashboard (Recommended - Paling Mudah)
1. Buka [app.netlify.com](https://app.netlify.com) dan login dengan GitHub
2. Klik "Add new site" → "Import an existing project"
3. Pilih "Deploy with GitHub" → Pilih repository `relawans`
4. Netlify otomatis detect settings dari `netlify.toml`
5. Klik "Deploy site"
6. Tunggu build selesai (~2-3 menit)

#### Via Netlify CLI (Alternative)
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Follow prompts:
# - Create & configure a new site? Yes
# - Team? [pilih team Anda]
# - Site name? relawans (atau nama lain)
# - Publish directory? build
```

### 3. Setup Environment Variables

Setelah deploy, set environment variables di Netlify Dashboard:

1. Buka site di Netlify Dashboard
2. Site settings → Environment variables
3. Klik "Add a variable" dan tambahkan:

```
BOT_TOKEN_NOTIFIKASI = [token dari @BotFather]
CHAT_ID_NOTIFIKASI = [chat ID grup/channel]
```

**Cara mendapatkan token & chat ID:**

**Bot Token:**
1. Chat dengan [@BotFather](https://t.me/BotFather) di Telegram
2. Ketik `/newbot`
3. Follow instruksi (nama bot, username bot)
4. Copy token yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Chat ID:**
1. Tambahkan bot ke grup/channel
2. Kirim pesan di grup (contoh: "test")
3. Buka browser: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
   (Ganti `<BOT_TOKEN>` dengan token Anda)
4. Cari `"chat":{"id":-xxxx...}` di response JSON
5. Copy ID tersebut (biasanya negatif untuk grup, contoh: `-1001234567890`)

### 4. Redeploy

Setelah add environment variables, deploy ulang:
- Deploys tab → Trigger deploy → "Deploy site"

Atau otomatis deploy setiap push ke GitHub.

---

## ✅ Verification

### Test Website
1. Buka URL Netlify (contoh: `https://relawans.netlify.app`)
2. Navigate ke halaman Daftar (`/daftar`)
3. Isi form dengan data valid
4. Upload bukti transfer (JPG/PNG/PDF, max 2MB)
5. Submit form

### Check Telegram
Setelah submit, bot harus mengirim pesan ke grup dengan format:
```
✅ Pendaftaran Baru

Nama: [nama]
Email: [email]
WhatsApp: [phone]
Usia: [age]
Kota: [city]

[Foto bukti transfer]
```

### Check Function Logs
Untuk debug jika ada masalah:
1. Netlify Dashboard → Functions tab
2. Klik function `register`
3. Lihat logs real-time

---

## 🔧 Update Code

Untuk update code setelah deploy:

```bash
# Edit code Anda
# ...

# Push ke GitHub
git add .
git commit -m "Update feature X"
git push

# Netlify akan auto-deploy!
```

---

## 💡 Custom Domain (Optional)

Untuk pakai domain sendiri:

1. Beli domain (Niagahoster, Namecheap, dll)
2. Netlify Dashboard → Domain settings → Add custom domain
3. Follow instruksi DNS configuration
4. Netlify otomatis setup HTTPS
5. Done! Domain siap dalam 24-48 jam

---

## ⚠️ Troubleshooting

### Build Failed
**Cek:**
- Build logs di Netlify Dashboard → Deploys
- Pastikan `npm run build` sukses di local
- Pastikan `netlify.toml` ada di root project

**Common issues:**
```bash
# Test build locally
npm run build

# Should output to /build directory
```

---

### Function Error 500
**Cek:**
- Function logs: Netlify Dashboard → Functions → register → Logs
- Pastikan environment variables sudah di-set
- Pastikan dependencies terinstall

**Debug:**
```bash
# Test function locally (requires Netlify CLI)
netlify dev

# Submit form via localhost:8888
```

---

### Telegram Tidak Terima Pesan
**Checklist:**
- ✅ Bot token benar (dari @BotFather)
- ✅ Chat ID benar (include tanda `-` untuk grup)
- ✅ Bot sudah ditambahkan ke grup sebagai admin
- ✅ Environment variables di-set di Netlify

**Test bot manual:**
```bash
# Ganti <BOT_TOKEN> dan <CHAT_ID>
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
  -d "chat_id=<CHAT_ID>" \
  -d "text=Test dari deployment"
```

Jika command curl di atas sukses, berarti bot token & chat ID benar.

---

### File Upload Gagal
**Checklist:**
- ✅ File < 2MB
- ✅ Format: JPG, PNG, atau PDF
- ✅ Browser console tidak ada error (F12)

**Common issues:**
- File terlalu besar → Compress image
- Format tidak didukung → Convert ke JPG/PNG/PDF
- CORS error → Sudah di-handle di `netlify.toml`

---

### Form Tidak Submit / Loading Terus
**Cek:**
1. Browser console (F12) untuk error
2. Network tab: Apakah `/api/register` dipanggil?
3. Response dari API (should be JSON)

**Debug:**
```javascript
// Tambahkan di Form.tsx handleConfirmSubmit
console.log('Submitting to:', '/api/register');
console.log('Response:', result);
```

---

## 📊 Monitoring

### Function Analytics
Netlify Dashboard → Analytics:
- Request count
- Error rate
- Execution time
- Bandwidth usage

### Free Tier Limits
| Resource | Limit | Cukup? |
|----------|-------|--------|
| Bandwidth | 100GB/bulan | ✅ Ya |
| Build minutes | 300 min/bulan | ✅ Ya |
| Function invocations | 125K/bulan | ✅ Ya |
| Function runtime | 10 sec max | ✅ Ya |

Untuk project Anda: **Lebih dari cukup!**

---

## 🔐 Security Best Practices

### Environment Variables
- ✅ NEVER commit `.env` ke GitHub
- ✅ Gunakan Netlify Dashboard untuk production
- ✅ Rotate tokens secara berkala

### Monitoring
- Check function logs regularly
- Set up Netlify notifications untuk failed deploys
- Monitor error rate di analytics

---

## 📞 Support

**Jika ada masalah:**

1. **Check Netlify Status**: [status.netlify.com](https://status.netlify.com)
2. **Documentation**: [docs.netlify.com](https://docs.netlify.com)
3. **Community**: [answers.netlify.com](https://answers.netlify.com)

**Debug Steps:**
1. Check Deploy Logs
2. Check Function Logs
3. Check Browser Console
4. Test locally with `netlify dev`

---

## 🎯 Next Steps

Setelah deploy sukses:

### Immediate
- [ ] Test form submission
- [ ] Verify Telegram notification
- [ ] Share URL dengan team

### Optional Enhancements
- [ ] Setup custom domain
- [ ] Add Google Analytics
- [ ] Setup email notifications
- [ ] Implement Bot Admin commands
- [ ] Add rate limiting

---

**Happy deploying! 🚀**


### Prerequisites
1. Akun GitHub (untuk push code)
2. Akun Vercel (daftar gratis di [vercel.com](https://vercel.com))
3. Telegram Bot Token (dari [@BotFather](https://t.me/BotFather))
4. Chat ID grup/channel Telegram

---

## 📋 Langkah-langkah Deploy

### 1. Setup GitHub
```bash
# Inisialisasi git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository di GitHub lalu push
git remote add origin https://github.com/username/relawans.git
git branch -M main
git push -u origin main
```

### 2. Deploy ke Vercel

#### Via Vercel Dashboard (Recommended - Paling Mudah)
1. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
2. Klik "Add New" → "Project"
3. Pilih repository `relawans`
4. Vercel otomatis detect Vite → klik "Deploy"
5. Tunggu build selesai (~2 menit)

#### Via Vercel CLI (Alternative)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Setup and deploy? Y
# - Which scope? [pilih account Anda]
# - Link to existing project? N
# - Project name? relawans
# - Directory? ./
# - Want to override settings? N
```

### 3. Setup Environment Variables

Setelah deploy, set environment variables di Vercel Dashboard:

1. Buka project di Vercel Dashboard
2. Settings → Environment Variables
3. Tambahkan variables berikut:

```
BOT_TOKEN_NOTIFIKASI = [token dari @BotFather]
CHAT_ID_NOTIFIKASI = [chat ID grup/channel]
```

**Cara mendapatkan token & chat ID:**

**Bot Token:**
1. Chat dengan [@BotFather](https://t.me/BotFather) di Telegram
2. Ketik `/newbot`
3. Follow instruksi (nama bot, username bot)
4. Copy token yang diberikan

**Chat ID:**
1. Tambahkan bot ke grup/channel
2. Kirim pesan di grup
3. Buka: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Cari `"chat":{"id":-xxxx...}` di response
5. Copy ID tersebut

### 4. Redeploy

Setelah add environment variables, redeploy:
- Deployments tab → klik "..." pada latest deployment → "Redeploy"

---

## ✅ Verification

### Test Website
1. Buka URL Vercel (contoh: `https://relawans.vercel.app`)
2. Navigate ke halaman Daftar
3. Isi form dan upload bukti transfer
4. Submit

### Check Telegram
Setelah submit, bot harus mengirim pesan ke grup dengan format:
```
✅ Pendaftaran Baru

Nama: [nama]
Email: [email]
WhatsApp: [phone]
Usia: [age]
Kota: [city]

[Foto bukti transfer]
```

---

## 🔧 Update Code

Untuk update code setelah deploy:

```bash
# Edit code Anda
# ...

# Push ke GitHub
git add .
git commit -m "Update feature X"
git push

# Vercel akan auto-deploy!
```

---

## 💡 Custom Domain (Optional)

Untuk pakai domain sendiri:

1. Beli domain (Niagahoster, Namecheap, dll)
2. Vercel Dashboard → Settings → Domains
3. Add domain Anda
4. Update DNS records sesuai instruksi Vercel
5. Done! Domain siap dalam 24-48 jam

---

## ⚠️ Troubleshooting

### Build Failed
- Cek build logs di Vercel Dashboard
- Pastikan `npm run build` sukses di local

### API Error 500
- Cek function logs di Vercel Dashboard → Functions
- Pastikan environment variables sudah di-set

### Telegram Tidak Terima Pesan
- Verify bot token benar
- Verify chat ID benar (harus include tanda `-` untuk grup)
- Pastikan bot sudah ditambahkan ke grup
- Cek Vercel function logs untuk error detail

### File Upload Gagal
- Pastikan file < 2MB
- Hanya accept JPG, PNG, PDF
- Cek browser console untuk error

---

## 📞 Support

Jika ada masalah, check:
1. Vercel Deployment Logs
2. Function Logs (real-time di Vercel Dashboard)
3. Browser Console (F12)
