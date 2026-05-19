import React, {useState} from 'react'
import { searchNameInPDF, renderPageAsImage } from './pdfUtils'

export default function App(){
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [pdfBuffer, setPdfBuffer] = useState(null)
  const [preview, setPreview] = useState(null)
  const [abortController, setAbortController] = useState(null)

  async function handleSearch(){
    if(!file || !name) return
    setLoading(true)
    setResults([])
    setProgress('Reading PDF...')
    const arr = await file.arrayBuffer()
    setPdfBuffer(arr)
    setProgress('Searching...')
    try{
      const controller = new AbortController()
      setAbortController(controller)
      await searchNameInPDF(arr, name, 'Nama', p=>setProgress(p), match=>{
        setResults(prev=>[...prev, match])
      }, controller.signal)
    }catch(e){
      console.error(e)
      setResults([{error: String(e)}])
    }finally{
      setLoading(false)
      setProgress('Done')
      setAbortController(null)
    }
  }

  function cancelSearch(){
    if(abortController){
      abortController.abort()
      setProgress('Cancelled')
      setLoading(false)
      setAbortController(null)
    }
  }

  async function showPage(page){
    if(!pdfBuffer) return
    setProgress('Rendering page...')
    try{
      const img = await renderPageAsImage(pdfBuffer, page, 1.5)
      setPreview({page, img})
      setProgress('Rendered')
    }catch(e){
      console.error(e)
      setProgress('Render failed')
    }
  }

  return (
    <div style={{fontFamily:'sans-serif',padding:20}}>
      <h2>PDF Column Search</h2>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <input placeholder="Search name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={handleSearch} disabled={loading}>Search</button>
        {loading && <button onClick={cancelSearch}>Cancel</button>}
      </div>
      <div style={{marginBottom:8}}><strong>Progress:</strong> {progress}</div>
      <div>
        {loading && <div>Working…</div>}
        {results.length===0 && !loading && <div>No results yet.</div>}
        <ul>
            {results.map((r,i)=> (
              <li key={i} style={{marginBottom:8}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <div><strong>Page:</strong> {r.page}</div>
                  <div><strong>Match:</strong> {r.matchText || r.text || r.error}</div>
                  <button onClick={()=>showPage(r.page)}>Show</button>
                </div>
                {(r.firstCol || r.lastCol) && (
                  <div style={{marginTop:6}}>
                    <strong>No:</strong> {r.firstCol} &nbsp;&nbsp; <strong>Status:</strong> {r.lastCol}
                  </div>
                )}

                {r.contextItems && (
                  <div style={{marginTop:6}}>
                    <strong>Context:</strong>
                    <div style={{overflowX:'auto',marginTop:6}}>
                      <table style={{borderCollapse:'collapse',width:'100%'}}>
                        <tbody>
                          <tr>
                            {r.contextItems.map((c,ci)=> (
                              <td key={ci} style={{border:'1px solid #ddd',padding:'6px',whiteSpace:'nowrap'}}>{c}</td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {r.context && !r.contextItems && <div><strong>Context:</strong> {r.context}</div>}
              </li>
            ))}
        </ul>
      </div>
        {preview && (
          <div style={{marginTop:12}}>
            <h4>Preview - page {preview.page}</h4>
            <img src={preview.img} alt={`page ${preview.page}`} style={{maxWidth:'100%',border:'1px solid #ccc'}} />
          </div>
        )}
    </div>
  )
}
