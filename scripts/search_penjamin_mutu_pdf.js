const pdfParse = require('pdf-parse');
const fs = require('fs');

const PDF_PATH = './assets/akhir_layer_3/source.pdf';
const buf = fs.readFileSync(PDF_PATH);

let pageNum = 0;
let matchPages = [];

pdfParse(buf, {
  pagerender: function(pageData) {
    pageNum++;
    return pageData.getTextContent().then(function(tc) {
      const text = tc.items.map(it => it.str).join(' ');
      if (text.toUpperCase().includes('PENJAMIN MUTU') || text.toUpperCase().includes('PENJAMIN')) {
        matchPages.push({ page: pageNum, text: text.substring(0, 200) });
      }
      return text;
    });
  }
}).then(() => {
  console.log(`Total halaman dengan PENJAMIN MUTU / PENJAMIN: ${matchPages.length}`);
  if (matchPages.length > 0) {
    console.log('Daftar halaman:', matchPages);
  } else {
    console.log('HASIL: Frasa "PENJAMIN MUTU" / "PENJAMIN" TIDAK DITEMUKAN di seluruh 3.203 halaman source.pdf');
  }
}).catch(console.error);
