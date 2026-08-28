const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PDF_PATH = path.join(ROOT, 'assets/akhir_layer_3/source.pdf');
const LAYER2_JSON = path.join(ROOT, 'assets/combined/akhir_layer_2/data.json');
const OUTPUT_DIR = path.join(ROOT, 'assets/combined/akhir_layer_3');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'data.json');

// Helper normalisasi jabatan
function normalizeJabatan(raw) {
  const clean = raw.replace(/\s+/g, ' ').trim().toUpperCase();
  if (clean.includes('MANAJER OPERASIONAL')) return 'KNMP - Manajer Operasional';
  if (clean.includes('KEPALA PRODUKSI')) return 'KNMP - Kepala Produksi';
  if (clean.includes('PENJAMIN MUTU')) return 'KNMP - Penjamin Mutu';
  if (clean.includes('ADMINISTRASI KEUANGAN')) return 'KNMP - Administrasi Keuangan';
  if (clean.includes('MANAJER') && clean.includes('KDKMP')) return 'KDKMP - Manajer';
  if (clean.includes('MANAJER')) return 'KDKMP - Manajer';
  return clean;
}

// Regex yang mencakup seluruh jabatan (urutkan dari yang terpanjang / paling spesifik)
const JABATAN_REGEX = /(MANAJER\s+OPERASIONAL\s*-\s*KNMP|MANAJER\s+OPERASIONAL|KEPALA\s+PRODUKSI\s*-\s*KNMP|KEPALA\s+PRODUKSI|PENJAMIN\s+MUTU\s*-\s*KNMP|PENJAMIN\s+MUTU|ADMINISTRASI\s+KEUANGAN\s*-\s*KNMP|ADMINISTRASI\s+KEUANGAN|MANAJER\s*-\s*KDKMP|PELAKSANA\s*-\s*KDKMP|ANALIS\s*-\s*KDKMP|MANAJER\s*-\s*KNMP|PELAKSANA\s*-\s*KNMP|ANALIS\s*-\s*KNMP)/i;

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
    jabatan: normalizeJabatan(rawJabatan),
    keterangan,
    satdik
  };
}

async function main() {
  console.log('Loading layer 2 data...');
  const layer2Data = JSON.parse(fs.readFileSync(LAYER2_JSON, 'utf8'));
  
  // Build lookup multimap by normalized NKU (P + exactly 16 digits)
  const layer2Map = new Map();
  for (const item of layer2Data) {
    const rawNku = item['Nomor Kartu Ujian'];
    const nkuMatch = rawNku.match(/^(P\d{16})/);
    const normalizedNku = nkuMatch ? nkuMatch[1] : rawNku;
    if (!layer2Map.has(normalizedNku)) layer2Map.set(normalizedNku, []);
    layer2Map.get(normalizedNku).push(item);
  }
  
  const normName = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
  function findL2(nku, nama) {
    const candidates = layer2Map.get(nku);
    if (!candidates || candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    const n = normName(nama);
    const exact = candidates.find(c => normName(c['Nama Peserta']) === n);
    if (exact) return exact;
    const partial = candidates.find(c => {
      const cn = normName(c['Nama Peserta']);
      return cn.includes(n) || n.includes(cn);
    });
    return partial || candidates[0];
  }
  console.log(`Layer 2 data loaded: ${layer2Data.length} entries`);
  
  console.log('Parsing PDF...');
  const buf = fs.readFileSync(PDF_PATH);
  
  const results = [];
  let pageNum = 0;
  
  const options = {
    pagerender: function(pageData) {
      pageNum++;
      if (pageNum % 200 === 0) {
        process.stdout.write(`\rProcessing page ${pageNum}...`);
      }
      return pageData.getTextContent().then(function(textContent) {
        let lastY = null;
        let text = '';
        for (const item of textContent.items) {
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
              if (res) {
                const l2Entry = findL2(res.nku, res.namaPeserta);
                results.push({
                  Page: pageNum,
                  No: res.no,
                  'Nomor Kartu Ujian': res.nku,
                  'Nama Peserta': res.namaPeserta,
                  Keterangan: res.keterangan,
                  Jabatan_Label: res.jabatan,
                  satdik: res.satdik,
                  peringkat_sebelum_l3: l2Entry ? String(l2Entry['No']) : null,
                  status_sebelum_l3: l2Entry ? l2Entry['Keterangan'] : null,
                });
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
              if (res) {
                const l2Entry = findL2(res.nku, res.namaPeserta);
                results.push({
                  Page: pageNum,
                  No: res.no,
                  'Nomor Kartu Ujian': res.nku,
                  'Nama Peserta': res.namaPeserta,
                  Keterangan: res.keterangan,
                  Jabatan_Label: res.jabatan,
                  satdik: res.satdik,
                  peringkat_sebelum_l3: l2Entry ? String(l2Entry['No']) : null,
                  status_sebelum_l3: l2Entry ? l2Entry['Keterangan'] : null,
                });
              }
            }
            currentBlock = line;
          } else {
            currentBlock += ' ' + line;
          }
        }

        if (currentBlock) {
          const res = parseParticipantBlock(currentBlock);
          if (res) {
            const l2Entry = findL2(res.nku, res.namaPeserta);
            results.push({
              Page: pageNum,
              No: res.no,
              'Nomor Kartu Ujian': res.nku,
              'Nama Peserta': res.namaPeserta,
              Keterangan: res.keterangan,
              Jabatan_Label: res.jabatan,
              satdik: res.satdik,
              peringkat_sebelum_l3: l2Entry ? String(l2Entry['No']) : null,
              status_sebelum_l3: l2Entry ? l2Entry['Keterangan'] : null,
            });
          }
        }

        return text;
      });
    }
  };
  
  await pdfParse(buf, options);
  console.log(`\nTotal pages: ${pageNum}`);
  console.log(`Parsed ${results.length} entries`);
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nSaved ${results.length} entries to ${OUTPUT_PATH}`);
  
  const stats = {};
  const jabatanStats = {};
  for (const r of results) {
    stats[r.Keterangan] = (stats[r.Keterangan] || 0) + 1;
    jabatanStats[r.Jabatan_Label] = (jabatanStats[r.Jabatan_Label] || 0) + 1;
  }
  console.log('Keterangan stats:', JSON.stringify(stats));
  console.log('Jabatan stats:', JSON.stringify(jabatanStats, null, 2));
}

main().catch(console.error);
