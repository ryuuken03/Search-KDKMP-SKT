# PDF JSON Search Indexer & Dashboard (Vite + React)

Aplikasi pencarian data hasil seleksi KDKMP yang super cepat dan responsif. Aplikasi ini menggunakan **metode indexing JSON** sehingga dapat memuat dan mencari data secara instan (< 0.5 detik).

---

## 🚀 Fitur Utama & Optimalisasi Performa

1. **Pencarian Instan (< 0.5 detik)**: Pencarian nama langsung memindai array JSON lokal, menjadikannya sangat cepat.
2. **Dashboard Ringkasan Instan**: Dashboard statistik interaktif dengan grafik (menggunakan *Recharts*) yang dimuat seketika.
3. **Clean Architecture**: Kode terstruktur dengan baik (hooks, components, utils, config) untuk maintainability dan reusability yang tinggi.
4. **Optimasi Bundle JavaScript**: Pustaka PDF.js yang berat tidak lagi dimuat di browser pengguna, mengurangi ukuran JS bundle dari 2.28 MB menjadi hanya ~523 KB.
5. **Bypass Batas Ukuran File Vercel**: File PDF asli tidak ikut disertakan ke dalam berkas build produksi, aman dari batas ukuran Vercel Hobby.

---

## 🏗️ Struktur Proyek

Proyek ini telah direfaktor menggunakan prinsip-prinsip arsitektur yang bersih (*Clean Code Architecture*):

- `src/components/`: Komponen UI modular dan *reusable* (termasuk filter pencarian, tabel hasil, dan *card* statistik).
- `src/hooks/`: Kustom React Hooks (seperti `useSKSearch`) untuk mengoptimalkan performa re-render dan memisahkan logika state dari UI.
- `src/utils/`: Fungsi utilitas pendukung (pemrosesan string, format angka, dll).
- `src/config/`: Konfigurasi terpusat (contohnya konstanta warna dan status legenda di `skConstants.js`).
- `src/pages/`: Komponen representasi halaman (seperti `SkPage.jsx`).

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal perkakas berikut pada komputer Anda:
- [Node.js](https://nodejs.org/) (Versi 18.x atau yang lebih baru direkomendasikan)
- **NPM** (biasanya otomatis terinstal bersama Node.js)

---

## 💻 Cara Menjalankan Aplikasi secara Lokal

### 1. Kloning / Masuk ke folder projek
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
1. Simpan berkas PDF Anda dengan nama `source.pdf` di dalam folder `assets/kdkmp/sk/` (`assets/kdkmp/sk/source.pdf`).
2. Jalankan script pengekstraksi data untuk mengubah PDF menjadi indeks JSON terkompresi:
   ```bash
   node scripts/extract_kdkmp.mjs
   ```
   *(Script ini akan memproses dokumen secara lokal dan menghasilkan file `assets/kdkmp/sk/data.json` serta `assets/kdkmp/sk/summary.json` secara otomatis).*

### 4. Jalankan Aplikasi (Mode Development)
Jalankan aplikasi di browser lokal:
```bash
npm run dev
```

Buka browser Anda dan akses:
👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📦 Build untuk Produksi & Deploy (Vercel / Netlify)

Untuk mengompilasi aplikasi ke versi produksi yang siap di-deploy ke hosting:

```bash
npm run build
```

Perintah ini akan membuat folder `dist/` yang hanya berisi file static HTML/JS/CSS dan database JSON terkompresi. Berkas PDF asli (`assets/kdkmp/sk/source.pdf`) **sengaja dilewatkan** agar tidak melebihi kuota upload dan membebani server hosting Anda.
