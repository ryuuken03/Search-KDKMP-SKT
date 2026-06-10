const fs = require('fs');

console.log("Loading SK data...");
const skDataRaw = JSON.parse(fs.readFileSync('assets/combined/sk/data.json', 'utf8'));
const skRows = skDataRaw.rows;

console.log(`SK data loaded with ${skRows.length} rows. Building map...`);
const skMap = new Map();
for (let i = 0; i < skRows.length; i++) {
    const r = skRows[i];
    const noPeserta = r[2];
    const status = r[6];
    skMap.set(noPeserta, status);
}

console.log("Loading Akhir data...");
const akhirDataPath = 'assets/combined/akhir/data.json';
const akhirData = JSON.parse(fs.readFileSync(akhirDataPath, 'utf8'));

console.log(`Akhir data loaded with ${akhirData.length} rows. Updating status_sk...`);
let updated = 0;
let notFound = 0;
for (let i = 0; i < akhirData.length; i++) {
    const row = akhirData[i];
    const noPeserta = row["Nomor Kartu Ujian"];
    
    const skStatus = skMap.get(noPeserta);
    if (skStatus) {
        row["status_sk"] = skStatus;
        updated++;
    } else {
        row["status_sk"] = "-";
        notFound++;
    }
}

console.log(`Updated ${updated} rows. ${notFound} rows not found in SK data.`);
console.log("Saving Akhir data...");
fs.writeFileSync(akhirDataPath, JSON.stringify(akhirData, null, 2));
console.log("Done.");
