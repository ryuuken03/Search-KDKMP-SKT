import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// ─── Jabatan Config ────────────────────────────────────────────────────────
const JABATAN_MAP = {
  'MANAJER OPERASIONAL':   'manajer_operasional',
  'KEPALA PRODUKSI':       'kepala_produksi',
  'PENJAMIN MUTU':         'penjamin_mutu',
  'ADMINISTRASI KEUANGAN': 'administrasi_keuangan',
};
const JABATAN_LIST = Object.keys(JABATAN_MAP);

// ─── PDF Helpers ────────────────────────────────────────────────────────────
function getItemsWithPos(textContent) {
  return textContent.items.map(item => {
    const t = item.transform;
    return { str: item.str, x: t[4], y: t[5] };
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

async function getPageTextLines(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const textContent = await page.getTextContent({ normalizeWhitespace: true });
  const items = getItemsWithPos(textContent);
  const grouped = groupLines(items, 4);
  return grouped.map(lineText).filter(t => t.length > 0);
}

// ─── Summary Detection ──────────────────────────────────────────────────────
function isSummaryPage(textLines) {
  // Halaman summary punya baris header kolom "(1)" sampai "(10)"
  return textLines.some(l => /\(1\)/.test(l) && /\(10\)/.test(l));
}

function detectJabatan(textLines) {
  const combined = textLines.join(' ').toUpperCase();
  for (const jabatan of JABATAN_LIST) {
    if (combined.includes(jabatan)) {
      return jabatan;
    }
  }
  return null;
}

function parseSummaryNumbers(line) {
  const nums = line.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 10) return null;
  return nums.slice(0, 10).map(n => n.replace(',', '.'));
}

function parseSummaryFromLines(textLines) {
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

// ─── Row Extraction ──────────────────────────────────────────────────────────
function extractRowsFromLines(lines, pageNum) {
  const rows = [];
  for (const line of lines) {
    const contextItems = line.items.map(i => i.str);
    const cleanItems = contextItems.map(x => x.trim()).filter(x => x.length > 0);

    // Baris data: diawali angka (No urut) dan punya minimal 6 kolom
    if (cleanItems.length >= 6 && /^\d+$/.test(cleanItems[0])) {
      rows.push([
        pageNum,       // 0: Halaman PDF
        cleanItems[0], // 1: No (peringkat dalam jabatan)
        cleanItems[1], // 2: Nomor Peserta
        cleanItems[2], // 3: Nama
        cleanItems[3], // 4: Kognitif
        cleanItems[4], // 5: Substansi
        cleanItems[5], // 6: Status
      ]);
    }
  }
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function extract() {
  const pdfPath = './assets/knmp/sk/source.pdf';
  const baseOutDir = './assets/knmp/sk';

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
  console.log(`Total Pages: ${num}. Starting first pass to detect summary pages...`);

  // ── Pass 1: Temukan semua halaman summary dan jabatannya ──────────────────
  const summaryPages = []; // [{ pageNum, jabatan, slug, textLines }]

  for (let p = 1; p <= num; p++) {
    if (p % 100 === 0) console.log(`  Scanning page ${p}/${num}...`);
    try {
      const textLines = await getPageTextLines(pdf, p);
      if (isSummaryPage(textLines)) {
        const jabatan = detectJabatan(textLines);
        if (jabatan) {
          const slug = JABATAN_MAP[jabatan];
          console.log(`  ✓ Found summary page ${p}: ${jabatan} → ${slug}`);
          summaryPages.push({ pageNum: p, jabatan, slug, textLines });
        } else {
          console.warn(`  ⚠ Summary page ${p} found but jabatan not recognized.`);
        }
      }
    } catch (err) {
      console.error(`  Error scanning page ${p}:`, err.message);
    }
  }

  if (summaryPages.length === 0) {
    console.error('No summary pages found! Check PDF structure.');
    return;
  }

  console.log(`\nFound ${summaryPages.length} summary page(s): ${summaryPages.map(s => s.jabatan).join(', ')}`);

  // ── Pass 2: Ekstrak data per jabatan ─────────────────────────────────────
  const jabatanResults = {}; // slug → { summary, rows }

  for (let i = 0; i < summaryPages.length; i++) {
    const { pageNum: summaryPg, jabatan, slug, textLines } = summaryPages[i];
    const nextSummaryPg = summaryPages[i + 1]?.pageNum ?? (num + 1);
    const dataStartPg = summaryPg + 1;
    const dataEndPg = nextSummaryPg - 1;

    console.log(`\n=== Processing: ${jabatan} (pages ${dataStartPg}–${dataEndPg}) ===`);

    // Parse summary dari halaman summary
    const summary = parseSummaryFromLines(textLines);
    if (!summary) {
      console.warn(`  ⚠ Could not parse summary for ${jabatan}, skipping.`);
      continue;
    }
    summary.jabatan = jabatan;

    // Ekstrak rows dari halaman data jabatan ini
    const rows = [];
    for (let p = dataStartPg; p <= dataEndPg; p++) {
      if (p % 500 === 0 || p === dataEndPg) {
        console.log(`  Processing page ${p}/${dataEndPg}...`);
      }
      try {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent({ normalizeWhitespace: true });
        const items = getItemsWithPos(textContent);
        const lines = groupLines(items, 4);
        if (lines.length === 0) continue;
        const pageRows = extractRowsFromLines(lines, p);
        rows.push(...pageRows);
      } catch (err) {
        console.error(`  Error on page ${p}:`, err.message);
      }
    }

    console.log(`  Extracted ${rows.length} rows for ${jabatan}`);
    jabatanResults[slug] = { jabatan, summary, rows };
  }

  // ── Pass 3: Hitung statusCounts dan tulis output ──────────────────────────
  let totalAllRows = 0;

  for (const [slug, { jabatan, summary, rows }] of Object.entries(jabatanResults)) {
    console.log(`\n=== Writing output: ${jabatan} → ${slug}/ ===`);

    const outDir = path.join(baseOutDir, slug);
    fs.mkdirSync(outDir, { recursive: true });

    // Hitung statusCounts
    const statusCounts = {};
    for (const row of rows) {
      const status = row[6];
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    }

    // Tulis data.json (kompak)
    const dataPath = path.join(outDir, 'data.json');
    const finalData = { summary: { ...summary, statusCounts, totalRows: rows.length }, rows };
    fs.writeFileSync(dataPath, JSON.stringify(finalData));
    const dataSizeMB = (fs.statSync(dataPath).size / (1024 * 1024)).toFixed(2);
    console.log(`  Saved data.json (${dataSizeMB} MB) — ${rows.length} rows`);

    // Tulis summary.json (pretty)
    const fullSummary = { ...summary, statusCounts, totalRows: rows.length };
    const summaryPath = path.join(outDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(fullSummary, null, 2));
    console.log(`  Saved summary.json`);

    totalAllRows += rows.length;
  }

  console.log(`\n✓ Extraction complete! Total rows across all jabatan: ${totalAllRows}`);
  console.log('Run `node scripts/partition_knmp.mjs` to generate chunks, names, and no_peserta indexes.');
}

extract().catch(console.error);
