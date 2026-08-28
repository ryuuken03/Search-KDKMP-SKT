const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const PDF_PATH = path.join(process.cwd(), 'assets/akhir_layer_3/source.pdf');
const missingSatdik = [
  'AAL',
  'KOLAT KOARMADA I',
  'MENART 1 MAR',
  'PLP 4 PURBOYO',
  'PUSBAHASA AU (304)',
  'PUSLATDIKSARMIL KODIKLATAL',
  'WINGDIK 500 (501,504)',
];

async function main() {
  console.log('Membaca PDF...');
  const buf = fs.readFileSync(PDF_PATH);

  const found = {};
  let totalPages = 0;

  await pdfParse(buf, {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(tc => {
        const text = tc.items.map(it => it.str).join(' ');
        const pageNum = pageData.pageIndex + 1;
        totalPages = pageNum;
        for (const s of missingSatdik) {
          if (text.includes(s)) {
            if (!found[s]) found[s] = [];
            found[s].push(pageNum);
          }
        }
        return text;
      });
    },
  });

  console.log('Total halaman:', totalPages);
  console.log('\nHasil pencarian 7 satdik di PDF L3:');
  for (const s of missingSatdik) {
    if (found[s] && found[s].length > 0) {
      console.log('  ✓ DITEMUKAN:', s);
      console.log('    Halaman:', found[s].slice(0, 10).join(', ') + (found[s].length > 10 ? ` ... (${found[s].length} hal total)` : ''));
    } else {
      console.log('  ✗ TIDAK ADA:', s);
    }
  }
}

main().catch(console.error);
