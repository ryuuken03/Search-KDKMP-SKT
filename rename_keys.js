const fs = require('fs');
const filePath = 'assets/combined/akhir/data.json';

console.log('Loading data...');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('Renaming keys...');
for (let i = 0; i < data.length; i++) {
    if (data[i].hasOwnProperty('Jabatan')) {
        data[i]['Kognitif'] = data[i]['Jabatan'];
        delete data[i]['Jabatan'];
    }
    if (data[i].hasOwnProperty('Kualifikasi Pendidikan')) {
        data[i]['Substansi'] = data[i]['Kualifikasi Pendidikan'];
        delete data[i]['Kualifikasi Pendidikan'];
    }
}

console.log('Saving data...');
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Done.');
