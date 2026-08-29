import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 5000;
const DATA_PATH = './assets/combined/akhir_layer_3/data.json';
const OUT_DIR = './assets/combined/akhir_layer_3';
const PERBEDAAN_DIR = './assets/combined/perbedaan';

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

console.log('Loading akhir_layer_3/data.json...');
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

// Sort data per jabatan sesuai JABATAN_ORDER lalu No (rank)
const sortedData = [...data].sort((a, b) => {
  const jabA = a['Jabatan_Label'] || a['jabatan_label'] || '';
  const jabB = b['Jabatan_Label'] || b['jabatan_label'] || '';
  const idxA = JABATAN_ORDER.indexOf(jabA);
  const idxB = JABATAN_ORDER.indexOf(jabB);
  const posA = idxA === -1 ? 999 : idxA;
  const posB = idxB === -1 ? 999 : idxB;
  if (posA !== posB) return posA - posB;

  const rankA = parseInt(a['No'] || a['peringkat'] || '0', 10);
  const rankB = parseInt(b['No'] || b['peringkat'] || '0', 10);
  return rankA - rankB;
});

// Format row compact array (17 elemen):
// [0] Page (int)
// [1] No / Peringkat (string)
// [2] Nomor Kartu Ujian (string)
// [3] Nama Peserta (string)
// [4] Kognitif (string)
// [5] Substansi (string)
// [6] Keterangan / Status Layer 3 (string)
// [7] Jabatan_Label (string)
// [8] peringkat_sebelum_l3 (string)
// [9] status_sebelum_l3 (string)
// [10] status_sk (string)
// [11] peringkat_sk (string)
// [12] status_sebelum_l1 (string)
// [13] peringkat_sebelum_l1 (string)
// [14] satdik (string)
// [15] status_sebelum_l2 (string)
// [16] peringkat_sebelum_l2 (string)
const allRows = sortedData.map((d, i) => [
  d['Page'] || 0,                                      // 0: Page
  String(d['No'] || (i + 1)),                          // 1: No
  d['Nomor Kartu Ujian'] || '',                        // 2: NKU
  d['Nama Peserta'] || '',                             // 3: Nama
  String(d['Kognitif'] ?? ''),                         // 4: Kognitif
  String(d['Substansi'] ?? ''),                        // 5: Substansi
  d['Keterangan'] || '',                               // 6: Status
  d['Jabatan_Label'] || '',                            // 7: Jabatan_Label
  String(d['peringkat_sebelum_l3'] ?? ''),             // 8: peringkat_sebelum_l3
  d['status_sebelum_l3'] || '',                        // 9: status_sebelum_l3
  d['status_sk'] || '',                                // 10: status_sk
  String(d['peringkat_sk'] ?? ''),                     // 11: peringkat_sk
  d['status_sebelum_l1'] || '',                        // 12: status_sebelum_l1
  String(d['peringkat_sebelum_l1'] ?? ''),             // 13: peringkat_sebelum_l1
  d['satdik'] || '',                                   // 14: satdik
  d['status_sebelum_l2'] || '',                        // 15: status_sebelum_l2
  String(d['peringkat_sebelum_l2'] ?? '')              // 16: peringkat_sebelum_l2
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

// ── 6. summary.json & summary_perubahan_l3.json ────────────────────────────────
console.log('\n=== Membangun summary.json & summary_perubahan_l3.json ===');
const totalStatusCounts = {};
const totalChangeCounts = {};
const jabatanMap = {};

for (const jab of JABATAN_ORDER) {
  jabatanMap[jab] = {
    label: jab,
    totalRows: 0,
    statusCounts: {},
    statusChangeCounts: {}
  };
}

for (const d of sortedData) {
  const statusL3 = d['Keterangan'] || '';
  const statusL2 = d['status_sebelum_l3'] || '';
  const jab = d['Jabatan_Label'] || 'Lainnya';

  totalStatusCounts[statusL3] = (totalStatusCounts[statusL3] || 0) + 1;

  let changeKey = '';
  if (statusL2 === statusL3) {
    changeKey = 'tetap ' + statusL3;
  } else {
    changeKey = statusL2 + ' jadi ' + statusL3;
  }

  totalChangeCounts[changeKey] = (totalChangeCounts[changeKey] || 0) + 1;

  if (!jabatanMap[jab]) {
    jabatanMap[jab] = {
      label: jab,
      totalRows: 0,
      statusCounts: {},
      statusChangeCounts: {}
    };
  }
  const j = jabatanMap[jab];
  j.totalRows++;
  j.statusCounts[statusL3] = (j.statusCounts[statusL3] || 0) + 1;
  j.statusChangeCounts[changeKey] = (j.statusChangeCounts[changeKey] || 0) + 1;
}

const summary = {
  totalRows: data.length,
  statusCounts: totalStatusCounts,
  jabatan: jabatanMap
};
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log(`✓ Saved summary.json (${Object.keys(jabatanMap).length} jabatan)`);

ensureDir(PERBEDAAN_DIR);
fs.writeFileSync(path.join(PERBEDAAN_DIR, 'summary_perubahan_l3.json'), JSON.stringify(totalChangeCounts, null, 2));
console.log('✓ Saved summary_perubahan_l3.json');

console.log('\n========================================');
console.log('✓ SEMUA BERKAS TURUNAN AKHIR LAYER 3 BERHASIL DISINKRONKAN!');
console.log('========================================');
