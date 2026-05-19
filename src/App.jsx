import React, {useState} from 'react'
import { searchNameInPDF } from './pdfUtils'

export default function App(){
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  async function handleSearch(){
    if(!file || !name) return
    setLoading(true)
    setResults([])
    setProgress('Reading PDF...')
    const arr = await file.arrayBuffer()
    setProgress('Searching...')
    try{
      const res = await searchNameInPDF(arr, name, 'Nama', p=>setProgress(p))
      setResults(res)
    }catch(e){
      console.error(e)
      setResults([{error: String(e)}])
    }finally{
      setLoading(false)
      setProgress('Done')
    }
  }

  return (
    <div style={{fontFamily:'sans-serif',padding:20}}>
      <h2>PDF Column Search</h2>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:10}}>
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <input placeholder="Search name" value={name} onChange={e=>setName(e.target.value)} />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      <div style={{marginBottom:8}}><strong>Progress:</strong> {progress}</div>
      <div>
        {loading && <div>Working…</div>}
        {results.length===0 && !loading && <div>No results yet.</div>}
        <ul>
          {results.map((r,i)=> (
            <li key={i} style={{marginBottom:8}}>
              <div><strong>Page:</strong> {r.page}</div>
              <div><strong>Match:</strong> {r.matchText || r.text || r.error}</div>
              {r.context && <div><strong>Context:</strong> {r.context}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
