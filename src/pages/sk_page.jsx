import React, { useState } from 'react'
import SummarySK from '../components/summary_sk'

export default function SKPage({ isKnmp }) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('Nama')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [jsonData, setJsonData] = useState(null)
  const [page1Info, setPage1Info] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset data and search results when switching between datasets
  React.useEffect(() => {
    setJsonData(null)
    setResults([])
    setHasSearched(false)
    setQuery('')
    setProgress('')
    setPage1Info(null)
  }, [isKnmp])

  async function handleSearch() {
    if (!query.trim()) return
    setHasSearched(true)
    setLoading(true)
    setResults([])
    setCurrentPage(1)

    let rows = jsonData
    if (!rows) {
      setProgress('Menghubungkan ke server data...')
      const controller = new AbortController()
      setAbortController(controller)
      try {
        const res = await fetch(`/assets/${isKnmp ? 'knmp' : 'kdkmp'}/data.json`, { signal: controller.signal })
        if (!res.ok) throw new Error(`Gagal mengambil data pencarian: ${res.status}`)

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
            setProgress(`Mengunduh basis data pencarian ${isKnmp ? 'KNMP' : 'KDKMP'}: ${percent}% (${loadedMb} MB / ${totalMb} MB)`)
          } else {
            const loadedMb = (loaded / (1024 * 1024)).toFixed(1)
            setProgress(`Mengunduh basis data pencarian ${isKnmp ? 'KNMP' : 'KDKMP'}: ${loadedMb} MB...`)
          }
        }

        const jsonBytes = new Uint8Array(loaded)
        let offset = 0
        for (const chunk of chunks) {
          jsonBytes.set(chunk, offset)
          offset += chunk.length
        }

        const decoder = new TextDecoder('utf-8')
        const jsonText = decoder.decode(jsonBytes)
        const parsed = JSON.parse(jsonText)
        rows = parsed.rows || parsed
        setJsonData(rows)
      } catch (e) {
        console.error(e)
        if (e.name === 'AbortError') {
          setProgress('Pencarian dibatalkan')
        } else {
          setResults([{ error: `Gagal memuat basis data pencarian: ${String(e.message || e)}` }])
          setProgress('Gagal memuat berkas.')
        }
        setLoading(false)
        setAbortController(null)
        return
      }
    }

    setProgress('Sedang mencari...')
    try {
      const trimmedQuery = query.trim()
      const matches = []

      // Format kolom dalam data.json: [page, no, peserta, nama, kognitif, substansi, status]
      for (const row of rows) {
        const pageNum = row[0]
        const no = row[1]
        const peserta = row[2]
        const nama = row[3]
        const kognitif = row[4]
        const substansi = row[5]
        const status = row[6]

        let matched = false
        if (searchMode === 'Nama') {
          matched = nama.toLowerCase().includes(trimmedQuery.toLowerCase())
        } else {
          matched = String(no) === trimmedQuery
        }

        if (matched) {
          matches.push({
            page: pageNum,
            matchText: nama,
            contextItems: [no, peserta, nama, kognitif, substansi, status],
            firstCol: no,
            lastCol: status
          })
        }
      }

      setResults(matches)
      setProgress(`Selesai. Ditemukan ${matches.length} hasil.`)
    } catch (e) {
      console.error(e)
      setResults([{ error: String(e) }])
      setProgress('Error dalam pencarian.')
    } finally {
      setLoading(false)
      setAbortController(null)
    }
  }

  React.useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch(`/assets/${isKnmp ? 'knmp' : 'kdkmp'}/summary.json`)
          if (!res.ok) return
          const data = await res.json()
          if (mounted) {
            setPage1Info({
              title: `Hasil Seleksi ${isKnmp ? 'KNMP' : 'KDKMP'} Seleksi Kompetensi`,
              subtitle: 'Laporan Rekapitulasi Nilai Seleksi',
              summary: data
            })
          }
        } catch (e) {
          console.error('Gagal mengambil ringkasan:', e)
        }
      })()
    return () => {
      mounted = false
    }
  }, [isKnmp])

  // Silently preload data on mount/change so the default first-page view works instantly
  React.useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          const res = await fetch(`/assets/${isKnmp ? 'knmp' : 'kdkmp'}/data.json`)
          if (!res.ok) return
          const text = await res.text()
          if (mounted) {
            const parsed = JSON.parse(text)
            setJsonData(parsed.rows || parsed)
          }
        } catch (e) {
          console.error('Gagal memuat data awal:', e)
        }
      })()
    return () => {
      mounted = false
    }
  }, [isKnmp])

  function cancelSearch() {
    if (abortController) {
      abortController.abort()
      setProgress('Dibatalkan')
      setLoading(false)
      setAbortController(null)
    }
  }

  function handleClear() {
    setQuery('')
    setResults([])
    setHasSearched(false)
    setCurrentPage(1)
    setProgress('')
  }


  const ITEMS_PER_PAGE = 50
  const totalItems = hasSearched ? results.length : (jsonData ? jsonData.length : 0)
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE

  const displayItems = hasSearched
    ? results.slice(indexOfFirstItem, indexOfLastItem)
    : (jsonData
      ? jsonData.slice(indexOfFirstItem, indexOfLastItem).map(row => ({
        page: row[0],
        matchText: row[3],
        contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
        firstCol: row[1],
        lastCol: row[6]
      }))
      : [])

  const getPageNumbers = () => {
    const pages = []
    const range = 2

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - range)
      let end = Math.min(totalPages - 1, currentPage + range)

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="sk-page">
      {page1Info && (
        <section className="page1-info" aria-label="Rekapitulasi halaman 1 PDF">
          <div className="page1-info__content">
            <p className="page1-info__badge">Ringkasan Seleksi</p>
            {page1Info.title && <h2 className="page1-info__title">{page1Info.title}</h2>}
            {page1Info.subtitle && (
              <p className="page1-info__subtitle">{page1Info.subtitle}</p>
            )}
            <SummarySK summary={page1Info.summary} isKnmp={isKnmp} />
          </div>
        </section>
      )}

      <div className="controls">
        <div className="controls__fields">
          <input
            id="search-query"
            type={searchMode === 'Peringkat' ? 'number' : 'text'}
            placeholder={searchMode === 'Nama' ? 'Cari Nama Peserta...' : 'Cari Peringkat (angka)...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="controls__actions">
          <select
            id="search-mode"
            value={searchMode}
            onChange={(e) => { setSearchMode(e.target.value); setQuery('') }}
            aria-label="Mode Pencarian"
          >
            <option value="Nama">Nama</option>
            <option value="Peringkat">Peringkat</option>
          </select>
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
          {!loading && hasSearched && (
            <button type="button" className="secondary" onClick={handleClear} aria-label="Clear">
              Clear
            </button>
          )}
        </div>
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
                  <th>Peringkat</th>
                  <th>No Peserta</th>
                  <th>Nama</th>
                  <th>Kognitif</th>
                  <th>Substansi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((r, i) => {
                  const raw = r.contextItems || []
                  const vals = raw.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
                  const noCol = vals[0] ?? (indexOfFirstItem + i + 1)
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
                      <td data-label="Peringkat"><span>{noCol}</span></td>
                      <td data-label="No Peserta"><span>{peserta}</span></td>
                      <td data-label="Nama"><span>{nama}</span></td>
                      <td data-label="Kognitif"><span>{kognitif}</span></td>
                      <td data-label="Substansi"><span>{substansi}</span></td>
                      <td data-label="Status"><span>{status}</span></td>
                    </tr>
                  )
                })}
                {loading && results.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6}>Sedang mencari…</td>
                  </tr>
                )}
                {!loading && !hasSearched && !jsonData && (
                  <tr className="empty-row">
                    <td colSpan={6}>Memuat data...</td>
                  </tr>
                )}
                {!loading && hasSearched && results.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={6}>Hasil tidak ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalItems > ITEMS_PER_PAGE && (
              <div className="pagination">
                <div className="pagination__info">
                  Menampilkan <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, totalItems)}</strong> dari <strong>{totalItems}</strong> {hasSearched ? 'hasil' : 'data'}
                </div>
                <div className="pagination__buttons">
                  <button
                    className="pagination__btn"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    aria-label="Halaman Pertama"
                  >
                    &laquo;
                  </button>
                  <button
                    className="pagination__btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    aria-label="Halaman Sebelumnya"
                  >
                    &lsaquo;
                  </button>

                  {getPageNumbers().map((p, idx) => {
                    if (p === '...') {
                      return <span key={`ellipsis-${idx}`} className="pagination__ellipsis">&hellip;</span>
                    }
                    return (
                      <button
                        key={`page-${p}`}
                        className={`pagination__btn ${currentPage === p ? 'active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    )
                  })}

                  <button
                    className="pagination__btn"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman Berikutnya"
                  >
                    &rsaquo;
                  </button>
                  <button
                    className="pagination__btn"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman Terakhir"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
