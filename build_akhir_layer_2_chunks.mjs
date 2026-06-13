import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('assets/combined/akhir_layer_2/data.json', 'utf8'));

const chunksDir = 'assets/combined/akhir_layer_2/chunks';
const namesDir = 'assets/combined/akhir_layer_2/names';

if (!fs.existsSync(chunksDir)) fs.mkdirSync(chunksDir, { recursive: true });
if (!fs.existsSync(namesDir)) fs.mkdirSync(namesDir, { recursive: true });

const chunkSize = 5000;
const noPeserta = [];
const peringkat = [];
const namesMap = {};

let currentChunk = [];
let chunkIndex = 0;

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
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
        row.peringkat_sebelum_l2 || "-"
    ];
    
    currentChunk.push(rowArray);
    
    // no_peserta
    const noKartu = row["Nomor Kartu Ujian"];
    const no_peserta_str = noKartu.length > 9 ? noKartu.substring(9) : noKartu;
    noPeserta.push(no_peserta_str);
    
    // peringkat
    peringkat.push(i + 1);
    
    // Names inverted index
    let name = row["Nama Peserta"].trim().toLowerCase();
    const words = name.split(/[\s\.\',]+/);
    const prefixes = new Set();
    words.forEach(w => {
        const cleanWord = w.replace(/[^a-z0-9]/g, '');
        if (cleanWord.length > 0) {
            let prefix = cleanWord.substring(0, 2);
            prefixes.add(prefix);
        }
    });
    
    prefixes.forEach(prefix => {
        if (!namesMap[prefix]) {
            namesMap[prefix] = [];
        }
        namesMap[prefix].push(rowArray);
    });
    
    if (currentChunk.length >= chunkSize || i === data.length - 1) {
        fs.writeFileSync(path.join(chunksDir, `chunk_${chunkIndex}.json`), JSON.stringify(currentChunk));
        currentChunk = [];
        chunkIndex++;
    }
}

fs.writeFileSync('assets/combined/akhir_layer_2/no_peserta.json', JSON.stringify(noPeserta));
fs.writeFileSync('assets/combined/akhir_layer_2/peringkat.json', JSON.stringify(peringkat));

for (const prefix in namesMap) {
    fs.writeFileSync(path.join(namesDir, `${prefix}.json`), JSON.stringify(namesMap[prefix]));
}

console.log(`Generated ${chunkIndex} chunks in ${chunksDir}`);
console.log(`Generated ${Object.keys(namesMap).length} name index files in ${namesDir}`);
console.log(`Generated no_peserta.json (${noPeserta.length} items)`);
console.log(`Generated peringkat.json (${peringkat.length} items)`);
