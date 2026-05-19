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

export async function searchNameInPDF(arrayBuffer, searchName, headerName='Nama', progressCb, onMatch){
  progressCb = progressCb || (()=>{})
  onMatch = onMatch || (()=>{})
  const loadingTask = pdfjsLib.getDocument({data:arrayBuffer})
  const pdf = await loadingTask.promise
  const num = pdf.numPages
  const results = []
  for(let p=1;p<=num;p++){
    progressCb(`Processing page ${p}/${num}`)
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
            const match = {page:p, matchText:cellText, context, contextItems}
            results.push(match)
            onMatch(match)
            pageFound = true
          }
        }
      }
    }
    // fallback: if no structured table match found on this page, do a full-page text search
    if(!pageFound){
      const pageText = items.map(i=>i.str).join(' ')
      const idx = pageText.toLowerCase().indexOf(searchName.toLowerCase())
      if(idx!==-1){
        const start = Math.max(0, idx-60)
        const excerpt = pageText.slice(start, idx+searchName.length+60)
        const match = {page:p, matchText:searchName, context:excerpt, contextItems:[excerpt]}
        results.push(match)
        onMatch(match)
      }
    }
  }
  progressCb(`Found ${results.length} matches`)
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
