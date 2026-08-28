import fs from 'fs';
import path from 'path';

const DATA_PATH = './assets/combined/akhir_layer_3/data.json';
const SATDIK_PATH = './assets/combined/akhir_layer_3/satdik.json';
const OUT_DIR = './assets/combined/akhir_layer_3/satdik_data';

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

console.log('Loading akhir_layer_3/satdik.json...');
const satdikList = JSON.parse(fs.readFileSync(SATDIK_PATH, 'utf-8'));
console.log(`Loaded ${satdikList.length} satdik entries`);

// Group rows by satdik name
const satdikMap = new Map();
satdikList.forEach(item => {
  satdikMap.set(item.nama, []);
});

data.forEach((d) => {
  const satdikName = (d['satdik'] || '').trim();
  if (satdikName && satdikMap.has(satdikName)) {
    // Format row compact array (15 elements) identik dengan chunks di akhir_layer_3:
    const rowArray = [
      d['Page'] || 0,                 // 0: Page
      d['No'] || '',                  // 1: No
      d['Nomor Kartu Ujian'] || '',   // 2: NKU
      d['Nama Peserta'] || '',        // 3: Nama
      '',                             // 4: Kognitif (kosong)
      '',                             // 5: Substansi (kosong)
      d['Keterangan'] || '',          // 6: Status / Keterangan
      d['Jabatan_Label'] || '',       // 7: Jabatan_Label
      d['peringkat_sebelum_l3'] || '',// 8: peringkat_sebelum_l3
      d['status_sebelum_l3'] || '',   // 9: status_sebelum_l3
      '',                             // 10
      '',                             // 11
      '',                             // 12
      '',                             // 13
      satdikName                      // 14: satdik
    ];
    satdikMap.get(satdikName).push(rowArray);
  }
});

clearDir(OUT_DIR);

let totalWritten = 0;
satdikList.forEach((item) => {
  const rows = satdikMap.get(item.nama) || [];
  const filePath = path.join(OUT_DIR, `${item.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows));
  totalWritten += rows.length;
});

console.log(`✓ Berhasil menulis ${satdikList.length} berkas di ${OUT_DIR}`);
console.log(`✓ Total baris peserta dengan satdik: ${totalWritten}`);
