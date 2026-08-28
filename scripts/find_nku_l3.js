const pdfParse = require('pdf-parse');
const fs = require('fs');

const PDF_PATH = './assets/akhir_layer_3/source.pdf';
const buf = fs.readFileSync(PDF_PATH);

let targetNKU = 'P2640758120182117';

let pageNum = 0;
let matchDetails = [];

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
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(targetNKU) || line.includes('DIAN REZKI')) {
          matchDetails.push({
            page: pageNum,
            lineIndex: i,
            line: line,
            surrounding: lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3))
          });
        }
      }
      return text;
    });
  }
}).then(() => {
  console.log(`Found ${matchDetails.length} matches for ${targetNKU}`);
  console.log(JSON.stringify(matchDetails, null, 2));
}).catch(console.error);
