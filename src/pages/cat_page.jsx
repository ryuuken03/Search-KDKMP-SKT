import React, { useState } from 'react'
import { searchNameInPDF, getPage1Info } from '../pdfUtils'
import SummaryCat from '../components/summary_cat'

export default function CatPage() {
  const [name, setName] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [pdfBuffer, setPdfBuffer] = useState(null)
  const [page1Info, setPage1Info] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function handleSearch() {
    if (!name) return
    setHasSearched(true)
    setLoading(true)
    setResults([])
    setProgress('Ambil data dari sumber file.')
    try {
      const res = await fetch('/assets/source.pdf')
      if (!res.ok) throw new Error(`Gagal mengambil source.pdf: ${res.status}`)
      const arr = await res.arrayBuffer()
      setPdfBuffer(arr)
      setProgress('Sedang Mencari...')
      const controller = new AbortController()
      setAbortController(controller)
      await searchNameInPDF(arr, name, 'Nama', (p) => setProgress(p), (match) => {
        setResults((prev) => [...prev, match])
      }, controller.signal)
    } catch (e) {
      console.error(e)
      setResults([{ error: String(e) }])
    } finally {
      setLoading(false)
      setProgress('Selesai')
      setAbortController(null)
    }
  }

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/assets/source.pdf')
        if (!res.ok) return
        const arr = await res.arrayBuffer()
        if (!mounted) return
        setPdfBuffer(arr)
        try {
          const info = await getPage1Info(arr)
          if (mounted) setPage1Info(info)
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        /* ignore */
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  function cancelSearch() {
    if (abortController) {
      abortController.abort()
      setProgress('Dibatalkan')
      setLoading(false)
      setAbortController(null)
    }
  }

  return (
    <div className="cat-page">
      {page1Info && (
        <section className="page1-info" aria-label="Rekapitulasi halaman 1 PDF">
          <div className="page1-info__content">
            <p className="page1-info__badge">Halaman 1 · source.pdf</p>
            {page1Info.title && <h2 className="page1-info__title">{page1Info.title}</h2>}
            {page1Info.subtitle && (
              <p className="page1-info__subtitle">{page1Info.subtitle}</p>
            )}
            <SummaryCat summary={page1Info.summary} />
          </div>
        </section>
      )}

      <div className="controls">
        <input
          type="text"
          placeholder="Cari Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading} aria-label="Cari">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 8 }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Cari
        </button>
        {loading && (
          <button type="button" className="secondary" onClick={cancelSearch}>
            Batal
          </button>
        )}
      </div>

      <div className="meta">
        <strong>Progres:</strong> {progress}
      </div>

      <div className="layout">
        <section className="results">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nomor Peserta</th>
                  <th>Nama</th>
                  <th>Kognitif</th>
                  <th>Substansi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const raw = r.contextItems || []
                  const vals = raw.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
                  const noCol = vals[0] ?? i + 1
                  const peserta = vals[1] ?? r.firstCol ?? ''
                  const nama = vals[2] ?? r.matchText ?? ''
                  const kognitif = vals[3] ?? ''
                  const substansi = vals[4] ?? ''
                  const status = vals[5] ?? r.lastCol ?? ''
                  if (r.error) {
                    return (
                      <tr key={i} className="empty-row">
                        <td colSpan={6}>{r.error}</td>
                      </tr>
                    )
                  }
                  return (
                    <tr key={i}>
                      <td data-label="No">{noCol}</td>
                      <td data-label="Nomor Peserta">{peserta}</td>
                      <td data-label="Nama">{nama}</td>
                      <td data-label="Kognitif">{kognitif}</td>
                      <td data-label="Substansi">{substansi}</td>
                      <td data-label="Status">{status}</td>
                    </tr>
                  )
                })}
                {loading && results.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6}>Sedang mencari…</td>
                  </tr>
                )}
                {!loading && hasSearched && results.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6}>Hasil tidak ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
