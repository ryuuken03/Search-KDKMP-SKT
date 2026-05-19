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

    let arr = pdfBuffer
    if (!arr) {
      setProgress('Menghubungkan ke sumber file...')
      try {
        const res = await fetch('/assets/source.pdf')
        if (!res.ok) throw new Error(`Gagal mengambil source.pdf: ${res.status}`)

        const contentLength = res.headers.get('content-length')
        const total = contentLength ? parseInt(contentLength, 10) : 0
        const reader = res.body.getReader()
        let loaded = 0
        const chunks = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          loaded += value.length

          if (total) {
            const percent = Math.round((loaded / total) * 100)
            const loadedMb = (loaded / (1024 * 1024)).toFixed(1)
            const totalMb = (total / (1024 * 1024)).toFixed(1)
            setProgress(`Mengunduh berkas KDKMP: ${percent}% (${loadedMb} MB / ${totalMb} MB)`)
          } else {
            const loadedMb = (loaded / (1024 * 1024)).toFixed(1)
            setProgress(`Mengunduh berkas KDKMP: ${loadedMb} MB...`)
          }
        }

        const pdfArrayBuffer = new Uint8Array(loaded)
        let offset = 0
        for (const chunk of chunks) {
          pdfArrayBuffer.set(chunk, offset)
          offset += chunk.length
        }
        arr = pdfArrayBuffer.buffer
        setPdfBuffer(arr)
      } catch (e) {
        console.error(e)
        setResults([{ error: `Gagal mengunduh berkas KDKMP: ${String(e.message || e)}` }])
        setLoading(false)
        setProgress('Gagal memuat berkas.')
        return
      }
    }

    setProgress('Sedang Mencari...')
    try {
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
        // Ambil info halaman 1 secara langsung via URL menggunakan HTTP Range Request (tidak mengunduh seluruh 95MB berkas)
        const info = await getPage1Info('/assets/source.pdf')
        if (mounted) {
          setPage1Info(info)
        }
      } catch (e) {
        console.error('Gagal mengambil ringkasan halaman 1:', e)
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
