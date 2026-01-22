# Registration Load Testing Script

## Deskripsi
Script ini digunakan untuk melakukan load testing pada form pendaftaran di https://relawanns.netlify.app/daftar

## Tujuan Testing
1. **Stress Test**: Mengecek apakah website bisa down ketika banyak yang mengakses
2. **Auto-Close Test**: Mengecek apakah website otomatis menutup pendaftaran ketika mencapai batas yang di-setting admin

## Instalasi

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Cara Menggunakan

1. Jalankan script:
```bash
python script.py
```

2. Pilih mode:
   - **Continuous Mode (y)**: Script akan terus mengirim 50 registrasi berulang-ulang sampai website down atau auto-close
   - **Single Round (n)**: Script hanya akan mengirim 50 registrasi sekali saja

## Fitur

- ✅ Mengirim 50 pendaftaran user secara bersamaan (concurrent)
- ✅ Data user random menggunakan nama Indonesia
- ✅ Upload gambar secara random dari folder Screenshots
- ✅ Monitoring status website secara real-time
- ✅ Statistik lengkap (success rate, requests per second, dll)
- ✅ Deteksi otomatis jika website down atau registration closed

## Konfigurasi

Edit variabel berikut di `script.py` jika diperlukan:

```python
NUM_USERS = 50              # Jumlah user per round
MAX_WORKERS = 10            # Jumlah thread concurrent
DELAY_BETWEEN_REQUESTS = 0.5  # Delay antar request (detik)
IMAGE_FOLDER = r"C:\Users\LENOVO\OneDrive\Pictures\Screenshots"
```

## Output

Script akan menampilkan:
- Status setiap registration attempt
- Statistik real-time (total requests, success/failed, success rate)
- Notifikasi jika website down atau registration closed
- Request per second untuk melihat performa

## Catatan Penting

⚠️ **PENTING**: Script ini untuk testing purposes only. Gunakan dengan bijak dan pastikan Anda memiliki izin untuk melakukan load testing pada website target.

## Troubleshooting

**Masalah**: "No images found in folder"
- **Solusi**: Pastikan ada file gambar (.png, .jpg, .jpeg) di folder Screenshots

**Masalah**: "Website is DOWN"
- **Solusi**: Ini berarti testing berhasil - website tidak bisa handle load atau registration sudah auto-close

**Masalah**: "Connection Error"
- **Solusi**: Check koneksi internet Anda atau website memang sedang down
