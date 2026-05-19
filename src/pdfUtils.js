import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

function getItemsWithPos(textContent){
  return textContent.items.map(item=>{
    const t = item.transform
    return {
      str: item.str,
      x: t[4],
      y: t[5]
    }
  })
}

function groupLines(items, tolerance=4){
  const lines = []
  const sorted = items.slice().sort((a,b)=>b.y-a.y)
  for(const it of sorted){
    let placed = false
    for(const line of lines){
      if(Math.abs(line.y - it.y) <= tolerance){
        line.items.push(it)
        placed = true
        break
      }
    }
    if(!placed) lines.push({y:it.y, items:[it]})
  }
  // sort items in each line by x
  lines.forEach(l=> l.items.sort((a,b)=>a.x-b.x))
  return lines
}

function findHeaderColumn(headerLine, headerName){
  for(const it of headerLine.items){
    if(it.str && it.str.toLowerCase().includes(headerName.toLowerCase())){
      return it.x
    }
  }
  return null
}

function textForColumn(line, colX, xTol=20){
  // concatenate items whose x is near colX (within tolerance) or the nearest one
  const candidates = line.items.filter(i=>Math.abs(i.x - colX) <= xTol)
  if(candidates.length>0) return candidates.map(c=>c.str).join(' ')
  // fallback: nearest item
  let nearest = null; let best=Infinity
  for(const it of line.items){
    const d = Math.abs(it.x - colX)
    if(d < best){ best = d; nearest = it }
  }
  return nearest ? nearest.str : ''
}

export async function searchNameInPDF(source, searchName, headerName='Nama', progressCb, onMatch, signal){
  progressCb = progressCb || (()=>{})
  onMatch = onMatch || (()=>{})
  signal = signal || null
  const param = typeof source === 'string' ? { url: source } : { data: source }
  const loadingTask = pdfjsLib.getDocument(param)
  const pdf = await loadingTask.promise
  const num = pdf.numPages
  const results = []
  for(let p=1;p<=num;p++){
    if(signal && signal.aborted){
      progressCb('Pencarian dibatalkan')
      return results
    }
    progressCb(`Memproses halaman ${p}/${num}`)
    const page = await pdf.getPage(p)
    const textContent = await page.getTextContent({normalizeWhitespace:true})
    const items = getItemsWithPos(textContent)
    const lines = groupLines(items, 4)
    if(lines.length===0) continue
    // attempt to find header line by scanning lines for headerName
    const headerLine = lines.find(l => l.items.some(it => it.str && it.str.toLowerCase().includes(headerName.toLowerCase())))
    let pageFound = false
    if(headerLine){
      const colX = findHeaderColumn(headerLine, headerName)
      if(colX!==null){
        // for each line after the header line (assume rows), get column text
        const headerIndex = lines.indexOf(headerLine)
        for(const line of lines.slice(headerIndex + 1)){
          const cellText = textForColumn(line, colX, 24)
          if(!cellText) continue
          if(cellText.toLowerCase().includes(searchName.toLowerCase())){
            // capture some context: join line items
            const context = line.items.map(i=>i.str).join(' ')
            const contextItems = line.items.map(i=>i.str)
            const firstCol = contextItems.length>0 ? contextItems[0] : ''
            const lastCol = contextItems.length>0 ? contextItems[contextItems.length-1] : ''
            const match = {page:p, matchText:cellText, context, contextItems, firstCol, lastCol}
            results.push(match)
            onMatch(match)
            pageFound = true
          }
        }
      }
    }
    // fallback: if no structured table match found on this page, do a full-page text search
    if(!pageFound){
      // try to find the specific line containing the match
      let foundLine = null
      for(const line of lines){
        const lineText = line.items.map(i=>i.str).join(' ')
        if(lineText.toLowerCase().includes(searchName.toLowerCase())){ foundLine = line; break }
      }
      if(foundLine){
        const context = foundLine.items.map(i=>i.str).join(' ')
        const contextItems = foundLine.items.map(i=>i.str)
        const firstCol = contextItems.length>0 ? contextItems[0] : ''
        const lastCol = contextItems.length>0 ? contextItems[contextItems.length-1] : ''
        const match = {page:p, matchText:searchName, context, contextItems, firstCol, lastCol}
        results.push(match)
        onMatch(match)
      }else{
        const pageText = items.map(i=>i.str).join(' ')
        const idx = pageText.toLowerCase().indexOf(searchName.toLowerCase())
        if(idx!==-1){
          const start = Math.max(0, idx-60)
          const excerpt = pageText.slice(start, idx+searchName.length+60)
          const firstCol = items.length>0 ? items[0].str : ''
          const lastCol = items.length>0 ? items[items.length-1].str : ''
          const match = {page:p, matchText:searchName, context:excerpt, contextItems:[excerpt], firstCol, lastCol}
          results.push(match)
          onMatch(match)
        }
      }
    }
  }
  progressCb(`Ditemukan ${results.length} hasil`)
  return results
}

