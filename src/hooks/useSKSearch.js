import { useState, useEffect, useMemo } from 'react'

// ─── Jabatan Config (untuk label display) ───────────────────────────────────
export const JABATAN_LABELS = [
  'KDKMP - Manajer',
  'KNMP - Manajer Operasional',
  'KNMP - Kepala Produksi',
  'KNMP - Penjamin Mutu',
  'KNMP - Administrasi Keuangan',
]

export function getJabatanSlug(jabatan) {
  if (!jabatan) return 'unknown';
  if (jabatan.includes('KDKMP')) return 'kdkmp';
  if (jabatan.includes('Manajer Operasional')) return 'manajer_operasional';
  if (jabatan.includes('Kepala Produksi')) return 'kepala_produksi';
  if (jabatan.includes('Penjamin Mutu')) return 'penjamin_mutu';
  if (jabatan.includes('Administrasi Keuangan')) return 'administrasi_keuangan';
  return 'unknown';
}

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

const DATASET_PATH = '/assets/combined/sk'
const CACHE_PREFIX = 'combined'
const CHUNK_SIZE   = 5000

export function useSKSearch() {
  const [query, setQuery]                     = useState('')
  const [searchMode, setSearchMode]           = useState('Nama')
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [results, setResults]                 = useState([])
  const [sortConfig, setSortConfig]           = useState({ key: null, direction: 'asc' })
  const [loading, setLoading]                 = useState(false)
  const [progress, setProgress]               = useState('')
  const [loadedChunks, setLoadedChunks]       = useState({})
  const [loadedPrefixes, setLoadedPrefixes]   = useState({})
  const [loadedNoPeserta, setLoadedNoPeserta] = useState(null)
  const [loadedPeringkat, setLoadedPeringkat] = useState(null)
  const [summary, setSummary]                 = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched]         = useState(false)
  const [currentPage, setCurrentPage]         = useState(1)
  const [selectedJabatan, setSelectedJabatan] = useState('KDKMP - Manajer') // Default filter


  // ── Fetch summary.json ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${DATASET_PATH}/summary.json`)
        if (res.ok && mounted) setSummary(await res.json())
      } catch (e) {
        console.error('Gagal fetch summary:', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  const totalRows = summary?.totalRows || 483648

  // ── Hitung offsets jabatan untuk browse mode ──────────────────────────────
  const jabatanOffsets = useMemo(() => {
    if (!summary) return {};
    let currentOffset = 0;
    const offsets = {};
    for (const label of JABATAN_LABELS) {
      offsets[label] = currentOffset;
      currentOffset += summary.jabatan?.[label]?.totalRows || 0;
    }
    return offsets;
  }, [summary]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedJabatan])
  // ── Debounce Live Search ──────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim()
    
    if (!trimmed) {
      if (hasSearched) handleClear()
      return
    }

    const isNumberFirst = /^\d/.test(trimmed) || /^[pP]?\d+$/.test(trimmed)

    // Jika mulai huruf, minimal 3 karakter
    if (!isNumberFirst && trimmed.length < 3) return

    // Jika sama dengan pencarian terakhir, jangan cari ulang
    if (trimmed === lastSearchedQuery) return

    const timer = setTimeout(() => {
      cancelSearch() // batalkan pencarian sebelumnya jika ada
      handleSearch()
    }, 500)

    return () => clearTimeout(timer)
  }, [query])


  async function handleSearch(overrideMode) {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) return

    const mode = overrideMode || detectSearchMode(trimmedQuery, totalRows)

    setSearchMode(mode)
    setLastSearchedQuery(trimmedQuery)
    setHasSearched(true)
    setLoading(true)
    setResults([])
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })

    // ── Peringkat ─────────────────────────────────────────────────────────
    if (mode === 'Peringkat') {
      setProgress('Mencari peringkat...')
      const rankVal = parseInt(trimmedQuery, 10)
      if (isNaN(rankVal) || rankVal <= 0) {
        setResults([{ error: 'Peringkat harus berupa angka positif.' }])
        setProgress('Gagal mencari.')
        setLoading(false)
        return
      }

      const controller = new AbortController()
      setAbortController(controller)

      try {
        setProgress('Mengunduh indeks peringkat...')

        let list = loadedPeringkat
        if (!list) {
          const res = await fetch(`${DATASET_PATH}/peringkat.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat indeks peringkat: ${res.status}`)
          list = await res.json()
          setLoadedPeringkat(list)
        }

        setProgress('Memindai indeks peringkat...')

        const allMatches = []
        for (let i = 0; i < list.length; i++) {
          if (list[i] === rankVal) {
            allMatches.push({
              rank: i + 1,
              noPeserta: null,
              jabatan: null,
              jabatanSlug: null,
            })
          }
        }

        setResults(allMatches)
        setProgress(`Selesai. Ditemukan ${allMatches.length} hasil.`)
      } catch (e) {
        if (e.name === 'AbortError') {
          setProgress('Pencarian dibatalkan')
        } else {
          setResults([{ error: `Gagal memuat data peringkat: ${String(e.message || e)}` }])
          setProgress('Gagal memuat berkas.')
        }
      } finally {
        setLoading(false)
        setAbortController(null)
      }

    // ── Nomor Peserta ─────────────────────────────────────────────────────
    } else if (mode === 'Nomor Peserta') {
      setProgress('Mencari nomor peserta...')
      const queryUpper = trimmedQuery.toUpperCase()
      const isStartsWithP = queryUpper.startsWith('P')

      const controller = new AbortController()
      setAbortController(controller)

      try {
        setProgress('Mengunduh indeks nomor peserta...')

        let list = loadedNoPeserta
        if (!list) {
          const res = await fetch(`${DATASET_PATH}/no_peserta.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat indeks nomor peserta: ${res.status}`)
          list = await res.json()
          setLoadedNoPeserta(list)
        }

        setProgress('Memindai indeks nomor peserta...')

        const allMatches = []
        for (let i = 0; i < list.length; i++) {
          const suffix = list[i]
          const val = (suffix.length >= 8 && suffix.length <= 9) ? 'P26407581' + suffix : suffix
          const valUpper = val.toUpperCase()
          const isMatch = isStartsWithP ? valUpper.startsWith(queryUpper) : valUpper.includes(queryUpper)
          if (isMatch) {
            allMatches.push({
              rank: i + 1,
              noPeserta: val,
              jabatan: null,   // diisi saat lazy-load chunk
              jabatanSlug: null,
            })
            if (allMatches.length >= 1000) break
          }
        }

        setResults(allMatches)
        setProgress(`Selesai. Ditemukan ${allMatches.length >= 1000 ? '1000+ (dibatasi)' : allMatches.length} hasil.`)
      } catch (e) {
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

    // ── Nama ──────────────────────────────────────────────────────────────
    } else {
      if (trimmedQuery.length < 2) {
        setResults([{ error: 'Masukkan minimal 2 karakter untuk pencarian nama.' }])
        setProgress('Kueri terlalu pendek.')
        setLoading(false)
        return
      }

      setProgress('Menghubungkan ke server data...')
      const queryWords = trimmedQuery.toLowerCase().split(/[^a-z0-9]+/)
      const firstWord = queryWords[0] || ''
      if (!firstWord) {
        setResults([{ error: 'Format pencarian nama tidak valid.' }])
        setProgress('Gagal mencari.')
        setLoading(false)
        return
      }

      const prefix = firstWord.length >= 2 ? firstWord.slice(0, 2) : firstWord
      const cacheKey = `${CACHE_PREFIX}_${prefix}`
      const controller = new AbortController()
      setAbortController(controller)

      try {
        setProgress(`Mengunduh indeks nama "${prefix.toUpperCase()}"...`)

        let rows = loadedPrefixes[cacheKey]
        if (!rows) {
          const res = await fetch(`${DATASET_PATH}/names/${prefix}.json`, { signal: controller.signal })
          if (res.status === 404) {
            rows = []
          } else if (!res.ok) {
            throw new Error(`Gagal mengambil data nama: ${res.status}`)
          } else {
            rows = await res.json()
          }
          setLoadedPrefixes(prev => ({ ...prev, [cacheKey]: rows }))
        }

        setProgress('Sedang mencari...')

        const allMatches = []
        for (const row of rows) {
          const nama = row[3]
          if (!nama) continue
          let matched = true
          for (const qWord of queryWords) {
            if (!nama.toLowerCase().includes(qWord)) { matched = false; break }
          }
          if (matched) {
            allMatches.push({
              page: row[0],
              matchText: nama,
              contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
              firstCol: row[1],
              lastCol: row[6],
              jabatan: row[7] ?? null,
              jabatanSlug: null,
            })
          }
        }

        setResults(allMatches)
        setProgress(`Selesai. Ditemukan ${allMatches.length} hasil.`)
      } catch (e) {
        if (e.name === 'AbortError') {
          setProgress('Pencarian dibatalkan')
        } else {
          setResults([{ error: String(e) }])
          setProgress('Error dalam pencarian.')
        }
      } finally {
        setLoading(false)
        setAbortController(null)
      }
    }
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sortedResults = [...results].sort((a, b) => {
    if (!sortConfig.key) return 0

    let valA, valB
    if (sortConfig.key === 'peringkat') {
      valA = a.rank || parseInt(a.contextItems?.[0] || '0', 10)
      valB = b.rank || parseInt(b.contextItems?.[0] || '0', 10)
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA
    } else if (sortConfig.key === 'noPeserta') {
      valA = String(a.noPeserta || a.contextItems?.[1] || '')
      valB = String(b.noPeserta || b.contextItems?.[1] || '')
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' })
    } else if (sortConfig.key === 'nama') {
      const getNama = (item) => {
        if (item.contextItems) return item.contextItems[2] || ''
        const rIdx = item.rank
        const cIdx = Math.floor((rIdx - 1) / CHUNK_SIZE)
        const relIdx = (rIdx - 1) % CHUNK_SIZE
        const cKey = `${CACHE_PREFIX}_${cIdx}`
        return loadedChunks[cKey]?.[relIdx]?.[3] || ''
      }
      valA = getNama(a)
      valB = getNama(b)
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' })
    } else if (sortConfig.key === 'jabatan') {
      valA = String(a.jabatan || '')
      valB = String(b.jabatan || '')
      return sortConfig.direction === 'asc'
        ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
        : valB.localeCompare(valA, undefined, { sensitivity: 'base' })
    }
    return 0
  })

  // ── Pagination ────────────────────────────────────────────────────────────
  const getItemsPerPage = () => typeof window !== 'undefined' && window.innerWidth < 768 ? 10 : 20;
  const [ITEMS_PER_PAGE, setItemsPerPage] = useState(getItemsPerPage());

  useEffect(() => {
    const handleResize = () => setItemsPerPage(getItemsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isFilteringJabatan = !hasSearched && selectedJabatan !== null

  const totalItems = hasSearched 
    ? sortedResults.length 
    : (isFilteringJabatan ? (summary?.jabatan?.[selectedJabatan]?.totalRows || 0) : totalRows)

  const totalPages     = Math.ceil(totalItems / ITEMS_PER_PAGE)
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem  = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE

  // ── Browse Mode Pagination Calculation ────────────────────────────────────
  let chunkIdx = 0
  let relativeStart = 0

  if (!hasSearched) {
    const globalStartIndex = isFilteringJabatan ? (jabatanOffsets[selectedJabatan] || 0) : 0
    const globalFirstItemIndex = globalStartIndex + indexOfFirstItem
    
    chunkIdx = Math.floor(globalFirstItemIndex / CHUNK_SIZE)
    relativeStart = globalFirstItemIndex % CHUNK_SIZE
  }

  const cacheKeyChunk  = `${CACHE_PREFIX}_${chunkIdx}`
  const currentChunk   = loadedChunks[cacheKeyChunk]
  
  const nextChunkIdx = chunkIdx + 1
  const cacheKeyNextChunk = `${CACHE_PREFIX}_${nextChunkIdx}`
  const nextChunk = loadedChunks[cacheKeyNextChunk]

  // ── displayItems ──────────────────────────────────────────────────────────
  const displayItems = hasSearched
    ? sortedResults.slice(indexOfFirstItem, indexOfLastItem).map(item => {
        if (item.contextItems) return item
        // Nomor Peserta result — perlu load chunk untuk data lengkap
        const rIdx   = item.rank
        const cIdx   = Math.floor((rIdx - 1) / CHUNK_SIZE)
        const relIdx = (rIdx - 1) % CHUNK_SIZE
        const cKey   = `${CACHE_PREFIX}_${cIdx}`
        const chunkData = loadedChunks[cKey]
        if (chunkData && chunkData[relIdx]) {
          const row = chunkData[relIdx]
          return {
            page: row[0],
            matchText: row[3],
            contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
            firstCol: row[1],
            lastCol: row[6],
            jabatan: row[7] ?? item.jabatan,
            jabatanSlug: null,
          }
        }
        return {
          page: Math.ceil(rIdx / 50),
          matchText: '',
          contextItems: [String(rIdx), item.noPeserta, 'Memuat...', '', '', ''],
          firstCol: String(rIdx),
          lastCol: '',
          jabatan: item.jabatan,
          jabatanSlug: null,
        }
      })
    : (() => {
        if (!currentChunk) return [];
        
        // Batasi jumlah item agar tidak mengambil data dari jabatan berikutnya
        const maxItems = Math.max(0, Math.min(ITEMS_PER_PAGE, totalItems - indexOfFirstItem));
        
        let items = currentChunk.slice(relativeStart, relativeStart + maxItems);
        // Handle chunk boundary crossing
        if (items.length < maxItems && nextChunk) {
           const remaining = maxItems - items.length;
           items = items.concat(nextChunk.slice(0, remaining));
        }
        return items.map(row => ({
            page: row[0],
            matchText: row[3],
            contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
            firstCol: row[1],
            lastCol: row[6],
            jabatan: row[7] ?? null,
            jabatanSlug: null,
        }))
      })()

  // ── Load chunk untuk browse mode ──────────────────────────────────────────
  useEffect(() => {
    if (hasSearched) return
    const keysToLoad = []
    if (!loadedChunks[cacheKeyChunk]) keysToLoad.push(chunkIdx)
    if (relativeStart + ITEMS_PER_PAGE > CHUNK_SIZE && !loadedChunks[cacheKeyNextChunk]) {
      keysToLoad.push(nextChunkIdx)
    }
    
    if (keysToLoad.length === 0) return
    
    let mounted = true

    setLoading(true)
    setProgress('Memuat data...')

    ;(async () => {
      try {
        const newChunks = {}
        for (const idx of keysToLoad) {
          const res = await fetch(`${DATASET_PATH}/chunks/chunk_${idx}.json`)
          if (res.ok) {
            newChunks[`${CACHE_PREFIX}_${idx}`] = await res.json()
          }
        }
        if (mounted) {
          setLoadedChunks(prev => ({ ...prev, ...newChunks }))
          setProgress('')
        }
      } catch (e) {
        if (mounted) setProgress('Gagal memuat data.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentPage, hasSearched, loadedChunks, selectedJabatan])

  // ── Lazy-load chunks untuk Nomor Peserta results ───────────────────────────
  useEffect(() => {
    if (!hasSearched) return
    let mounted = true

    const neededChunks = new Set()
    for (const item of displayItems) {
      if (item && !item.matchText && item.contextItems?.[2] === 'Memuat...') {
        const rankVal = parseInt(item.contextItems[0], 10)
        if (!isNaN(rankVal)) {
          const cIdx = Math.floor((rankVal - 1) / CHUNK_SIZE)
          const cKey = `${CACHE_PREFIX}_${cIdx}`
          if (!loadedChunks[cKey]) {
            neededChunks.add(String(cIdx))
          }
        }
      }
    }

    if (neededChunks.size === 0) return

    setLoading(true)
    setProgress('Memuat rincian data...')
    const controller = new AbortController()

    ;(async () => {
      try {
        const newChunks = {}
        await Promise.all(Array.from(neededChunks).map(async (cIdxStr) => {
          const cIdx = Number(cIdxStr)
          const cKey = `${CACHE_PREFIX}_${cIdx}`
          const res = await fetch(`${DATASET_PATH}/chunks/chunk_${cIdx}.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
          newChunks[cKey] = await res.json()
        }))
        if (mounted) {
          setLoadedChunks(prev => ({ ...prev, ...newChunks }))
          setProgress('')
        }
      } catch (e) {
        if (mounted && e.name !== 'AbortError') setProgress('Gagal memuat rincian.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [currentPage, results, sortConfig, loadedChunks])

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
    summary,
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
    displayItems,
    selectedJabatan,
    setSelectedJabatan,
  }
}
