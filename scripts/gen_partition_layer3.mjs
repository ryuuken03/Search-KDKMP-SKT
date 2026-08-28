/**
 * gen_partition_layer3.mjs
 *
 * Generate index files untuk assets/combined/akhir_layer_3/:
 *   - no_peserta.json  (suffix-compressed NKU index, parallel ke L2)
 *   - peringkat.json   (array No peserta per baris, parallel ke L2)
 *   - chunks/          (chunk_N.json, 5000 rows each, format array compact)
 *   - names/           (prefix index untuk search nama)
 *
 * Format row compact (parallel ke L2 combined chunks):
 *   [Page, No, NKU, Nama, Keterangan, Jabatan_Label, satdik, peringkat_sebelum_l3, status_sebelum_l3]
 *   [ 0     1   2    3     4           5               6       7                     8 ]
 */

import fs from 'fs';
import path from 'path';

const CHUNK_SIZE = 5000;
const DATA_PATH  = './assets/combined/akhir_layer_3/data.json';
const OUT_DIR    = './assets/combined/akhir_layer_3';

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function clearDir(p) {
  if (fs.existsSync(p)) {
    for (const f of fs.readdirSync(p)) fs.unlinkSync(path.join(p, f));
  } else {
    fs.mkdirSync(p, { recursive: true });
  }
}

console.log('Loading akhir_layer_3/data.json...');
const rawData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
const data = Array.isArray(rawData) ? rawData : (rawData.rows || rawData);
console.log(`Loaded ${data.length} entries`);

// Konversi object → compact array row kompatibel dengan hook useSKSearch
// Format: [Page(0), No(1), NKU(2), Nama(3), ''(4), ''(5), Keterangan(6), Jabatan_Label(7), peringkat_sebelum_l3(8), status_sebelum_l3(9), '', '', '', '', satdik(14)]
// Hook: row[7] → r.jabatan; contextItems=[row1,row2,row3,row4,row5,row6,row8,row9,...,row14]
// contextItems indices yg dipakai SktL3ResultsTable:
//   [0]=No [1]=NKU [2]=Nama [3]=''(kosong) [4]=''(kosong) [5]=Keterangan
//   [6]=peringkat_sebelum_l3 [7]=status_sebelum_l3 [12]=satdik
const allRows = data.map(d => [
  d['Page'],                    // 0: Page
  d['No'],                      // 1: No
  d['Nomor Kartu Ujian'],       // 2: NKU
  d['Nama Peserta'],            // 3: Nama
  '',                           // 4: (kosong - tidak ada Kognitif)
  '',                           // 5: (kosong - tidak ada Substansi)
  d['Keterangan'],              // 6: Status/Keterangan
  d['Jabatan_Label'],           // 7: Jabatan_Label → r.jabatan di hook
  d['peringkat_sebelum_l3'],    // 8: → contextItems[6]
  d['status_sebelum_l3'],       // 9: → contextItems[7]
  '',                           // 10
  '',                           // 11
  '',                           // 12
  '',                           // 13
  d['satdik'] || '',            // 14: satdik → contextItems[12]
]);

// ── 1. no_peserta.json ─────────────────────────────────────────────────────────
console.log('\n=== Membangun no_peserta index ===');
const noPeserta = allRows.map(row => {
  const val = String(row[2] || '');
  return val.startsWith('P26407581') ? val.slice(9) : val;
});
fs.writeFileSync(path.join(OUT_DIR, 'no_peserta.json'), JSON.stringify(noPeserta));
console.log(`✓ Saved no_peserta.json (${noPeserta.length} entries)`);

// ── 2. peringkat.json ──────────────────────────────────────────────────────────
console.log('\n=== Membangun peringkat index ===');
const peringkat = allRows.map(row => {
  const val = parseInt(row[1], 10);
  return isNaN(val) ? 0 : val;
});
fs.writeFileSync(path.join(OUT_DIR, 'peringkat.json'), JSON.stringify(peringkat));
console.log(`✓ Saved peringkat.json (${peringkat.length} entries)`);

// ── 3. chunks/ ─────────────────────────────────────────────────────────────────
const chunksDir = path.join(OUT_DIR, 'chunks');
clearDir(chunksDir);
const numChunks = Math.ceil(allRows.length / CHUNK_SIZE);
console.log(`\n=== Menulis ${numChunks} chunk(s) ===`);
for (let i = 0; i < numChunks; i++) {
  const start = i * CHUNK_SIZE;
  const end   = Math.min(start + CHUNK_SIZE, allRows.length);
  fs.writeFileSync(path.join(chunksDir, `chunk_${i}.json`), JSON.stringify(allRows.slice(start, end)));
  if ((i + 1) % 10 === 0 || i + 1 === numChunks) console.log(`  chunk ${i + 1}/${numChunks} ✓`);
}
console.log(`✓ Chunks selesai`);

// ── 4. names/ ──────────────────────────────────────────────────────────────────
const namesDir = path.join(OUT_DIR, 'names');
clearDir(namesDir);
console.log('\n=== Membangun name prefix index ===');
const prefixMap = {};
for (const row of allRows) {
  const name   = row[3] || '';
  const words  = name.toLowerCase().split(/[^a-z0-9]+/);
  const prefs  = new Set();
  for (const w of words) {
    if (w.length >= 2)      prefs.add(w.slice(0, 2));
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
console.log(`✓ Name prefix index selesai`);

console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  ✓ Selesai! Output di akhir_layer_3/        ║');
console.log('╚══════════════════════════════════════════════╝');