export async function renderPageAsImage(arrayBuffer, pageNumber, scale=1.5){
  const loadingTask = pdfjsLib.getDocument({data:arrayBuffer})
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({scale})

  // create a canvas element to render the page
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  const ctx = canvas.getContext('2d')

  const renderContext = {
    canvasContext: ctx,
    viewport
  }

  await page.render(renderContext).promise
  // return a data URL for display
  return canvas.toDataURL('image/png')
}

export async function getPDFInfo(arrayBuffer){
  const loadingTask = pdfjsLib.getDocument({data:arrayBuffer})
  const pdf = await loadingTask.promise
  return { numPages: pdf.numPages }
}

function lineText(line){
  return line.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim()
}

function isTableHeaderLine(line){
  const lower = line.toLowerCase()
  const hasNama = /\bnama\b/.test(lower)
  const hasTableHint = /\b(no|nomor|peserta|kognitif|substansi|status)\b/.test(lower)
  return hasNama && hasTableHint
}

function parseSummaryNumbers(line){
  const nums = line.match(/\d+(?:[.,]\d+)?/g)
  if(!nums || nums.length < 10) return null
  return nums.slice(0, 10).map(n => n.replace(',', '.'))
}

/** Rekap statistik halaman 1 (tabel ringkasan sebelum daftar peserta). */
export function parsePage1Summary(textLines){
  const colIdx = textLines.findIndex(
    l => /\(1\)/.test(l) && /\(10\)/.test(l)
  )
  if(colIdx < 0) return null

  const dataLine = textLines[colIdx + 1]
  if(!dataLine) return null

  const nums = parseSummaryNumbers(dataLine)
  if(!nums) return null

  const [jumlahFormasi, jumlahPeserta, hadir, tidakHadir, lulusJumlah, lulusPersen, kogTinggi, kogRendah, subTinggi, subRendah] = nums

  return {
    jumlahFormasi,
    jumlahPeserta,
    kehadiran: { hadir, tidakHadir },
    kelulusan: { jumlah: lulusJumlah, persen: lulusPersen },
    nilaiKognitif: { tertinggi: kogTinggi, terendah: kogRendah },
    nilaiSubstansi: { tertinggi: subTinggi, terendah: subRendah },
  }
}

/** Informasi halaman 1: judul + tabel rekap statistik. */
export async function getPage1Info(source){
  const param = typeof source === 'string' ? { url: source } : { data: source }
  const loadingTask = pdfjsLib.getDocument(param)
  const pdf = await loadingTask.promise
  const page = await pdf.getPage(1)
  const textContent = await page.getTextContent({normalizeWhitespace: true})
  const items = getItemsWithPos(textContent)
  const groupedLines = groupLines(items, 4)

  const textLines = groupedLines
    .map(lineText)
    .filter(t => t.length > 0)

  const headerIdx = textLines.findIndex(isTableHeaderLine)
  const introLines = (headerIdx > 0 ? textLines.slice(0, headerIdx) : textLines.slice(0, 12))
    .filter(t => t.length > 1 && !/^\(\d+\)$/.test(t.trim()))

  const title = introLines[0] || ''
  const subtitle = introLines[1] || ''
  const metaLines = introLines.slice(2).filter(l => !/^\d+$/.test(l.replace(/\s/g, '')))

  const summary = parsePage1Summary(textLines)

  return {
    numPages: pdf.numPages,
    title,
    subtitle: subtitle !== title ? subtitle : '',
    metaLines,
    summary,
  }
}
