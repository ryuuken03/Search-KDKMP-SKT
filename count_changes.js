const fs = require('fs');

const dataPath = 'assets/combined/akhir/data.json';
const summaryPath = 'assets/combined/akhir/summary.json';

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

// Initialize statusChangeCounts globally
summary.statusChangeCounts = {
  "P/L_jadi_L": 0,
  "P/L_jadi_MS": 0,
  "P/L_jadi_TMS": 0,
  "P1/L_jadi_L": 0,
  "P1/L_jadi_MS": 0,
  "P1/L_jadi_TMS": 0,
  "P2/L_jadi_L": 0,
  "P2/L_jadi_MS": 0,
  "P2/L_jadi_TMS": 0
};

// Initialize statusChangeCounts per jabatan
if (summary.jabatan) {
  for (const jKey in summary.jabatan) {
    summary.jabatan[jKey].statusChangeCounts = {
      "P/L_jadi_L": 0,
      "P/L_jadi_MS": 0,
      "P/L_jadi_TMS": 0,
      "P1/L_jadi_L": 0,
      "P1/L_jadi_MS": 0,
      "P1/L_jadi_TMS": 0,
      "P2/L_jadi_L": 0,
      "P2/L_jadi_MS": 0,
      "P2/L_jadi_TMS": 0
    };
  }
}

data.forEach(item => {
  const oldStatus = item.status_sk;
  const newStatus = item.Keterangan;
  const jabatanLabel = item.Jabatan_Label;

  let key = null;
  if (oldStatus === 'P/L' && newStatus === 'L') key = 'P/L_jadi_L';
  if (oldStatus === 'P/L' && newStatus === 'MS') key = 'P/L_jadi_MS';
  if (oldStatus === 'P/L' && newStatus === 'TMS') key = 'P/L_jadi_TMS';
  if (oldStatus === 'P1/L' && newStatus === 'L') key = 'P1/L_jadi_L';
  if (oldStatus === 'P1/L' && newStatus === 'MS') key = 'P1/L_jadi_MS';
  if (oldStatus === 'P1/L' && newStatus === 'TMS') key = 'P1/L_jadi_TMS';
  if (oldStatus === 'P2/L' && newStatus === 'L') key = 'P2/L_jadi_L';
  if (oldStatus === 'P2/L' && newStatus === 'MS') key = 'P2/L_jadi_MS';
  if (oldStatus === 'P2/L' && newStatus === 'TMS') key = 'P2/L_jadi_TMS';

  if (key) {
    summary.statusChangeCounts[key]++;
    if (jabatanLabel && summary.jabatan && summary.jabatan[jabatanLabel]) {
      summary.jabatan[jabatanLabel].statusChangeCounts[key]++;
    }
  }
});

// Save updated summary.json
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

// Save separate file just in case it's needed
const outDir = 'assets/combined/perbedaan';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(`${outDir}/summary_perubahan.json`, JSON.stringify(summary.statusChangeCounts, null, 2));

console.log('Successfully updated statusChangeCounts in summary.json');
console.log('Global Changes:', summary.statusChangeCounts);
