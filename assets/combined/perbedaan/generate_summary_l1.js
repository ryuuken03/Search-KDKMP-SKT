const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../akhir_layer_1/data.json');
const outputPath = path.join(__dirname, 'summary_perubahan_l1.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let result = { 
    'tetap L': 0, 
    'tetap MS': 0, 
    'tetap TMS': 0, 
    'L jadi MS': 0, 
    'L jadi TMS': 0 
};

data.forEach(item => {
    const k = item.Keterangan;
    const s = item.status_sebelum_l1;

    if (k === 'L' && s === 'L') {
        result['tetap L']++;
    } else if (k === 'MS' && s === 'MS') {
        result['tetap MS']++;
    } else if (k === 'TMS' && s === 'TMS') {
        result['tetap TMS']++;
    } else if (k === 'MS' && s === 'L') {
        result['L jadi MS']++;
    } else if (k === 'TMS' && s === 'L') {
        result['L jadi TMS']++;
    }
});

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Berhasil membuat summary_perubahan_l1.json:', result);
