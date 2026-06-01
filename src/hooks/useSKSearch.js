import { useState, useEffect, useRef } from 'react'

// ─── Jabatan Config ─────────────────────────────────────────────────────────
export const KNMP_JABATAN = [
  { slug: 'manajer_operasional',   label: 'Manajer Operasional' },
  { slug: 'kepala_produksi',       label: 'Kepala Produksi' },
  { slug: 'penjamin_mutu',         label: 'Penjamin Mutu' },
  { slug: 'administrasi_keuangan', label: 'Administrasi Keuangan' },
]

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

  // ── KNMP Jabatan State ────────────────────────────────────────────────────
  const [selectedJabatan, setSelectedJabatan] = useState(KNMP_JABATAN[0].slug) // default jabatan pertama
  const [knmpSummaries, setKnmpSummaries] = useState({}) // slug → summaryData

  // Reset data ketika pindah dataset
  useEffect(() => {
    setResults([])
    setHasSearched(false)
    setQuery('')
    setLastSearchedQuery('')
    setProgress('')
    setPage1Info(null)
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })
    setSelectedJabatan(KNMP_JABATAN[0].slug) // reset ke jabatan pertama
    setKnmpSummaries({})
    setLoadedChunks({})
    setLoadedPrefixes({})
    setLoadedParticipantNumbers({})
  }, [isKnmp])

  // Reset search ketika jabatan berubah (untuk KNMP)
  useEffect(() => {
    if (!isKnmp) return
    setResults([])
    setHasSearched(false)
    setCurrentPage(1)
    setSortConfig({ key: null, direction: 'asc' })
    setProgress('')
    setLastSearchedQuery('')
  }, [selectedJabatan])

  const CHUNK_SIZE = 5000

  // ── Compute active path prefix untuk fetch ──────────────────────────────
  function getDatasetPath(jabatanSlug) {
    if (!isKnmp) return '/assets/kdkmp/sk'
    if (!jabatanSlug || jabatanSlug === 'semua') return null
    return `/assets/knmp/sk/${jabatanSlug}`
  }

  function getCacheKey(jabatanSlug, suffix) {
    if (!isKnmp) return `kdkmp_${suffix}`
    return `knmp_${jabatanSlug}_${suffix}`
  }

  // ── Fetch KNMP summaries ketika masuk mode KNMP ───────────────────────────
  useEffect(() => {
    if (!isKnmp) return
    let mounted = true

    ;(async () => {
      const summaryMap = {}
      await Promise.all(
        KNMP_JABATAN.map(async ({ slug }) => {
          try {
            const res = await fetch(`/assets/knmp/sk/${slug}/summary.json`)
            if (res.ok) {
              summaryMap[slug] = await res.json()
            }
          } catch (e) {
            console.error(`Gagal fetch summary ${slug}:`, e)
          }
        })
      )
      if (mounted) {
        setKnmpSummaries(summaryMap)
      }
    })()

    return () => { mounted = false }
  }, [isKnmp])

  // ── Compute page1Info berdasarkan selectedJabatan ─────────────────────────
  useEffect(() => {
    if (!isKnmp) return

    const s = knmpSummaries[selectedJabatan]
    if (!s) return
    const jabatanLabel = KNMP_JABATAN.find(j => j.slug === selectedJabatan)?.label || selectedJabatan
    setPage1Info({
      title: 'Hasil Seleksi KNMP Seleksi Kompetensi',
      subtitle: 'Laporan Rekapitulasi Nilai Seleksi',
      summary: s
    })
  }, [isKnmp, selectedJabatan, knmpSummaries])

  // ── Fetch KDKMP summary (non-KNMP) ────────────────────────────────────────
  useEffect(() => {
    if (isKnmp) return
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/assets/kdkmp/sk/summary.json')
        if (!res.ok) return
        const data = await res.json()
        if (mounted) {
          setPage1Info({
            title: 'Hasil Seleksi KDKMP Seleksi Kompetensi',
            subtitle: 'Laporan Rekapitulasi Nilai Seleksi',
            summary: data
          })
        }
      } catch (e) {
        console.error('Gagal mengambil ringkasan KDKMP:', e)
      }
    })()
    return () => { mounted = false }
  }, [isKnmp])

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

      if (rankVal > totalRows) {
        setResults([])
        setProgress('Selesai. Ditemukan 0 hasil.')
        setLoading(false)
        return
      }

      const chunkIdx = Math.floor((rankVal - 1) / CHUNK_SIZE)
      const jabSlug = isKnmp ? selectedJabatan : null
      const cacheKey = jabSlug ? getCacheKey(jabSlug, chunkIdx) : `${dataset}_${chunkIdx}`
      let chunkData = loadedChunks[cacheKey]

      if (!chunkData) {
        setProgress('Mengunduh data peringkat...')
        const controller = new AbortController()
        setAbortController(controller)
        try {
          const basePath = isKnmp ? `/assets/knmp/sk/${jabSlug}` : `/assets/${dataset}/sk`
          const res = await fetch(`${basePath}/chunks/chunk_${chunkIdx}.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
          chunkData = await res.json()
          setLoadedChunks(prev => ({ ...prev, [cacheKey]: chunkData }))
        } catch (e) {
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
        const jabatanLabel = isKnmp ? (KNMP_JABATAN.find(j => j.slug === selectedJabatan)?.label || '') : null
        matches.push({
          page: row[0],
          matchText: row[3],
          contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
          firstCol: row[1],
          lastCol: row[6],
          jabatan: jabatanLabel,
          jabatanSlug: isKnmp ? selectedJabatan : null,
        })
      }

      setResults(matches)
      setProgress(`Selesai. Ditemukan ${matches.length} hasil.`)
      setLoading(false)
      setAbortController(null)

    } else if (mode === 'Nomor Peserta') {
      setProgress('Mencari nomor peserta...')
      const matches = []
      const queryUpper = trimmedQuery.toUpperCase()
      const isStartsWithP = queryUpper.startsWith('P')

      const controller = new AbortController()
      setAbortController(controller)

      try {
        const jabSlug = isKnmp ? selectedJabatan : null
        const cacheKey = jabSlug ? `knmp_${jabSlug}_noPeserta` : `${dataset}_noPeserta`
        let indexList = loadedParticipantNumbers[cacheKey]

        if (!indexList) {
          setProgress('Mengunduh indeks nomor peserta...')
          const basePath = jabSlug ? `/assets/knmp/sk/${jabSlug}` : `/assets/${dataset}/sk`
          const res = await fetch(`${basePath}/no_peserta.json`, { signal: controller.signal })
          if (!res.ok) throw new Error(`Gagal memuat indeks nomor peserta: ${res.status}`)
          indexList = await res.json()
          setLoadedParticipantNumbers(prev => ({ ...prev, [cacheKey]: indexList }))
        }

        setProgress('Memindai indeks nomor peserta...')
        const jabatanLabel = jabSlug ? (KNMP_JABATAN.find(j => j.slug === jabSlug)?.label || '') : null

        for (let i = 0; i < indexList.length; i++) {
          const suffix = indexList[i]
          const val = (suffix.length >= 8 && suffix.length <= 9) ? 'P26407581' + suffix : suffix
          const valUpper = val.toUpperCase()
          const isMatch = isStartsWithP ? valUpper.startsWith(queryUpper) : valUpper.includes(queryUpper)
          if (isMatch) {
            matches.push({
              rank: i + 1,
              noPeserta: val,
              jabatan: jabatanLabel,
              jabatanSlug: jabSlug,
            })
            if (matches.length >= 1000) break
          }
        }

        setResults(matches)
        setProgress(`Selesai. Ditemukan ${matches.length >= 1000 ? '1000+ (dibatasi)' : matches.length} hasil.`)
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

    } else {
      // ── Search by Nama ───────────────────────────────────────────────────
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
      const jabSlug = isKnmp ? selectedJabatan : null
      const allMatches = []
      const controller = new AbortController()
      setAbortController(controller)

      try {
        const cacheKey = jabSlug ? `knmp_${jabSlug}_${prefix}` : `${dataset}_${prefix}`
        let nameRows = loadedPrefixes[cacheKey]

        if (!nameRows) {
          setProgress(`Mengunduh indeks nama "${prefix.toUpperCase()}"...`)
          const basePath = jabSlug ? `/assets/knmp/sk/${jabSlug}` : `/assets/${dataset}/sk`
          const res = await fetch(`${basePath}/names/${prefix}.json`, { signal: controller.signal })
          if (res.status === 404) {
            setResults([])
            setProgress('Selesai. Ditemukan 0 hasil.')
            setLoading(false)
            setAbortController(null)
            return
          }
          if (!res.ok) throw new Error(`Gagal mengambil data nama: ${res.status}`)
          nameRows = await res.json()
          setLoadedPrefixes(prev => ({ ...prev, [cacheKey]: nameRows }))
        }

        if (nameRows) {
          setProgress('Sedang mencari...')
          const jabatanLabel = jabSlug ? (KNMP_JABATAN.find(j => j.slug === jabSlug)?.label || '') : null

          for (const row of nameRows) {
            const nama = row[3]
            if (!nama) continue

            let matched = true
            for (const qWord of queryWords) {
              if (!nama.toLowerCase().includes(qWord)) {
                matched = false
                break
              }
            }

            if (matched) {
              allMatches.push({
                page: row[0],
                matchText: nama,
                contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
                firstCol: row[1],
                lastCol: row[6],
                jabatan: jabatanLabel,
                jabatanSlug: jabSlug,
              })
            }
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

  const dataset = isKnmp ? 'knmp' : 'kdkmp'

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
        const cKey = item.jabatanSlug
          ? `knmp_${item.jabatanSlug}_${cIdx}`
          : `${dataset}_${cIdx}`
        const chunkData = loadedChunks[cKey]
        return chunkData?.[relIdx]?.[3] || ''
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

  const ITEMS_PER_PAGE = 25
  const totalItems = hasSearched
    ? sortedResults.length
    : (page1Info?.summary?.totalRows || (isKnmp ? 72135 : 411516))
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE

  // Chunk browsing (non-searched mode) — hanya untuk jabatan spesifik
  const chunkIdx = Math.floor((currentPage - 1) / 100)
  const activeJabSlug = isKnmp && selectedJabatan !== 'semua' ? selectedJabatan : null
  const cacheKeyChunk = activeJabSlug
    ? `knmp_${activeJabSlug}_${chunkIdx}`
    : `${dataset}_${chunkIdx}`
  const currentChunk = loadedChunks[cacheKeyChunk]
  const relativeStart = ((currentPage - 1) % 100) * ITEMS_PER_PAGE

  const jabatanLabelForSlug = (slug) =>
    KNMP_JABATAN.find(j => j.slug === slug)?.label || null

  const displayItems = hasSearched
    ? sortedResults.slice(indexOfFirstItem, indexOfLastItem).map(item => {
        if (item.contextItems) return item
        // Nomor Peserta result — perlu load chunk
        const rIdx = item.rank
        const cIdx = Math.floor((rIdx - 1) / CHUNK_SIZE)
        const relIdx = (rIdx - 1) % CHUNK_SIZE
        const cKey = item.jabatanSlug
          ? `knmp_${item.jabatanSlug}_${cIdx}`
          : `${dataset}_${cIdx}`
        const chunkData = loadedChunks[cKey]
        if (chunkData && chunkData[relIdx]) {
          const row = chunkData[relIdx]
          return {
            page: row[0],
            matchText: row[3],
            contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
            firstCol: row[1],
            lastCol: row[6],
            jabatan: item.jabatan,
            jabatanSlug: item.jabatanSlug,
          }
        }
        return {
          page: Math.ceil(rIdx / 50),
          matchText: '',
          contextItems: [String(rIdx), item.noPeserta, 'Memuat...', '', '', ''],
          firstCol: String(rIdx),
          lastCol: '',
          jabatan: item.jabatan,
          jabatanSlug: item.jabatanSlug,
        }
      })
    // Browse mode (non-searched): tampilkan chunk jika ada
    // Untuk KNMP 'semua' tidak ada chunk yg di-load — return [] saja
    : (currentChunk
      ? currentChunk.slice(relativeStart, relativeStart + ITEMS_PER_PAGE).map(row => ({
          page: row[0],
          matchText: row[3],
          contextItems: [row[1], row[2], row[3], row[4], row[5], row[6]],
          firstCol: row[1],
          lastCol: row[6],
          jabatan: activeJabSlug ? jabatanLabelForSlug(activeJabSlug) : null,
          jabatanSlug: activeJabSlug,
        }))
      : [])

  // ── Load chunk untuk browse (non-searched, jabatan spesifik) ───────────────
  useEffect(() => {
    if (hasSearched) return
    if (isKnmp && selectedJabatan === 'semua') return
    let mounted = true

    const cIdx = Math.floor((currentPage - 1) / 100)
    const jabSlug = isKnmp ? selectedJabatan : null
    const cKey = jabSlug ? `knmp_${jabSlug}_${cIdx}` : `${dataset}_${cIdx}`

    if (loadedChunks[cKey]) return

    setLoading(true)
    setProgress('Memuat data...')

    ;(async () => {
      try {
        const basePath = jabSlug ? `/assets/knmp/sk/${jabSlug}` : `/assets/${dataset}/sk`
        const res = await fetch(`${basePath}/chunks/chunk_${cIdx}.json`)
        if (!res.ok) throw new Error(`Gagal memuat chunk data: ${res.status}`)
        const chunkData = await res.json()
        if (mounted) {
          setLoadedChunks(prev => ({ ...prev, [cKey]: chunkData }))
          setProgress('')
        }
      } catch (e) {
        if (mounted) setProgress('Gagal memuat data.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [currentPage, hasSearched, isKnmp, selectedJabatan, loadedChunks])

  // ── Lazy-load chunks untuk search results (Nomor Peserta) ─────────────────
  useEffect(() => {
    if (!hasSearched) return
    let mounted = true

    const neededChunks = new Set()

    for (const item of displayItems) {
      if (item && !item.matchText && item.contextItems?.[2] === 'Memuat...') {
        const rankVal = parseInt(item.contextItems[0], 10)
        if (!isNaN(rankVal)) {
          const cIdx = Math.floor((rankVal - 1) / CHUNK_SIZE)
          const cKey = item.jabatanSlug
            ? `knmp_${item.jabatanSlug}_${cIdx}`
            : `${dataset}_${cIdx}`
          if (!loadedChunks[cKey]) {
            neededChunks.add(JSON.stringify({ cIdx, jabatanSlug: item.jabatanSlug }))
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
        await Promise.all(Array.from(neededChunks).map(async (raw) => {
          const { cIdx, jabatanSlug } = JSON.parse(raw)
          const basePath = jabatanSlug ? `/assets/knmp/sk/${jabatanSlug}` : `/assets/${dataset}/sk`
          const cKey = jabatanSlug ? `knmp_${jabatanSlug}_${cIdx}` : `${dataset}_${cIdx}`
          const res = await fetch(`${basePath}/chunks/chunk_${cIdx}.json`, { signal: controller.signal })
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
  }, [currentPage, results, sortConfig, isKnmp, selectedJabatan, loadedChunks])

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
    displayItems,
    // KNMP jabatan
    selectedJabatan,
    setSelectedJabatan,
    knmpSummaries,
  }
}
