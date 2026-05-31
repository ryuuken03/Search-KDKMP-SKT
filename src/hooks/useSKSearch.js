import { useState, useEffect } from 'react'

export function useSKSearch(isKnmp) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('Nama')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [loadedChunks, setLoadedChunks] = useState({})
  const [loadedPrefixes, setLoadedPrefixes] = useState({})
  const [page1Info, setPage1Info] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset data and search results when switching between datasets
  useEffect(() => {
    setResults([])
    setHasSearched(false)
    setQuery('')
    setProgress('')
    setPage1Info(null)
    setCurrentPage(1)
  }, [isKnmp])

  const CHUNK_SIZE = 5000

  async function handleSearch() {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return
    setHasSearched(true)
    setLoading(true)
    setResults([])
    setCurrentPage(1)

    const dataset = isKnmp ? 'knmp' : 'kdkmp'

    if (searchMode === 'Peringkat') {
      setProgress('Mencari peringkat...')
      const rankVal = parseInt(trimmedQuery, 10)
      if (isNaN(rankVal) || rankVal <= 0) {
        setResults([{ error: 'Peringkat harus berupa angka positif.' }])
        setProgress('Gagal mencari.')
        setLoading(false)
        return
      }

      const totalRows = page1Info?.summary?.totalRows || (isKnmp ? 72135 : 411516)
      if (rankVal > totalRows) {
        setResults([])
        setProgress('Selesai. Ditemukan 0 hasil.')
        setLoading(false)
        return
      }

      const chunkIdx = Math.floor((rankVal - 1) / CHUNK_SIZE)
      const cacheKey = `${dataset}_${chunkIdx}`
      let chunkData = loadedChunks[cacheKey]

      if (!chunkData) {
        setProgress('Mengunduh data peringkat...')
        const controller = new AbortController()
        setAbortController(controller)
        try {
          const res = await fetch(`/assets/${dataset}/sk/chunks/chunk_${chunkIdx}.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
          chunkData = await res.json()
          setLoadedChunks(prev => ({
            ...prev,
            [cacheKey]: chunkData
          }))
        } catch (e) {
          console.error(e)
          if (e.name === 'AbortError') {
            setProgress('Pencarian dibatalkan')
          } else {
            setResults([{ error: `Gagal memuat data peringkat: ${String(e.message || e)}` }])
            setProgress('Gagal memuat berkas.')
          }
          setLoading(false)
          setAbortController(null)
          return
        }
      }

      const relIdx = (rankVal - 1) % CHUNK_SIZE
      const row = chunkData[relIdx]
      const matches = []

      if (row && String(row[1]) === trimmedQuery) {
        matches.push({
          page: row[0],
          matchText: row[3],
          contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
          firstCol: row[1],
          lastCol: row[6]
        })
      }

      setResults(matches)
      setProgress(`Selesai. Ditemukan ${matches.length} hasil.`)
      setLoading(false)
      setAbortController(null)
    } else {
      // Search by Name (Nama)
      if (trimmedQuery.length < 2) {
        setResults([{ error: 'Masukkan minimal 2 karakter untuk pencarian nama.' }])
        setProgress('Kueri terlalu pendek.')
        setLoading(false)
        return
      }

      setProgress('Menghubungkan ke server data...')
      const queryWords = trimmedQuery.toLowerCase().split(/[^a-z0-9]+/);
      const firstWord = queryWords[0] || '';
      if (!firstWord) {
        setResults([{ error: 'Format pencarian nama tidak valid.' }])
        setProgress('Gagal mencari.')
        setLoading(false)
        return
      }

      const prefix = firstWord.length >= 2 ? firstWord.slice(0, 2) : firstWord;
      const cacheKey = `${dataset}_${prefix}`
      let nameRows = loadedPrefixes[cacheKey]

      if (!nameRows) {
        setProgress(`Mengunduh indeks nama "${prefix.toUpperCase()}"...`)
        const controller = new AbortController()
        setAbortController(controller)
        try {
          const res = await fetch(`/assets/${dataset}/sk/names/${prefix}.json`, { signal: controller.signal })
          if (res.status === 404) {
            setResults([])
            setProgress('Selesai. Ditemukan 0 hasil.')
            setLoading(false)
            setAbortController(null)
            return
          }
          if (!res.ok) throw new Error(`Gagal mengambil data nama: ${res.status}`)
          nameRows = await res.json()
          setLoadedPrefixes(prev => ({
            ...prev,
            [cacheKey]: nameRows
          }))
        } catch (e) {
          console.error(e)
          if (e.name === 'AbortError') {
            setProgress('Pencarian dibatalkan')
          } else {
            setResults([{ error: `Gagal memuat basis data pencarian nama: ${String(e.message || e)}` }])
            setProgress('Gagal memuat berkas.')
          }
          setLoading(false)
          setAbortController(null)
          return
        }
      }

      setProgress('Sedang mencari...')
      try {
        const matches = []
        for (const row of nameRows) {
          const pageNum = row[0]
          const no = row[1]
          const peserta = row[2]
          const nama = row[3]
          const kognitif = row[4]
          const substansi = row[5]
          const status = row[6]

          let matched = true
          for (const qWord of queryWords) {
            if (!nama.toLowerCase().includes(qWord)) {
              matched = false
              break
            }
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
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`/assets/${isKnmp ? 'knmp' : 'kdkmp'}/sk/summary.json`)
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

  // Load the sequential chunk for the current page dynamically if not searched
  useEffect(() => {
    if (hasSearched) return
    let mounted = true
    const chunkIdx = Math.floor((currentPage - 1) / 100)
    const dataset = isKnmp ? 'knmp' : 'kdkmp'
    const cacheKey = `${dataset}_${chunkIdx}`

    if (loadedChunks[cacheKey]) {
      return
    }

    setLoading(true)
    setProgress('Memuat data...')

    ;(async () => {
      try {
        const res = await fetch(`/assets/${dataset}/sk/chunks/chunk_${chunkIdx}.json`)
        if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
        const chunkData = await res.json()
        if (mounted) {
          setLoadedChunks(prev => ({
            ...prev,
            [cacheKey]: chunkData
          }))
          setProgress('')
        }
      } catch (e) {
        console.error(e)
        if (mounted) {
          setProgress('Gagal memuat data.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [currentPage, hasSearched, isKnmp, loadedChunks])

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
  const totalItems = hasSearched
    ? results.length
    : (page1Info?.summary?.totalRows || (isKnmp ? 72135 : 411516))
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE

  const dataset = isKnmp ? 'knmp' : 'kdkmp'
  const chunkIdx = Math.floor((currentPage - 1) / 100)
  const cacheKey = `${dataset}_${chunkIdx}`
  const currentChunk = loadedChunks[cacheKey]
  const relativeStart = ((currentPage - 1) % 100) * ITEMS_PER_PAGE

  const displayItems = hasSearched
    ? results.slice(indexOfFirstItem, indexOfLastItem)
    : (currentChunk
      ? currentChunk.slice(relativeStart, relativeStart + ITEMS_PER_PAGE).map(row => ({
        page: row[0],
        matchText: row[3],
        contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
        firstCol: row[1],
        lastCol: row[6]
      }))
      : [])

  return {
    query,
    setQuery,
    searchMode,
    setSearchMode,
    results,
    loading,
    progress,
    page1Info,
    hasSearched,
    currentPage,
    setCurrentPage,
    handleSearch,
    cancelSearch,
    handleClear,
    ITEMS_PER_PAGE,
    totalItems,
    totalPages,
    indexOfLastItem,
    indexOfFirstItem,
    currentChunk,
    displayItems
  }
}
