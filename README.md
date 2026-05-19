# PDF JSON Search Indexer & Dashboard (Vite + React)

Aplikasi pencarian data hasil seleksi KDKMP yang super cepat dan responsif. Awalnya aplikasi ini memproses file PDF sebesar 97MB (12.473 halaman) di browser, namun sekarang telah dioptimalkan dengan **metode indexing JSON** sehingga dapat dimuat dan mencari data secara instan (< 0.5 detik).

---

## 🚀 Fitur Utama & Optimalisasi Performa

1. **Pencarian Instan (< 0.5 detik)**: Pencarian nama langsung memindai array JSON lokal, tidak lagi memilah file PDF 97MB di sisi client.
2. **Dashboard Ringkasan Instan**: Dashboard statistik dimuat seketika karena membaca file `summary.json` kecil (250 bytes) saat halaman pertama dibuka.
3. **Optimasi Bundle JavaScript**: Pustaka PDF.js yang berat tidak lagi dimuat di browser pengguna, mengurangi ukuran JS bundle dari **2.28 MB menjadi hanya 523 KB** (hanya 158 KB setelah gzip).
4. **Bypass Batas Ukuran File Vercel**: File PDF asli (`source.pdf`) tidak ikut disertakan ke dalam berkas build produksi, sehingga aman dari batas ukuran file Vercel Hobby (max 50MB).

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal perkakas berikut pada komputer Anda:
- [Node.js](https://nodejs.org/) (Versi 18.x atau yang lebih baru direkomendasikan)
- **NPM** (biasanya otomatis terinstal bersama Node.js)

---

## 💻 Cara Menjalankan Aplikasi secara Lokal

### 1. Kloning/Masuk ke folder projek
Buka terminal dan masuk ke folder projek ini:
```bash
cd "Search KDKMP SKT"
```

### 2. Instal Dependensi
Pasang semua pustaka yang dibutuhkan:
```bash
npm install
```

### 3. Letakkan Berkas PDF & Ekstrak Indeks JSON (Wajib)
Jika ada pembaruan pada berkas PDF hasil seleksi:
1. Simpan berkas PDF Anda dengan nama `source.pdf` di dalam folder `assets/` (`assets/source.pdf`).
2. Jalankan script pengekstraksi data untuk mengubah PDF menjadi indeks JSON terkompresi:
   ```bash
   node scripts/extract_data.mjs
   ```
   *(Script ini akan membaca 12.473 halaman secara lokal dan menghasilkan file `assets/data.json` serta `assets/summary.json` secara otomatis).*

### 4. Jalankan Aplikasi (Mode Development)
Jalankan aplikasi di browser lokal:
```bash
npm run dev
```

Buka browser Anda dan akses:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📦 Build untuk Produksi & Deploy (Vercel)

Untuk mengompilasi aplikasi ke versi produksi yang siap di-deploy ke hosting (seperti Vercel, Netlify, atau GitHub Pages):

```bash
npm run build
```

Perintah ini akan membuat folder `dist/` yang hanya berisi file static HTML/JS/CSS dan database JSON terkompresi. Berkas PDF asli (`source.pdf`) **sengaja dilewatkan** agar tidak melebihi kuota upload dan membebani server hosting Anda.
