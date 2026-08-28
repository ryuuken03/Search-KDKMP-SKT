const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_PATH = './assets/akhir_layer_3/source.pdf';
const buf = fs.readFileSync(PDF_PATH);

const JABATAN_REGEX = /(MANAJER\s+OPERASIONAL\s*-\s*KNMP|KEPALA\s+PRODUKSI\s*-\s*KNMP|PENJAMIN\s+MUTU\s*-\s*KNMP|ADMINISTRASI\s+KEUANGAN\s*-\s*KNMP|MANAJER\s*-\s*KDKMP|PELAKSANA\s*-\s*KDKMP|ANALIS\s*-\s*KDKMP|MANAJER\s*-\s*KNMP|PELAKSANA\s*-\s*KNMP|ANALIS\s*-\s*KNMP)/i;
const STATUSES = ['TMS', 'TL', 'MS', 'L'];

function parseParticipantBlock(block) {
  const m = block.match(/^(\d+)(P\d{16})(\d*)(.+)$/);
  if (!m) return null;

  const no = m[1];
  const nku = m[2];
  const rest = m[4];

  const jabMatch = rest.match(JABATAN_REGEX);
  if (!jabMatch) return null;

  const rawJabatan = jabMatch[0];
  const jabIndex = jabMatch.index;
  const namaPeserta = rest.substring(0, jabIndex).trim();
  const afterJabatan = rest.substring(jabIndex + rawJabatan.length).trim();

  let keterangan = null;
  let satdik = '';

  for (const st of STATUSES) {
    if (afterJabatan.startsWith(st)) {
      keterangan = st;
      satdik = afterJabatan.substring(st.length).trim();
      break;
    }
  }

  if (!keterangan) return null;

  return {
    no,
    nku,
    namaPeserta,
    rawJabatan,
    keterangan,
    satdik
  };
}

let pageNum = 0;
const aalParticipantsFromPDF = [];

pdfParse(buf, {
  pagerender: function(pageData) {
    pageNum++;
    return pageData.getTextContent().then(function(tc) {
      let lastY = null;
      let text = '';
      for (const item of tc.items) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 1) {
          text += '\n';
        }
        text += item.str;
        lastY = item.transform[5];
      }

      const lines = text.split('\n');
      let currentBlock = '';
      let inData = false;

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.includes('HASIL INTEGRASI') || line.includes('REKAPITULASI')) { inData = false; continue; }
        if (line.startsWith('NoNomor Kartu Ujian') || line.startsWith('(1)(2)(3)')) { inData = true; continue; }
        if (line.includes('PANITIA SELEKSI')) {
          if (currentBlock) {
            const res = parseParticipantBlock(currentBlock);
            if (res && res.satdik === 'AAL') {
              aalParticipantsFromPDF.push({ page: pageNum, ...res });
            }
            currentBlock = '';
          }
          inData = false;
          continue;
        }
        if (!inData) continue;

        if (/^\d+P\d{16}/.test(line)) {
          if (currentBlock) {
            const res = parseParticipantBlock(currentBlock);
            if (res && res.satdik === 'AAL') {
              aalParticipantsFromPDF.push({ page: pageNum, ...res });
            }
          }
          currentBlock = line;
        } else {
          currentBlock += ' ' + line;
        }
      }

      if (currentBlock) {
        const res = parseParticipantBlock(currentBlock);
        if (res && res.satdik === 'AAL') {
          aalParticipantsFromPDF.push({ page: pageNum, ...res });
        }
      }

      return text;
    });
  }
}).then(() => {
  console.log('=== HASIL AUDIT AAL DARI PDF LANGSUNG ===');
  console.log(`Total peserta dengan Satdik "AAL" di source.pdf: ${aalParticipantsFromPDF.length}`);
  
  const l3Data = JSON.parse(fs.readFileSync('./assets/combined/akhir_layer_3/data.json', 'utf8'));
  const l3AAL = l3Data.filter(d => d.satdik === 'AAL');
  console.log(`Total peserta dengan Satdik "AAL" di data.json: ${l3AAL.length}`);

  // Cek apakah ada perbedaan antara PDF dan data.json
  const pdfNKUs = new Set(aalParticipantsFromPDF.map(p => p.nku));
  const jsonNKUs = new Set(l3AAL.map(p => p['Nomor Kartu Ujian']));

  const missingInJson = aalParticipantsFromPDF.filter(p => !jsonNKUs.has(p.nku));
  const extraInJson = l3AAL.filter(p => !pdfNKUs.has(p['Nomor Kartu Ujian']));

  console.log(`Perbedaan (ada di PDF tapi tidak ada di data.json): ${missingInJson.length}`);
  console.log(`Perbedaan (ada di data.json tapi tidak ada di PDF): ${extraInJson.length}`);

  console.log('\nContoh 5 peserta pertama dengan Satdik AAL:');
  aalParticipantsFromPDF.slice(0, 5).forEach(p => {
    console.log(` - Hal ${p.page} No ${p.no}: ${p.nku} - ${p.namaPeserta} (${p.keterangan})`);
  });

  console.log('\nContoh 5 peserta terakhir dengan Satdik AAL:');
  aalParticipantsFromPDF.slice(-5).forEach(p => {
    console.log(` - Hal ${p.page} No ${p.no}: ${p.nku} - ${p.namaPeserta} (${p.keterangan})`);
  });
}).catch(console.error);
