import React from 'react'
import SummarySK from '../components/summary_sk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk_search_controls'
import SKResultsTable from '../components/sk_results_table'
import KnmpJabatanFilter from '../components/knmp_jabatan_filter'

export default function SKPage({ isKnmp }) {
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
  } = useSKSearch(isKnmp)

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
            <SummarySK
              summary={page1Info.summary}
              isKnmp={isKnmp}
              selectedJabatan={selectedJabatan}
              setSelectedJabatan={setSelectedJabatan}
              knmpSummaries={knmpSummaries}
            />
          </div>
        </section>
      )}

      {/* ── KNMP Jabatan Filter (standalone, di luar summary panel) ────── */}
      {isKnmp && (
        <KnmpJabatanFilter
          selectedJabatan={selectedJabatan}
          setSelectedJabatan={setSelectedJabatan}
          knmpSummaries={knmpSummaries}
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
            isKnmp={isKnmp}
          />
        </section>
      </div>
    </div>
  )
}
