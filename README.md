# PDF Column Search & Dashboard (Vite + React)

Aplikasi *client-side* berbasis web untuk melakukan pencarian data secara spesifik di bawah kolom (seperti kolom "Nama") pada dokumen PDF menggunakan `pdfjs-dist`. Aplikasi ini juga dilengkapi dengan *dashboard* visualisasi statistik berbasis `recharts` untuk menganalisis data kehadiran dan kelulusan peserta.

Aplikasi ini berjalan sepenuhnya di sisi browser (*client-side*), sehingga sangat cepat dan tidak memerlukan server backend untuk memproses berkas PDF Anda.

---

## 🚀 Fitur Utama

- **Pencarian Kolom PDF Cepat**: Ekstraksi teks dan pencarian kolom "Nama" secara instan langsung di browser.
- **Dashboard Statistik Interaktif**: Menampilkan data kelulusan, jumlah peserta, formasi, serta visualisasi grafik kehadiran (Hadir vs Tidak Hadir).
- **Desain Modern & Responsif**: Antarmuka yang intuitif dan nyaman diakses baik dari perangkat desktop maupun mobile.
- **Tanpa Database/Backend**: Semua pemrosesan data dilakukan secara lokal dan aman di browser pengguna.

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal perkakas berikut pada komputer Anda:
- [Node.js](https://nodejs.org/) (Versi 18.x atau yang lebih baru direkomendasikan)
- **NPM** (biasanya otomatis terinstal bersama Node.js) atau **Yarn**

---

## 💻 Cara Menjalankan Aplikasi secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan aplikasi di lingkungan pengembangan Anda:

### 1. Masuk ke Direktori Projek
Buka terminal/command prompt dan masuk ke folder projek ini:
```bash
cd "Search KDKMP SKT"
```

### 2. Instal Dependensi
Pasang semua pustaka yang dibutuhkan dengan menjalankan perintah berikut:
```bash
npm install
```

### 3. Jalankan Server Pengembangan (Dev Server)
Jalankan aplikasi dalam mode pengembangan:
```bash
npm run dev
```

Setelah server berjalan, terminal akan menampilkan alamat lokal. Buka browser Anda dan akses:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📦 Build untuk Produksi (Production Build)

Jika Anda ingin mengompilasi aplikasi untuk di-deploy ke hosting (seperti Vercel, Netlify, atau GitHub Pages), jalankan perintah:

```bash
npm run build
```

Perintah ini akan membuat folder baru bernama `dist/` yang berisi berkas HTML, CSS, dan JavaScript yang telah diminifikasi dan siap digunakan.

---

## ☁️ Catatan Deploy ke Cloud (Vercel)

Jika Anda men-deploy aplikasi ini ke Vercel atau layanan sejenis, pastikan hal-hal berikut:
1. Pastikan folder `node_modules` **tidak ikut di-push** ke repositori Git Anda (sudah otomatis terkonfigurasi di `.gitignore`).
2. Gunakan pengaturan build berikut di dashboard hosting Anda:
   - **Build Command**: `npm run build` atau `vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
