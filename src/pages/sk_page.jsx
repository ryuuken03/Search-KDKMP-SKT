import React from 'react'
import SummarySK from '../components/summary_sk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk_search_controls'
import SKResultsTable from '../components/sk_results_table'
import JabatanFilter from '../components/knmp_jabatan_filter'

export default function SKPage() {
  const {
    query,
    setQuery,
    searchMode,
    lastSearchedQuery,
    results,
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
  } = useSKSearch()

  const STATUS_LEGEND = [
    { key: 'lulus', color: '#10b981', label: 'P/P1/P2/L = Lulus' },
    { key: 'tl', color: '#f43f5e', label: 'TL = Tidak Lulus' },
    { key: 'th', color: '#eab308', label: 'TH = Tidak Hadir' },
    { key: 'lainnya', color: '#6b7280', label: 'TMS/APS = Lainnya' },
  ];
  return (
    <div className="sk-page">
      {/* {summary && ( */}
      <SummarySK summary={summary} />
      {/* )} */}

      {/* Tampilkan filter jabatan di atas search bar saat belum search */}
      {!hasSearched && (
        <JabatanFilter
          selectedJabatan={selectedJabatan}
          setSelectedJabatan={setSelectedJabatan}
          summaries={summary?.jabatan || {}}
        />
      )}

      <SKSearchControls
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        loading={loading}
        cancelSearch={cancelSearch}
        hasSearched={hasSearched}
        handleClear={handleClear}
      />
      <div className="stat-legend" style={{ marginBottom: 10 }}>
        {STATUS_LEGEND.map(({ key, color, label }) => (
          <span key={key} className="stat-legend__item">
            <span className="stat-legend__dot" style={{ backgroundColor: color }}></span>
            {label}
          </span>
        ))}
      </div>

      {/* Smart Fallback Hint */}
      {hasSearched && searchMode === 'Peringkat' && /^\d+$/.test(lastSearchedQuery) && (
        <div className="search-fallback-hint">
          <span className="search-fallback-hint__icon">💡</span>
          <span className="search-fallback-hint__text">
            Menampilkan peringkat <strong>{lastSearchedQuery}</strong>. Apakah Anda ingin mencari{' '}
            <button
              type="button"
              className="search-fallback-hint__link"
              onClick={() => handleSearch('Nomor Peserta')}
              disabled={loading}
            >
              Nomor Peserta mengandung "{lastSearchedQuery}"
            </button>
            ?
          </span>
        </div>
      )}

      <div className="meta">
        <strong>Progres:</strong> {progress}
      </div>

      <div className="layout">
        <section className="results">
          <SKResultsTable
            displayItems={displayItems}
            loading={loading}
            hasSearched={hasSearched}
            currentChunk={currentChunk}
            indexOfFirstItem={indexOfFirstItem}
            resultsLength={results.length}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            totalPages={totalPages}
            indexOfLastItem={indexOfLastItem}
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
        </section>
      </div>
    </div>
  )
}
