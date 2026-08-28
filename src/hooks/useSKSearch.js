import { useState, useEffect, useMemo } from 'react'
import { useItemsPerPage } from './useItemsPerPage'
import { useDebounce } from './useDebounce'
import {
  JABATAN_LABELS,
  detectSearchMode,
  DATASET_PATH,
  CACHE_PREFIX,
  CHUNK_SIZE
} from '../utils/searchUtils'

export function useSKSearch(datasetPath = DATASET_PATH) {
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState('Nama')
  const [lastSearchedQuery, setLastSearchedQuery] = useState('')
  const [results, setResults] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [loadedChunks, setLoadedChunks] = useState({})
  const [loadedPrefixes, setLoadedPrefixes] = useState({})
  const [loadedNoPeserta, setLoadedNoPeserta] = useState(null)
  const [loadedPeringkat, setLoadedPeringkat] = useState(null)
  const [summary, setSummary] = useState(null)
  const [abortController, setAbortController] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedJabatan, setSelectedJabatan] = useState('KDKMP - Manajer')
  const [selectedSatdik, setSelectedSatdik] = useState(null)
  const [satdikList, setSatdikList] = useState([])
  const [loadedSatdiks, setLoadedSatdiks] = useState({})

  const ITEMS_PER_PAGE = useItemsPerPage()
  const debouncedQuery = useDebounce(query, 500)

  // ── Fetch summary.json & satdik.json ──────────────────────────────────────
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch(`${datasetPath}/summary.json`)
        if (res.ok && mounted) setSummary(await res.json())
      } catch (e) {
        console.error('Gagal fetch summary:', e)
      }

      try {
        const resSatdik = await fetch(`${datasetPath}/satdik.json`)
        if (resSatdik.ok && mounted) {
          const list = await resSatdik.json()
          if (Array.isArray(list)) setSatdikList(list)
        }
      } catch (e) {
        // Optional dataset without satdik
      }
    })()
    return () => { mounted = false }
  }, [datasetPath])

  const totalRows = summary?.totalRows || 483648

  // ── Fetch SATDIK partition on demand ──────────────────────────────────────
  useEffect(() => {
    if (!selectedSatdik) return
    if (loadedSatdiks[selectedSatdik]) return

    const item = satdikList.find(s => s.nama === selectedSatdik)
    if (!item || item.id === undefined) return

    let mounted = true
    setLoading(true)
    setProgress(`Memuat data SATDIK "${selectedSatdik}"...`)

    ;(async () => {
      try {
        const res = await fetch(`${datasetPath}/satdik_data/${item.id}.json`)
        if (res.ok) {
          const rows = await res.json()
          if (mounted) {
            setLoadedSatdiks(prev => ({ ...prev, [selectedSatdik]: rows }))
            setProgress('')
          }
        } else {
          if (mounted) setProgress('Gagal memuat data SATDIK.')
        }
      } catch (e) {
        if (mounted) setProgress('Error memuat berkas SATDIK.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [selectedSatdik, satdikList, loadedSatdiks, datasetPath])

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
  }, [selectedJabatan, selectedSatdik])

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

  // ── Helper Functions for Searching ──────────────────────────────────────────
  const searchPeringkat = async (trimmedQuery, controller) => {
    setProgress('Mencari peringkat...')
    const rankVal = parseInt(trimmedQuery, 10)
    if (isNaN(rankVal) || rankVal <= 0) {
      setResults([{ error: 'Peringkat harus berupa angka positif.' }])
      setProgress('Gagal mencari.')
      setLoading(false)
      return
    }

    try {
      setProgress('Mengunduh indeks peringkat...')
      let list = loadedPeringkat
      if (!list) {
        const res = await fetch(`${datasetPath}/peringkat.json`, { signal: controller.signal })
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
  }

  const searchNoPeserta = async (trimmedQuery, controller) => {
    setProgress('Mencari nomor peserta...')
    const queryUpper = trimmedQuery.toUpperCase()
    const isStartsWithP = queryUpper.startsWith('P')

    try {
      setProgress('Mengunduh indeks nomor peserta...')
      let list = loadedNoPeserta
      if (!list) {
        const res = await fetch(`${datasetPath}/no_peserta.json`, { signal: controller.signal })
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
            jabatan: null,   
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
  }

  const searchNama = async (trimmedQuery, controller) => {
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

    try {
      setProgress(`Mengunduh indeks nama "${prefix.toUpperCase()}"...`)
      let rows = loadedPrefixes[cacheKey]
      if (!rows) {
        const res = await fetch(`${datasetPath}/names/${prefix}.json`, { signal: controller.signal })
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
            contextItems: [row[1], row[2], row[3], row[4], row[5], row[6], row[8] !== undefined ? row[8] : '', row[9] !== undefined ? row[9] : '', row[10] !== undefined ? row[10] : '', row[11] !== undefined ? row[11] : '', row[12] !== undefined ? row[12] : '', row[13] !== undefined ? row[13] : '', row[14] !== undefined ? row[14] : ''],
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

  const handleSearch = (overrideMode, overrideQuery) => {
    const queryToUse = typeof overrideQuery === 'string' ? overrideQuery.trim() : query.trim()
    if (!queryToUse) return

    const mode = overrideMode || detectSearchMode(queryToUse, totalRows)

    setSearchMode(mode)
    setLastSearchedQuery(queryToUse)
    setHasSearched(true)
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })

    if (selectedSatdik) {
      // In-memory instant search for selected Satdik
      setLoading(false)
      setProgress(`Mencari dalam SATDIK "${selectedSatdik}"...`)
      return
    }

    setLoading(true)
    setResults([])

    const controller = new AbortController()
    setAbortController(controller)

    if (mode === 'Peringkat') {
      searchPeringkat(queryToUse, controller)
    } else if (mode === 'Nomor Peserta') {
      searchNoPeserta(queryToUse, controller)
    } else {
      searchNama(queryToUse, controller)
    }
  }

  // ── Debounce Live Search ──────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    
    if (!trimmed) {
      if (hasSearched) handleClear()
      return
    }

    const isNumberFirst = /^\d/.test(trimmed) || /^[pP]?\d+$/.test(trimmed)

    if (!isNumberFirst && trimmed.length < 3) return
    if (trimmed === lastSearchedQuery) return

    cancelSearch() 
    handleSearch(null, trimmed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])


  // ── SATDIK Filtered & Sorted Rows ─────────────────────────────────────────
  const isFilteringSatdik = selectedSatdik !== null

  const filteredSatdikRows = useMemo(() => {
    if (!selectedSatdik) return []
    const rows = loadedSatdiks[selectedSatdik] || []
    if (!hasSearched || !lastSearchedQuery) return rows

    const q = lastSearchedQuery.toLowerCase().trim()
    const qWords = q.split(/[^a-z0-9]+/).filter(Boolean)

    return rows.filter(row => {
      const noPeserta = String(row[2] || '').toLowerCase()
      const nama = String(row[3] || '').toLowerCase()
      const rank = String(row[1] || '').toLowerCase()

      if (searchMode === 'Nomor Peserta') {
        return noPeserta.includes(q)
      } else if (searchMode === 'Peringkat') {
        return rank === q
      } else {
        return qWords.every(w => nama.includes(w))
      }
    })
  }, [selectedSatdik, loadedSatdiks, hasSearched, lastSearchedQuery, searchMode])

  const sortedSatdikRows = useMemo(() => {
    if (!selectedSatdik) return []
    const rows = hasSearched ? filteredSatdikRows : (loadedSatdiks[selectedSatdik] || [])
    if (!sortConfig.key) return rows

    return [...rows].sort((a, b) => {
      const dirMult = sortConfig.direction === 'asc' ? 1 : -1
      if (sortConfig.key === 'peringkat') {
        return (parseInt(a[1] || '0', 10) - parseInt(b[1] || '0', 10)) * dirMult
      }
      if (sortConfig.key === 'noPeserta') {
        return String(a[2] || '').localeCompare(String(b[2] || '')) * dirMult
      }
      if (sortConfig.key === 'nama') {
        return String(a[3] || '').localeCompare(String(b[3] || '')) * dirMult
      }
      if (sortConfig.key === 'jabatan') {
        return String(a[7] || '').localeCompare(String(b[7] || '')) * dirMult
      }
      return 0
    })
  }, [selectedSatdik, hasSearched, filteredSatdikRows, loadedSatdiks, sortConfig])

  // ── Global Sort ───────────────────────────────────────────────────────────
  const sortedResults = useMemo(() => {
    if (!sortConfig.key) return results;

    return [...results].sort((a, b) => {
      const getVal = (item, key) => {
        if (key === 'peringkat') return item.rank || parseInt(item.contextItems?.[0] || '0', 10)
        if (key === 'noPeserta') return String(item.noPeserta || item.contextItems?.[1] || '')
        if (key === 'nama') {
          if (item.contextItems) return item.contextItems[2] || ''
          const cIdx = Math.floor((item.rank - 1) / CHUNK_SIZE)
          const relIdx = (item.rank - 1) % CHUNK_SIZE
          return loadedChunks[`${CACHE_PREFIX}_${cIdx}`]?.[relIdx]?.[3] || ''
        }
        if (key === 'jabatan') return String(item.jabatan || '')
        return ''
      }

      const valA = getVal(a, sortConfig.key)
      const valB = getVal(b, sortConfig.key)
      const dirMult = sortConfig.direction === 'asc' ? 1 : -1

      if (sortConfig.key === 'peringkat') {
        return (valA - valB) * dirMult
      }
      return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' }) * dirMult
    })
  }, [results, sortConfig, loadedChunks])

  // ── Pagination ────────────────────────────────────────────────────────────
  const isFilteringJabatan = !hasSearched && !isFilteringSatdik && selectedJabatan !== null

  const totalItems = isFilteringSatdik
    ? (hasSearched ? sortedSatdikRows.length : (sortedSatdikRows.length || satdikList.find(s => s.nama === selectedSatdik)?.jumlah || 0))
    : (hasSearched 
        ? sortedResults.length 
        : (isFilteringJabatan ? (summary?.jabatan?.[selectedJabatan]?.totalRows || 0) : totalRows))

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  
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

  if (!hasSearched && !isFilteringSatdik) {
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
  const displayItems = useMemo(() => {
    if (isFilteringSatdik) {
      const rows = sortedSatdikRows.slice(indexOfFirstItem, indexOfLastItem)
      return rows.map(row => ({
        page: row[0],
        matchText: row[3],
        contextItems: [
          row[1],
          row[2],
          row[3],
          row[4],
          row[5],
          row[6],
          row[8] !== undefined ? row[8] : '',
          row[9] !== undefined ? row[9] : '',
          row[10] !== undefined ? row[10] : '',
          row[11] !== undefined ? row[11] : '',
          row[12] !== undefined ? row[12] : '',
          row[13] !== undefined ? row[13] : '',
          row[14] !== undefined ? row[14] : ''
        ],
        firstCol: row[1],
        lastCol: row[6],
        jabatan: row[7] ?? null,
        jabatanSlug: null,
      }))
    }

    if (hasSearched) {
      return sortedResults.slice(indexOfFirstItem, indexOfLastItem).map(item => {
        if (item.contextItems) return item
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
            contextItems: [row[1], row[2], row[3], row[4], row[5], row[6], row[8] !== undefined ? row[8] : '', row[9] !== undefined ? row[9] : '', row[10] !== undefined ? row[10] : '', row[11] !== undefined ? row[11] : '', row[12] !== undefined ? row[12] : '', row[13] !== undefined ? row[13] : '', row[14] !== undefined ? row[14] : ''],
            firstCol: row[1],
            lastCol: row[6],
            jabatan: row[7] ?? item.jabatan,
            jabatanSlug: null,
          }
        }
        return {
          page: Math.ceil(rIdx / 50),
          matchText: '',
          contextItems: [String(rIdx), item.noPeserta, 'Memuat...', '', '', '', '', '', '', '', '', '', ''],
          firstCol: String(rIdx),
          lastCol: '',
          jabatan: item.jabatan,
          jabatanSlug: null,
        }
      })
    } else {
      if (!currentChunk) return [];
      const maxItems = Math.max(0, Math.min(ITEMS_PER_PAGE, totalItems - indexOfFirstItem));
      let items = currentChunk.slice(relativeStart, relativeStart + maxItems);
      if (items.length < maxItems && nextChunk) {
         const remaining = maxItems - items.length;
         items = items.concat(nextChunk.slice(0, remaining));
      }
      return items.map(row => ({
          page: row[0],
          matchText: row[3],
          contextItems: [row[1], row[2], row[3], row[4], row[5], row[6], row[8] !== undefined ? row[8] : '', row[9] !== undefined ? row[9] : '', row[10] !== undefined ? row[10] : '', row[11] !== undefined ? row[11] : '', row[12] !== undefined ? row[12] : '', row[13] !== undefined ? row[13] : '', row[14] !== undefined ? row[14] : ''],
          firstCol: row[1],
          lastCol: row[6],
          jabatan: row[7] ?? null,
          jabatanSlug: null,
      }))
    }
  }, [isFilteringSatdik, sortedSatdikRows, hasSearched, sortedResults, indexOfFirstItem, indexOfLastItem, loadedChunks, currentChunk, nextChunk, ITEMS_PER_PAGE, totalItems, relativeStart])

  // ── Load chunk untuk browse mode ──────────────────────────────────────────
  useEffect(() => {
    if (hasSearched || isFilteringSatdik) return
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
          const res = await fetch(`${datasetPath}/chunks/chunk_${idx}.json`)
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
  }, [currentPage, hasSearched, isFilteringSatdik, loadedChunks, selectedJabatan, chunkIdx, nextChunkIdx, relativeStart, ITEMS_PER_PAGE, cacheKeyChunk, cacheKeyNextChunk, datasetPath])

  // ── Lazy-load chunks untuk Nomor Peserta results ───────────────────────────
  useEffect(() => {
    if (!hasSearched || isFilteringSatdik) return
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
          const res = await fetch(`${datasetPath}/chunks/chunk_${cIdx}.json`, { signal: controller.signal })
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
  }, [displayItems, hasSearched, isFilteringSatdik, loadedChunks, datasetPath])

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
    selectedSatdik,
    setSelectedSatdik,
    satdikList,
  }
}
