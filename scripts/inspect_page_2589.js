const pdfParse = require('pdf-parse');
const fs = require('fs');

const PDF_PATH = './assets/akhir_layer_3/source.pdf';
const buf = fs.readFileSync(PDF_PATH);

let targetPage = 2589;
let currentPage = 0;

pdfParse(buf, {
  pagerender: function(pageData) {
    currentPage++;
    if (currentPage === targetPage) {
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
        return text;
      });
    }
    return '';
  }
}).then(data => {
  const lines = data.text.split('\n');
  console.log('--- RAW LINES HALAMAN 2589 ---');
  lines.forEach((l, idx) => {
    console.log(`[${idx}] ${l}`);
  });
}).catch(console.error);
