const fs = require('fs');
const path = require('path');

function findMissingNumbers() {
    const akhirPath = path.join(__dirname, 'assets/combined/akhir/data.json');
    const skPath = path.join(__dirname, 'assets/combined/sk/data.json');
    const outputPath = path.join(__dirname, 'assets/combined/perbedaan/nomor_tidak_ada.json');

    const dataAkhir = JSON.parse(fs.readFileSync(akhirPath, 'utf8'));
    const dataSk = JSON.parse(fs.readFileSync(skPath, 'utf8'));

    // Create a Set of 'nomor_peserta' from sk/data.json for faster lookup
    const skNumbers = new Set(dataSk.rows.map(item => item.nomor_peserta));

    // Find items in akhir/data.json that do not have their 'nomor_peserta' in the Set
    const missing = dataAkhir.filter(item => !skNumbers.has(item.nomor_peserta));

    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(missing, null, 2));

    console.log(`Pencarian selesai. Ditemukan ${missing.length} data yang tidak ada di sk/data.json.`);
}

findMissingNumbers();
