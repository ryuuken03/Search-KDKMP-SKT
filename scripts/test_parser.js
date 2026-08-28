const pdfParse = require('pdf-parse');
const fs = require('fs');

const PDF_PATH = './assets/akhir_layer_3/source.pdf';
const buf = fs.readFileSync(PDF_PATH);

// Helper normalisasi jabatan
function normalizeJabatan(raw) {
  const clean = raw.replace(/\s+/g, ' ').trim().toUpperCase();
  if (clean.includes('MANAJER OPERASIONAL') && clean.includes('KNMP')) return 'KNMP - Manajer Operasional';
  if (clean.includes('KEPALA PRODUKSI') && clean.includes('KNMP')) return 'KNMP - Kepala Produksi';
  if (clean.includes('PENJAMIN MUTU') && clean.includes('KNMP')) return 'KNMP - Penjamin Mutu';
  if (clean.includes('ADMINISTRASI KEUANGAN') && clean.includes('KNMP')) return 'KNMP - Administrasi Keuangan';
  if (clean.includes('MANAJER') && clean.includes('KDKMP')) return 'KDKMP - Manajer';
  if (clean.includes('KNMP')) return 'KNMP - ' + clean;
  if (clean.includes('KDKMP')) return 'KDKMP - ' + clean;
  return clean;
}

const JABATAN_REGEX = /(MANAJER\s+OPERASIONAL\s*-\s*KNMP|KEPALA\s+PRODUKSI\s*-\s*KNMP|PENJAMIN\s+MUTU\s*-\s*KNMP|ADMINISTRASI\s+KEUANGAN\s*-\s*KNMP|MANAJER\s*-\s*KDKMP|PELAKSANA\s*-\s*KDKMP|ANALIS\s*-\s*KDKMP|MANAJER\s*-\s*KNMP|PELAKSANA\s*-\s*KNMP|ANALIS\s*-\s*KNMP)/i;

const STATUSES = ['TMS', 'TL', 'MS', 'L'];

function parseParticipantBlock(block) {
  // Format gabungan: e.g. "38P2640758120182117DIAN REZKI MULIANIMANAJER OPERASIONAL - KNMPLAAL"
  const m = block.match(/^(\d+)(P\d{16})(\d*)(.+)$/);
  if (!m) return null;

  const no = m[1];
  const nku = m[2];
  const rest = m[4];

  // Cari jabatan menggunakan regex
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
    jabatan: normalizeJabatan(rawJabatan),
    keterangan,
    satdik
  };
}

let pageNum = 0;
let parsedCount = 0;
let sampleKNMP = [];

pdfParse(buf, {
  pagerender: function(pageData) {
    pageNum++;
    if (pageNum >= 2588 && pageNum <= 2595) {
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
              if (res) sampleKNMP.push(res);
              currentBlock = '';
            }
            inData = false;
            continue;
          }
          if (!inData) continue;

          // Cek apakah awal baris peserta baru
          if (/^\d+P\d{16}/.test(line)) {
            if (currentBlock) {
              const res = parseParticipantBlock(currentBlock);
              if (res) sampleKNMP.push(res);
            }
            currentBlock = line;
          } else {
            // Sambungan baris
            currentBlock += ' ' + line;
          }
        }

        if (currentBlock) {
          const res = parseParticipantBlock(currentBlock);
          if (res) sampleKNMP.push(res);
        }

        return text;
      });
    }
    return '';
  }
}).then(() => {
  console.log(`Parsed samples count: ${sampleKNMP.length}`);
  console.log('Sample parsed:');
  sampleKNMP.slice(0, 15).forEach(s => {
    console.log(JSON.stringify(s));
  });
}).catch(console.error);
