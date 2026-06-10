import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText() {
    const data = new Uint8Array(fs.readFileSync('assets/akhir/source.pdf'));
    const doc = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    let pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        pages.push(pageText);
        text += `\n--- PAGE ${i} ---\n` + pageText;
    }
    fs.writeFileSync('scratch_pdf_text.txt', text);
    fs.writeFileSync('scratch_pdf_pages.json', JSON.stringify(pages, null, 2));
    console.log("Extracted with pdfjs-dist legacy mjs");
}

extractText().catch(console.error);
