import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

function getItemsWithPos(textContent) {
  return textContent.items.map(item => {
    const t = item.transform;
    return {
      str: item.str,
      x: t[4],
      y: t[5]
    };
  });
}

function groupLines(items, tolerance = 4) {
  const lines = [];
  const sorted = items.slice().sort((a, b) => b.y - a.y);
  for (const it of sorted) {
    let placed = false;
    for (const line of lines) {
      if (Math.abs(line.y - it.y) <= tolerance) {
        line.items.push(it);
        placed = true;
        break;
      }
    }
    if (!placed) lines.push({ y: it.y, items: [it] });
  }
  lines.forEach(l => l.items.sort((a, b) => a.x - b.x));
  return lines;
}

function lineText(line) {
  return line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
}

function parseSummaryNumbers(line) {
  const nums = line.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 10) return null;
  return nums.slice(0, 10).map(n => n.replace(',', '.'));
}

function parsePage1Summary(textLines) {
  const colIdx = textLines.findIndex(
    l => /\(1\)/.test(l) && /\(10\)/.test(l)
  );
  if (colIdx < 0) return null;

  const dataLine = textLines[colIdx + 1];
  if (!dataLine) return null;

  const nums = parseSummaryNumbers(dataLine);
  if (!nums) return null;

  const [jumlahFormasi, jumlahPeserta, hadir, tidakHadir, lulusJumlah, lulusPersen, kogTinggi, kogRendah, subTinggi, subRendah] = nums;

  return {
    jumlahFormasi,
    jumlahPeserta,
    kehadiran: { hadir, tidakHadir },
    kelulusan: { jumlah: lulusJumlah, persen: lulusPersen },
    nilaiKognitif: { tertinggi: kogTinggi, terendah: kogRendah },
    nilaiSubstansi: { tertinggi: subTinggi, terendah: subRendah },
  };
}

async function extract() {
  const pdfPath = './assets/kdkmp/sk/source.pdf';
  const outPath = './assets/kdkmp/sk/data.json';

  console.log('Loading PDF from:', pdfPath);
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File ${pdfPath} not found.`);
    return;
  }

  const buffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const num = pdf.numPages;
  console.log(`Total Pages: ${num}. Starting extraction...`);

  let summary = null;
  const rows = [];

  // 1. Ekstrak halaman 1 untuk data Ringkasan / Summary
  console.log('Extracting Page 1 summary...');
  try {
    const page1 = await pdf.getPage(1);
    const textContent1 = await page1.getTextContent({ normalizeWhitespace: true });
    const items1 = getItemsWithPos(textContent1);
    const groupedLines1 = groupLines(items1, 4);
    const textLines1 = groupedLines1.map(lineText).filter(t => t.length > 0);
    summary = parsePage1Summary(textLines1);
    console.log('Summary extracted successfully:', summary);
  } catch (err) {
    console.error('Error extracting page 1 summary:', err);
  }

  // 2. Ekstrak halaman 2 sampai selesai untuk data Peserta
  for (let p = 2; p <= num; p++) {
    if (p % 500 === 0 || p === num) {
      console.log(`Processing page ${p}/${num}...`);
    }
    try {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent({ normalizeWhitespace: true });
      const items = getItemsWithPos(textContent);
      const lines = groupLines(items, 4);
      if (lines.length === 0) continue;

      for (const line of lines) {
        const contextItems = line.items.map(i => i.str);
        const cleanItems = contextItems.map(x => x.trim()).filter(x => x.length > 0);

        // Jika baris dimulai dengan angka (No urut peserta) dan memiliki minimal 6 kolom data
        if (cleanItems.length >= 6 && /^\d+$/.test(cleanItems[0])) {
          // Format kolom: [No, Nomor Peserta, Nama, Kognitif, Substansi, Status]
          // cleanItems[0] = No
          // cleanItems[1] = Nomor Peserta
          // cleanItems[2] = Nama
          // cleanItems[3] = Kognitif
          // cleanItems[4] = Substansi
          // cleanItems[5] = Status / Hasil (P/L, dsb)
          rows.push([
            p,                  // Index 0: Halaman
            cleanItems[0],      // Index 1: No
            cleanItems[1],      // Index 2: Nomor Peserta
            cleanItems[2],      // Index 3: Nama
            cleanItems[3],      // Index 4: Kognitif
            cleanItems[4],      // Index 5: Substansi
            cleanItems[5]       // Index 6: Status
          ]);
        }
      }
    } catch (err) {
      console.error(`Error on page ${p}:`, err);
    }
  }

  console.log(`\nExtraction complete. Extracted ${rows.length} rows.`);

  const finalData = {
    summary,
    rows
  };

  // Tulis file JSON secara padat (tanpa indentasi) untuk menghemat ukuran berkas
  fs.writeFileSync(outPath, JSON.stringify(finalData));
  console.log(`Saved compact JSON to ${outPath} (${(fs.statSync(outPath).size / (1024 * 1024)).toFixed(2)} MB)`);

  // Hitung statusCounts dan simpan summary.json secara terpisah
  const statusCounts = {};
  for (const row of rows) {
    const status = row[6];
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
  if (summary) {
    summary.statusCounts = statusCounts;
    const summaryPath = path.join(path.dirname(outPath), 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Saved summary JSON to ${summaryPath}`);
  }
}

extract().catch(console.error);
