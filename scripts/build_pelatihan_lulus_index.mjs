import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 5000;
const DATA_PATH = './assets/combined/pelatihan_lulus/data.json';
const OUT_DIR = './assets/combined/pelatihan_lulus';

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function clearDir(p) {
  if (fs.existsSync(p)) {
    for (const f of fs.readdirSync(p)) {
      const fullPath = path.join(p, f);
      if (fs.lstatSync(fullPath).isDirectory()) {
        clearDir(fullPath);
        fs.rmdirSync(fullPath);
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  } else {
    fs.mkdirSync(p, { recursive: true });
  }
}

console.log('Loading pelatihan_lulus/data.json...');
const rawData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const data = Array.isArray(rawData) ? rawData : (rawData.rows || rawData);
console.log(`Loaded ${data.length} entries`);

const JABATAN_ORDER = [
  'KDKMP - Manajer',
  'KNMP - Manajer Operasional',
  'KNMP - Kepala Produksi',
  'KNMP - Penjamin Mutu',
  'KNMP - Administrasi Keuangan',
];

// Sort data agar berurutan per jabatan sesuai JABATAN_ORDER (dibutuhkan oleh offset paging useSKSearch)
const sortedData = [...data].sort((a, b) => {
  const jabA = a['jabatan_label'] || a['Jabatan_Label'] || '';
  const jabB = b['jabatan_label'] || b['Jabatan_Label'] || '';
  const idxA = JABATAN_ORDER.indexOf(jabA);
  const idxB = JABATAN_ORDER.indexOf(jabB);
  const posA = idxA === -1 ? 999 : idxA;
  const posB = idxB === -1 ? 999 : idxB;
  if (posA !== posB) return posA - posB;

  const rankA = parseInt(a['peringkat'] || a['no'] || '0', 10);
  const rankB = parseInt(b['peringkat'] || b['no'] || '0', 10);
  return rankA - rankB;
});

// Konversi object → compact array row (15 elemen) kompatibel dengan hook useSKSearch & PelatihanLulusResultsTable
// Format row:
// [0] Page (0)
// [1] Peringkat (string, e.g. "13706")
// [2] NKU / nomor_peserta (string, e.g. "P2640758110187943")
// [3] Nama (string)
// [4] Keterangan / Kognitif (string, e.g. "KDKMP")
// [5] Substansi ('')
// [6] Status/Hasil (string, e.g. "LULUS" atau "L")
// [7] Jabatan_Label (string, e.g. "KDKMP - Manajer")
// [8] No urut Satdik / Peringkat asal (string, e.g. "1")
// [9] status_setelah_l3 (string, e.g. "L")
// [10] ''
// [11] ''
// [12] ''
// [13] ''
// [14] Satdik (string, e.g. "SATDIK RINDAM IM/KOLAT I SUMBAGUT")
const allRows = sortedData.map((d, i) => [
  d['Page'] || 0,                                          // 0: Page
  String(d['peringkat'] || (i + 1)),                       // 1: No / Peringkat
  d['nomor_peserta'] || d['Nomor Kartu Ujian'] || '',      // 2: NKU
  d['nama'] || d['Nama Peserta'] || '',                    // 3: Nama
  d['Keterangan'] || '',                                   // 4: Keterangan (KDKMP / Nilai)
  '',                                                      // 5: Substansi
  d['hasil'] || d['Keterangan'] || d['status_setelah_l3'] || 'LULUS', // 6: Hasil/Status
  d['jabatan_label'] || d['Jabatan_Label'] || '',          // 7: Jabatan
  String(d['no'] || (i + 1)),                              // 8: No urut Satdik
  d['status_setelah_l3'] || 'L',                           // 9: status_setelah_l3
  '',                                                      // 10
  '',                                                      // 11
  '',                                                      // 12
  '',                                                      // 13
  d['Satdik'] || d['satdik'] || ''                         // 14: Satdik
]);

// ── 1. no_peserta.json ─────────────────────────────────────────────────────────
console.log('\n=== Membangun no_peserta.json ===');
const noPeserta = allRows.map(row => {
  const val = String(row[2] || '');
  return val.startsWith('P26407581') ? val.slice(9) : val;
});
fs.writeFileSync(path.join(OUT_DIR, 'no_peserta.json'), JSON.stringify(noPeserta));
console.log(`✓ Saved no_peserta.json (${noPeserta.length} entries)`);

// ── 2. peringkat.json ──────────────────────────────────────────────────────────
console.log('\n=== Membangun peringkat.json ===');
const peringkat = allRows.map(row => {
  const val = parseInt(row[1], 10);
  return isNaN(val) ? 0 : val;
});
fs.writeFileSync(path.join(OUT_DIR, 'peringkat.json'), JSON.stringify(peringkat));
console.log(`✓ Saved peringkat.json (${peringkat.length} entries)`);

// ── 3. satdik.json & satdik_data/ ──────────────────────────────────────────────
console.log('\n=== Membangun satdik.json & satdik_data/ ===');
const satdikMap = new Map();
allRows.forEach(row => {
  const satdikName = (row[14] || '').trim();
  if (satdikName) {
    if (!satdikMap.has(satdikName)) {
      satdikMap.set(satdikName, []);
    }
    satdikMap.get(satdikName).push(row);
  }
});

const sortedSatdikNames = Array.from(satdikMap.keys()).sort((a, b) => a.localeCompare(b));
const satdikDataDir = path.join(OUT_DIR, 'satdik_data');
clearDir(satdikDataDir);

const satdikList = sortedSatdikNames.map((nama, id) => {
  const rows = satdikMap.get(nama);
  fs.writeFileSync(path.join(satdikDataDir, `${id}.json`), JSON.stringify(rows));
  return {
    id,
    nama,
    jumlah: rows.length
  };
});
fs.writeFileSync(path.join(OUT_DIR, 'satdik.json'), JSON.stringify(satdikList, null, 2));
console.log(`✓ Saved satdik.json (${satdikList.length} satdiks) and partition files in satdik_data/`);

// ── 4. chunks/ ─────────────────────────────────────────────────────────────────
console.log('\n=== Membangun chunks/ ===');
const chunksDir = path.join(OUT_DIR, 'chunks');
clearDir(chunksDir);
const numChunks = Math.ceil(allRows.length / CHUNK_SIZE);
for (let i = 0; i < numChunks; i++) {
  const start = i * CHUNK_SIZE;
  const end = Math.min(start + CHUNK_SIZE, allRows.length);
  fs.writeFileSync(path.join(chunksDir, `chunk_${i}.json`), JSON.stringify(allRows.slice(start, end)));
}
console.log(`✓ Saved ${numChunks} chunks in chunks/`);

// ── 5. names/ ──────────────────────────────────────────────────────────────────
console.log('\n=== Membangun names/ ===');
const namesDir = path.join(OUT_DIR, 'names');
clearDir(namesDir);

const prefixMap = {};
for (const row of allRows) {
  const name = row[3] || '';
  const words = name.toLowerCase().split(/[^a-z0-9]+/);
  const prefs = new Set();
  for (const w of words) {
    if (w.length >= 2) prefs.add(w.slice(0, 2));
    else if (w.length === 1) prefs.add(w);
  }
  for (const pref of prefs) {
    if (!prefixMap[pref]) prefixMap[pref] = [];
    prefixMap[pref].push(row);
  }
}

const prefixes = Object.keys(prefixMap);
console.log(`  ${prefixes.length} prefix unik ditemukan. Menyimpan...`);
for (const pref of prefixes) {
  fs.writeFileSync(path.join(namesDir, `${pref}.json`), JSON.stringify(prefixMap[pref]));
}
console.log(`✓ Saved ${prefixes.length} prefix index files in names/`);

// ── 6. summary.json ────────────────────────────────────────────────────────────
console.log('\n=== Membangun summary.json ===');
const totalStatusCounts = {};
const jabatanMap = {};

for (const jab of JABATAN_ORDER) {
  jabatanMap[jab] = {
    label: jab,
    totalRows: 0,
    statusCounts: {}
  };
}

for (const d of sortedData) {
  const hasil = d['hasil'] || d['status_setelah_l3'] || 'LULUS';
  const jab = d['jabatan_label'] || d['Jabatan_Label'] || 'Lainnya';

  totalStatusCounts[hasil] = (totalStatusCounts[hasil] || 0) + 1;

  if (!jabatanMap[jab]) {
    jabatanMap[jab] = {
      label: jab,
      totalRows: 0,
      statusCounts: {}
    };
  }
  const j = jabatanMap[jab];
  j.totalRows++;
  j.statusCounts[hasil] = (j.statusCounts[hasil] || 0) + 1;
}

const summary = {
  totalRows: data.length,
  statusCounts: totalStatusCounts,
  jabatan: jabatanMap
};
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`✓ Saved summary.json (${Object.keys(jabatanMap).length} jabatan)`);

console.log('\n========================================');
console.log('✓ SEMUA BERKAS BERHASIL DIBUAT!');
console.log('========================================');
