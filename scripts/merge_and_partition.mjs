/**
 * merge_and_partition.mjs
 *
 * Jalur 1 — Gabung data dari data.json yang sudah ada (tanpa baca PDF ulang).
 *
 * Sumber:
 *   - assets/kdkmp/sk/data.json        → jabatan label: "KDKMP"
 *   - assets/knmp/sk/{slug}/data.json  → jabatan label sesuai slug
 *
 * Output: assets/combined/sk/
 *   - data.json        (gabungan semua rows, kompak)
 *   - summary.json     (info total per jabatan + grand total)
 *   - chunks/          (chunk_N.json, 5000 rows each)
 *   - names/           (prefix index untuk search nama)
 *   - no_peserta.json  (suffix-compressed nomor peserta index)
 *
 * Format row (8 elemen):
 *   [halaman_pdf, no_urut, nomor_peserta, nama, kognitif, substansi, status, jabatan_label]
 *
 * Peringkat tetap per-jabatan (no_urut dari sumber masing-masing tidak diubah).
 */

import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 5000;

const KDKMP_DATA_PATH  = './assets/kdkmp/sk/data.json';
const KNMP_BASE_DIR    = './assets/knmp/sk';
const OUT_DIR          = './assets/combined/sk';

const KNMP_JABATAN = [
  { slug: 'manajer_operasional',   label: 'KNMP - Manajer Operasional' },
  { slug: 'kepala_produksi',       label: 'KNMP - Kepala Produksi' },
  { slug: 'penjamin_mutu',         label: 'KNMP - Penjamin Mutu' },
  { slug: 'administrasi_keuangan', label: 'KNMP - Administrasi Keuangan' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    for (const file of fs.readdirSync(dirPath)) {
      fs.unlinkSync(path.join(dirPath, file));
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ File not found: ${filePath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

// ─── Step 1: Baca dan gabungkan semua rows ────────────────────────────────────
function collectAllRows() {
  const allRows = [];
  const jabatanStats = {}; // label → { totalRows, statusCounts }
  
  const defaultStatusCounts = {
    'P/L': 0,
    'P1/L': 0,
    'P2/L': 0,
    'TL': 0,
    'TH': 0,
    'TMS': 0,
    'APS': 0,
  };

  // ── KDKMP ─────────────────────────────────────────────────────────────────
  console.log('\n=== Membaca KDKMP ===');
  const kdkmpData = readJson(KDKMP_DATA_PATH);
  if (!kdkmpData) process.exit(1);

  // data.json KDKMP bisa berupa array langsung ATAU { rows, summary }
  const kdkmpRows = Array.isArray(kdkmpData) ? kdkmpData : (kdkmpData.rows || []);
  const kdkmpLabel = 'KDKMP - Manajer';
  console.log(`  Rows: ${kdkmpRows.length}`);

  const kdkmpStatusCounts = { ...defaultStatusCounts };
  for (const row of kdkmpRows) {
    // row asli: [halaman, no_urut, nomor_peserta, nama, kognitif, substansi, status]
    // tambah index 7: jabatan_label
    allRows.push([row[0], row[1], row[2], row[3], row[4], row[5], row[6], kdkmpLabel]);
    const st = row[6];
    kdkmpStatusCounts[st] = (kdkmpStatusCounts[st] || 0) + 1;
  }
  
  const kdkmpSource = Array.isArray(kdkmpData) ? {} : (kdkmpData.summary || {});
  kdkmpSource.jumlahFormasi = "3000";

  jabatanStats[kdkmpLabel] = {
    label: kdkmpLabel,
    totalRows: kdkmpRows.length,
    statusCounts: kdkmpStatusCounts,
    source: kdkmpSource,
  };

  // ── KNMP per jabatan ───────────────────────────────────────────────────────
  for (const { slug, label } of KNMP_JABATAN) {
    console.log(`\n=== Membaca KNMP: ${label} ===`);
    const dataPath = path.join(KNMP_BASE_DIR, slug, 'data.json');
    const jabatanData = readJson(dataPath);
    if (!jabatanData) {
      console.warn(`  ⚠ Dilewati karena file tidak ditemukan.`);
      continue;
    }

    const rows = jabatanData.rows || [];
    console.log(`  Rows: ${rows.length}`);

    const statusCounts = { ...defaultStatusCounts };
    for (const row of rows) {
      allRows.push([row[0], row[1], row[2], row[3], row[4], row[5], row[6], label]);
      const st = row[6];
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }
    
    const sourceData = jabatanData.summary || {};
    if (!sourceData.statusCounts) {
      sourceData.statusCounts = { ...defaultStatusCounts };
      for (const k in statusCounts) {
        sourceData.statusCounts[k] = statusCounts[k];
      }
    } else {
      sourceData.statusCounts = { ...defaultStatusCounts, ...sourceData.statusCounts };
    }

    jabatanStats[label] = {
      label,
      totalRows: rows.length,
      statusCounts,
      source: sourceData,
    };
  }

  console.log(`\nTotal rows gabungan: ${allRows.length}`);
  return { allRows, jabatanStats };
}

// ─── Step 2: Tulis data.json gabungan ─────────────────────────────────────────
function writeDataJson(allRows, jabatanStats) {
  ensureDir(OUT_DIR);

  // summary.json
  const grandTotal = allRows.length;
  const grandStatusCounts = {
    'P/L': 0,
    'P1/L': 0,
    'P2/L': 0,
    'TL': 0,
    'TH': 0,
    'TMS': 0,
    'APS': 0,
  };
  for (const row of allRows) {
    const st = row[6];
    grandStatusCounts[st] = (grandStatusCounts[st] || 0) + 1;
  }

  const summary = {
    totalRows: grandTotal,
    statusCounts: grandStatusCounts,
    jabatan: jabatanStats,
  };

  const summaryPath = path.join(OUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\n✓ Saved summary.json (${grandTotal} total rows)`);

  // data.json (kompak)
  const dataPath = path.join(OUT_DIR, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify({ summary, rows: allRows }));
  const sizeMB = (fs.statSync(dataPath).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Saved data.json (${sizeMB} MB)`);

  return summary;
}

// ─── Step 3: Chunks ───────────────────────────────────────────────────────────
function writeChunks(allRows) {
  const chunksDir = path.join(OUT_DIR, 'chunks');
  clearDir(chunksDir);

  const numChunks = Math.ceil(allRows.length / CHUNK_SIZE);
  console.log(`\n=== Menulis ${numChunks} chunk(s) ===`);

  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, allRows.length);
    const chunkRows = allRows.slice(start, end);
    fs.writeFileSync(path.join(chunksDir, `chunk_${i}.json`), JSON.stringify(chunkRows));
    if ((i + 1) % 20 === 0 || i + 1 === numChunks) {
      console.log(`  chunk ${i + 1}/${numChunks} ✓`);
    }
  }
  console.log(`✓ Chunks selesai`);
}

// ─── Step 4: Name prefix index ────────────────────────────────────────────────
function writeNameIndex(allRows) {
  const namesDir = path.join(OUT_DIR, 'names');
  clearDir(namesDir);

  console.log('\n=== Membangun name prefix index ===');
  const prefixMap = {};

  for (const row of allRows) {
    const name = row[3] || '';
    const words = name.toLowerCase().split(/[^a-z0-9]+/);
    const prefixes = new Set();

    for (const word of words) {
      if (word.length >= 2) {
        prefixes.add(word.slice(0, 2));
      } else if (word.length === 1) {
        prefixes.add(word);
      }
    }

    for (const pref of prefixes) {
      if (!prefixMap[pref]) prefixMap[pref] = [];
      prefixMap[pref].push(row);
    }
  }

  const prefixes = Object.keys(prefixMap);
  console.log(`  ${prefixes.length} prefix unik ditemukan. Menyimpan...`);

  for (const pref of prefixes) {
    fs.writeFileSync(
      path.join(namesDir, `${pref}.json`),
      JSON.stringify(prefixMap[pref])
    );
  }
  console.log(`✓ Name prefix index selesai`);
}

// ─── Step 5: Peringkat index ──────────────────────────────────────────────────
function writePeringkatIndex(allRows) {
  console.log('\n=== Membangun peringkat index ===');

  const peringkatArray = allRows.map(row => {
    const val = parseInt(row[1], 10);
    return isNaN(val) ? 0 : val;
  });

  const peringkatPath = path.join(OUT_DIR, 'peringkat.json');
  fs.writeFileSync(peringkatPath, JSON.stringify(peringkatArray));
  console.log(`✓ Saved peringkat.json (${peringkatArray.length} entries)`);
}

// ─── Step 6: No Peserta index ─────────────────────────────────────────────────
function writeNoPesertaIndex(allRows) {
  console.log('\n=== Membangun no_peserta index ===');

  const participantNumbers = allRows.map(row => {
    const val = String(row[2] || '');
    // Suffix compression: hapus prefix 'P26407581' yang sama
    if (val.startsWith('P26407581')) {
      return val.slice(9);
    }
    return val;
  });

  const noPesertaPath = path.join(OUT_DIR, 'no_peserta.json');
  fs.writeFileSync(noPesertaPath, JSON.stringify(participantNumbers));
  console.log(`✓ Saved no_peserta.json (${participantNumbers.length} entries)`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
console.log('╔══════════════════════════════════════════════╗');
console.log('║     merge_and_partition.mjs  — Jalur 1      ║');
console.log('╚══════════════════════════════════════════════╝');

const { allRows, jabatanStats } = collectAllRows();
writeDataJson(allRows, jabatanStats);
writeChunks(allRows);
writeNameIndex(allRows);
writePeringkatIndex(allRows);
writeNoPesertaIndex(allRows);

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  ✓ Selesai! Output di assets/combined/sk/   ║');
console.log('╚══════════════════════════════════════════════╝');
