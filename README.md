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

#### A. Seleksi Kompetensi (SK):
1. Simpan berkas PDF SK Anda dengan nama `source.pdf` di dalam folder `assets/kdkmp/sk/` (`assets/kdkmp/sk/source.pdf`).
2. Jalankan script pengekstraksi data untuk mengubah PDF menjadi indeks JSON terkompresi:
   ```bash
   node scripts/extract_kdkmp.mjs
   ```
   *(Script ini akan memproses dokumen secara lokal dan menghasilkan file `assets/kdkmp/sk/data.json` serta `assets/kdkmp/sk/summary.json` secara otomatis).*

#### B. Seleksi Akhir (Kelulusan / SKT):
1. Letakkan berkas PDF seleksi akhir atau berkas teks halaman hasil parsing.
2. Ekstrak data dan buat chunks indeks akhir dengan menjalankan:
   ```bash
   node extract_all.mjs
   node add_status_sk.js
   node rename_keys.js
   node build_akhir_chunks.mjs
   ```

---

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

Perintah ini akan membuat folder `dist/` yang hanya berisi file static HTML/JS/CSS dan database JSON terkompresi. 

### ⚠️ Wajib Diperhatikan untuk Deploy Ke Vercel:
1. **Lakukan Git Add untuk Indeks Chunks & Summary (Sangat Penting)**: 
   Karena berkas PDF sumber (`source.pdf`) dan data base utuh (`data.json`) berukuran besar, mereka sengaja dilewatkan agar tidak membebani Vercel. Namun, **seluruh folder chunks dan file indeks terkompresi di folder `assets/combined/` wajib dicommit ke Git**. 
   Pastikan Anda menjalankan perintah berikut sebelum melakukan push ke GitHub/Vercel:
   ```bash
   git add assets/combined/akhir/
   git add assets/combined/sk/
   git commit -m "chore: add search index chunks and summaries for deployment"
   ```
   *Jika folder-folder di atas tidak dimasukkan ke dalam Git history, build step Vercel tidak akan mendeteksi data pencarian, sehingga pencarian di website Vercel akan kosong.*

2. **Pengaturan Routing**:
   File `vercel.json` telah ditambahkan di root proyek untuk mengonfigurasi perutean agar semua assets di `/assets/` disajikan langsung oleh CDN Vercel.

