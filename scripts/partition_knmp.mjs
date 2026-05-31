import fs from 'fs';
import path from 'path';

// ─── Config ───────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 5000;
const JABATAN_SLUGS = [
  'manajer_operasional',
  'kepala_produksi',
  'penjamin_mutu',
  'administrasi_keuangan',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function clearDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      fs.unlinkSync(path.join(dirPath, file));
    }
  } else {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Partition per Jabatan ────────────────────────────────────────────────────
function partitionJabatan(slug) {
  const jabatanDir = `./assets/knmp/sk/${slug}`;
  const dataPath = path.join(jabatanDir, 'data.json');
  const chunksDir = path.join(jabatanDir, 'chunks');
  const namesDir = path.join(jabatanDir, 'names');
  const noPesertaPath = path.join(jabatanDir, 'no_peserta.json');
  const summaryPath = path.join(jabatanDir, 'summary.json');

  console.log(`\n=== Partitioning KNMP: ${slug} ===`);

  if (!fs.existsSync(dataPath)) {
    console.error(`  Error: ${dataPath} not found. Run extract_knmp.mjs first.`);
    return 0;
  }

  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);
  const rows = data.rows || [];
  const summary = data.summary || {};

  console.log(`  Total rows: ${rows.length}`);

  // Update summary.json dengan totalRows yang akurat
  if (fs.existsSync(summaryPath)) {
    const existingSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    existingSummary.totalRows = rows.length;
    fs.writeFileSync(summaryPath, JSON.stringify(existingSummary, null, 2));
    console.log(`  Updated summary.json with totalRows = ${rows.length}`);
  }

  // ── 1. Sequential Chunks ──────────────────────────────────────────────────
  clearDir(chunksDir);
  const numChunks = Math.ceil(rows.length / CHUNK_SIZE);
  console.log(`  Saving ${numChunks} chunk(s) of max ${CHUNK_SIZE} rows...`);
  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, rows.length);
    const chunkRows = rows.slice(start, end);
    const chunkPath = path.join(chunksDir, `chunk_${i}.json`);
    fs.writeFileSync(chunkPath, JSON.stringify(chunkRows));
  }
  console.log(`  Saved ${numChunks} chunk(s) ✓`);

  // ── 2. Name Prefix Index ──────────────────────────────────────────────────
  clearDir(namesDir);
  const prefixMap = {};

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
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
  console.log(`  Found ${prefixes.length} unique name prefixes. Saving...`);
  for (const pref of prefixes) {
    const prefixPath = path.join(namesDir, `${pref}.json`);
    fs.writeFileSync(prefixPath, JSON.stringify(prefixMap[pref]));
  }
  console.log(`  Saved name prefix index ✓`);

  // ── 3. No Peserta Index (suffix-compressed) ───────────────────────────────
  const participantNumbers = rows.map(row => {
    const val = String(row[2] || '');
    if (val.startsWith('P26407581')) {
      return val.slice(9);
    }
    return val;
  });
  fs.writeFileSync(noPesertaPath, JSON.stringify(participantNumbers));
  console.log(`  Saved no_peserta.json (${participantNumbers.length} entries) ✓`);

  return rows.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
try {
  let totalRows = 0;
  for (const slug of JABATAN_SLUGS) {
    totalRows += partitionJabatan(slug);
  }
  console.log(`\n✓ All KNMP jabatan partitioned successfully!`);
  console.log(`  Total rows across all jabatan: ${totalRows}`);
} catch (e) {
  console.error('Error during partitioning:', e);
}
