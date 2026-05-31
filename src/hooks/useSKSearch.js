import { useState, useEffect } from 'react'

export function detectSearchMode(queryStr, totalRows) {
  const trimmed = queryStr.trim()
  // 1. Diawali huruf P/p diikuti angka
  if (/^[pP]\d+$/.test(trimmed)) {
    return 'Nomor Peserta'
  }
  // 2. Angka murni
  if (/^\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (num <= totalRows) {
      return 'Peringkat'
    } else {
      return 'Nomor Peserta'
    }
  }
  // 3. Sisanya adalah Nama
  return 'Nama'
}

export function useSKSearch(isKnmp) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('Nama')
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [results, setResults] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [loadedChunks, setLoadedChunks] = useState({})
  const [loadedPrefixes, setLoadedPrefixes] = useState({})
  const [loadedParticipantNumbers, setLoadedParticipantNumbers] = useState({})
  const [page1Info, setPage1Info] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Reset data and search results when switching between datasets
  useEffect(() => {
    setResults([])
    setHasSearched(false)
    setQuery('')
    setLastSearchedQuery('')
    setProgress('')
    setPage1Info(null)
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })
  }, [isKnmp])

  const CHUNK_SIZE = 5000

  async function handleSearch(overrideMode) {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const totalRows = page1Info?.summary?.totalRows || (isKnmp ? 72135 : 411516)
    const mode = overrideMode || detectSearchMode(trimmedQuery, totalRows)

    setSearchMode(mode)
    setLastSearchedQuery(trimmedQuery)
    setHasSearched(true)
    setLoading(true)
    setResults([])
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })

    const dataset = isKnmp ? 'knmp' : 'kdkmp'

    if (mode === 'Peringkat') {
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
    } else if (mode === 'Nomor Peserta') {
      setProgress('Mencari nomor peserta...')
      const totalRows = page1Info?.summary?.totalRows || (isKnmp ? 72135 : 411516)
      const matches = []
      const queryUpper = trimmedQuery.toUpperCase()
      const isStartsWithP = queryUpper.startsWith('P')

      const controller = new AbortController()
      setAbortController(controller)

      try {
        let indexList = loadedParticipantNumbers[dataset]
        if (!indexList) {
          setProgress('Mengunduh indeks nomor peserta...')
          const res = await fetch(`/assets/${dataset}/sk/no_peserta.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat indeks nomor peserta: ${res.status}`)
          indexList = await res.json()
          setLoadedParticipantNumbers(prev => ({
            ...prev,
            [dataset]: indexList
          }))
        }

        setProgress('Memindai indeks nomor peserta...')
        const matchedRanks = []
        for (let i = 0; i < indexList.length; i++) {
          const val = String(indexList[i] || '').toUpperCase()
          const isMatch = isStartsWithP ? val.startsWith(queryUpper) : val.includes(queryUpper)
          if (isMatch) {
            matchedRanks.push(i + 1)
            if (matchedRanks.length >= 1000) {
              break
            }
          }
        }

        const uniqueChunkIndices = [...new Set(matchedRanks.map(rank => Math.floor((rank - 1) / CHUNK_SIZE)))]

        if (uniqueChunkIndices.length > 0) {
          setProgress(`Memuat ${uniqueChunkIndices.length} grup data yang cocok...`)
          const newChunks = {}
          await Promise.all(uniqueChunkIndices.map(async (chunkIdx) => {
            const cacheKey = `${dataset}_${chunkIdx}`
            if (!loadedChunks[cacheKey]) {
              const res = await fetch(`/assets/${dataset}/sk/chunks/chunk_${chunkIdx}.json`, { signal: controller.signal })
              if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
              const chunkData = await res.json()
              newChunks[cacheKey] = chunkData
            }
          }))

          if (Object.keys(newChunks).length > 0) {
            setLoadedChunks(prev => ({
              ...prev,
              ...newChunks
            }))
          }

          for (const rank of matchedRanks) {
            const chunkIdx = Math.floor((rank - 1) / CHUNK_SIZE)
            const relIdx = (rank - 1) % CHUNK_SIZE
            const cacheKey = `${dataset}_${chunkIdx}`
            const chunkData = loadedChunks[cacheKey] || newChunks[cacheKey]
            if (chunkData) {
              const row = chunkData[relIdx]
              if (row) {
                matches.push({
                  page: row[0],
                  matchText: row[3],
                  contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
                  firstCol: row[1],
                  lastCol: row[6]
                })
              }
            }
          }
        }

        setResults(matches)
        setProgress(`Selesai. Ditemukan ${matchedRanks.length >= 1000 ? '1000+ (dibatasi)' : matches.length} hasil.`)
      } catch (e) {
        console.error(e)
        if (e.name === 'AbortError') {
          setProgress('Pencarian dibatalkan')
        } else {
          setResults([{ error: `Gagal memuat data pencarian: ${String(e.message || e)}` }])
          setProgress('Gagal memuat berkas.')
        }
      } finally {
        setLoading(false)
        setAbortController(null)
      }
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
    setLastSearchedQuery('')
    setResults([])
    setHasSearched(false)
    setCurrentPage(1)
    setProgress('')
    setSortConfig({ key: null, direction: 'asc' })
  }

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      key = null
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (!sortConfig.key) return 0

    let valA, valB
    if (sortConfig.key === 'peringkat') {
      valA = parseInt(a.contextItems?.[0] || '0', 10)
      valB = parseInt(b.contextItems?.[0] || '0', 10)
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    } else if (sortConfig.key === 'noPeserta') {
      valA = String(a.contextItems?.[1] || '')
      valB = String(b.contextItems?.[1] || '')
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' })
    } else if (sortConfig.key === 'nama') {
      valA = String(a.contextItems?.[2] || '')
      valB = String(b.contextItems?.[2] || '')
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' })
    }
    return 0
  })

  const ITEMS_PER_PAGE = 50
  const totalItems = hasSearched
    ? sortedResults.length
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
    ? sortedResults.slice(indexOfFirstItem, indexOfLastItem)
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
    lastSearchedQuery,
    results: sortedResults,
    sortConfig,
    requestSort,
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
