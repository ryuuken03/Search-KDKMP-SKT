const fs = require('fs');

console.log("Loading SK data...");
const skDataRaw = JSON.parse(fs.readFileSync('assets/combined/sk/data.json', 'utf8'));
const skRows = skDataRaw.rows;

console.log(`SK data loaded with ${skRows.length} rows. Building map...`);
const skMap = new Map();
for (let i = 0; i < skRows.length; i++) {
    const r = skRows[i];
    const noPeserta = r[2];
    const kognitif = r[4];
    const substansi = r[5];
    skMap.set(noPeserta, { kognitif, substansi });
}

console.log("Loading Akhir data...");
const akhirData = JSON.parse(fs.readFileSync('assets/combined/akhir/data.json', 'utf8'));

console.log(`Akhir data loaded with ${akhirData.length} rows. Updating fields...`);
let updated = 0;
let notFound = 0;
for (let i = 0; i < akhirData.length; i++) {
    const row = akhirData[i];
    const noPeserta = row["Nomor Kartu Ujian"];
    
    const skInfo = skMap.get(noPeserta);
    if (skInfo) {
        row["Jabatan"] = skInfo.kognitif;
        row["Kualifikasi Pendidikan"] = skInfo.substansi;
        updated++;
    } else {
        row["Jabatan"] = "-";
        row["Kualifikasi Pendidikan"] = "-";
        notFound++;
    }
}

console.log(`Updated ${updated} rows. ${notFound} rows not found in SK data.`);
console.log("Saving Akhir data...");
fs.writeFileSync('assets/combined/akhir/data.json', JSON.stringify(akhirData, null, 2));
console.log("Done.");
