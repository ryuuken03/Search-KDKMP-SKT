const fs = require('fs');
const l3 = JSON.parse(fs.readFileSync('./assets/combined/akhir_layer_3/data.json', 'utf8'));

const pm = l3.filter(d => (d.Jabatan_Label || '').toLowerCase().includes('penjamin mutu'));
console.log('Total Peserta Penjamin Mutu di L3:', pm.length);

const statusCounts = {};
const statusChangeCounts = {};

for (const d of pm) {
  const curr = d.Keterangan;
  const prev = d.status_sebelum_l3;
  statusCounts[curr] = (statusCounts[curr] || 0) + 1;
  
  if (prev) {
    const changeKey = prev === curr ? 'tetap ' + prev : prev + ' jadi ' + curr;
    statusChangeCounts[changeKey] = (statusChangeCounts[changeKey] || 0) + 1;
  }
}

console.log('\nStatus di Layer 3:', JSON.stringify(statusCounts, null, 2));
console.log('\nPerubahan Status dari Layer 2 ke Layer 3:', JSON.stringify(statusChangeCounts, null, 2));

const lToTms = pm.filter(d => d.status_sebelum_l3 === 'L' && d.Keterangan === 'TMS');
const msToL = pm.filter(d => d.status_sebelum_l3 === 'MS' && d.Keterangan === 'L');

console.log('\nJumlah L jadi TMS:', lToTms.length);
if (lToTms.length > 0) {
  console.log('Daftar L jadi TMS:');
  lToTms.forEach(p => {
    console.log(` - Hal ${p.Page} No ${p.No}: ${p['Nomor Kartu Ujian']} - ${p['Nama Peserta']}`);
  });
}

console.log('\nJumlah MS jadi L:', msToL.length);
if (msToL.length > 0) {
  console.log('Daftar MS jadi L:');
  msToL.forEach(p => {
    console.log(` - Hal ${p.Page} No ${p.No}: ${p['Nomor Kartu Ujian']} - ${p['Nama Peserta']} (Satdik: ${p.satdik})`);
  });
}
