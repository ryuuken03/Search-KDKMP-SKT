import fs from 'fs';
import path from 'path';

console.log("Loading data.json from assets/combined/akhir_layer_2...");
const data = JSON.parse(fs.readFileSync('assets/combined/akhir_layer_2/data.json', 'utf8'));

const satdikDir = 'assets/combined/akhir_layer_2/satdik_data';
if (!fs.existsSync(satdikDir)) {
  fs.mkdirSync(satdikDir, { recursive: true });
}

// Group rows by Satdik
const satdikMap = new Map();

data.forEach((row, i) => {
  const satdik = row.satdik ? row.satdik.trim() : '';
  if (satdik) {
    if (!satdikMap.has(satdik)) {
      satdikMap.set(satdik, []);
    }
    
    // Format row identical to chunk rowArray
    const rowArray = [
      row.Page || 0,
      row.No,
      row["Nomor Kartu Ujian"],
      row["Nama Peserta"],
      row.Kognitif,
      row.Substansi,
      row.Keterangan,
      row.Jabatan_Label,
      row.status_sk || "-",
      row.peringkat_sk || "-",
      row.status_sebelum_l1 || "-",
      row.peringkat_sebelum_l1 || "-",
      row.status_sebelum_l2 || "-",
      row.peringkat_sebelum_l2 || "-",
      row.satdik || "-"
    ];
    
    satdikMap.get(satdik).push(rowArray);
  }
});

// Sort satdik alphabetically for clean listing
const sortedSatdikNames = Array.from(satdikMap.keys()).sort((a, b) => a.localeCompare(b));

const satdikList = sortedSatdikNames.map((nama, id) => {
  const rows = satdikMap.get(nama);
  
  // Write individual partition file
  const filePath = path.join(satdikDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows));
  
  return {
    id,
    nama,
    jumlah: rows.length
  };
});

// Write master satdik.json
fs.writeFileSync('assets/combined/akhir_layer_2/satdik.json', JSON.stringify(satdikList, null, 2), 'utf8');

console.log(`Generated ${satdikList.length} SATDIK partition files in ${satdikDir}`);
console.log(`Total participants with SATDIK: ${satdikList.reduce((sum, s) => sum + s.jumlah, 0)}`);
console.log(`Updated assets/combined/akhir_layer_2/satdik.json successfully.`);
