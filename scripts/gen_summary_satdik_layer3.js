const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, 'assets/combined/akhir_layer_3/data.json');
const OUTPUT_DIR = path.join(ROOT, 'assets/combined/akhir_layer_3');

console.log('Loading layer 3 data...');
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
console.log(`Loaded ${data.length} entries`);

// ── SUMMARY.JSON ──────────────────────────────────────────────────────────────

const totalStatusCounts = {};
const jabatanMap = {};

for (const row of data) {
  const ket = row['Keterangan'];
  const jab = row['Jabatan_Label'];
  const prevKet = row['status_sebelum_l3'];

  // Global status counts
  totalStatusCounts[ket] = (totalStatusCounts[ket] || 0) + 1;

  // Per-jabatan
  if (!jabatanMap[jab]) {
    jabatanMap[jab] = {
      label: jab,
      totalRows: 0,
      statusCounts: {},
      statusChangeCounts: {
        'tetap L': 0,
        'tetap MS': 0,
        'tetap TMS': 0,
        'tetap TL': 0,
        'L jadi MS': 0,
        'L jadi TMS': 0,
        'L jadi TL': 0,
        'MS jadi L': 0,
        'MS jadi TMS': 0,
        'MS jadi TL': 0,
        'TMS jadi L': 0,
        'TMS jadi MS': 0,
        'TMS jadi TL': 0,
        'TL jadi L': 0,
        'TL jadi MS': 0,
        'TL jadi TMS': 0,
      },
    };
  }

  const j = jabatanMap[jab];
  j.totalRows++;
  j.statusCounts[ket] = (j.statusCounts[ket] || 0) + 1;

  // Status change tracking (prev → current)
  if (prevKet) {
    if (prevKet === ket) {
      const key = `tetap ${ket}`;
      if (key in j.statusChangeCounts) j.statusChangeCounts[key]++;
    } else {
      const key = `${prevKet} jadi ${ket}`;
      if (key in j.statusChangeCounts) j.statusChangeCounts[key]++;
    }
  }
}

// Clean up zero-value statusChangeCounts
for (const jab of Object.values(jabatanMap)) {
  for (const key of Object.keys(jab.statusChangeCounts)) {
    if (jab.statusChangeCounts[key] === 0) delete jab.statusChangeCounts[key];
  }
}

const summary = {
  totalRows: data.length,
  statusCounts: totalStatusCounts,
  jabatan: jabatanMap,
};

const summaryPath = path.join(OUTPUT_DIR, 'summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
console.log(`Saved summary.json: ${Object.keys(jabatanMap).length} jabatan`);

// ── SATDIK.JSON ───────────────────────────────────────────────────────────────

const satdikCount = {};
for (const row of data) {
  const s = row['satdik'];
  if (s && s.trim()) {
    satdikCount[s.trim()] = (satdikCount[s.trim()] || 0) + 1;
  }
}

const satdikArr = Object.entries(satdikCount)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([nama, jumlah], id) => ({ id, nama, jumlah }));

const satdikPath = path.join(OUTPUT_DIR, 'satdik.json');
fs.writeFileSync(satdikPath, JSON.stringify(satdikArr, null, 2), 'utf8');
console.log(`Saved satdik.json: ${satdikArr.length} satdik`);

// Print summary stats
console.log('\n=== STATUS COUNTS ===');
console.log(JSON.stringify(totalStatusCounts, null, 2));
console.log('\n=== JABATAN ===');
for (const [jab, val] of Object.entries(jabatanMap)) {
  console.log(`${jab}: ${val.totalRows} rows, statusCounts:`, val.statusCounts);
}
console.log('\n=== TOP 5 SATDIK ===');
satdikArr.sort((a,b) => b.jumlah - a.jumlah).slice(0,5).forEach(s => console.log(`  ${s.nama}: ${s.jumlah}`));
