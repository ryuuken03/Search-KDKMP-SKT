import React, { useState } from 'react'
import SummarySK from '../components/summary_sk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk_search_controls'
import SKResultsTable from '../components/sk_results_table'
import JabatanFilter from '../components/knmp_jabatan_filter'
import { STATUS_LEGEND, SUMMARY_TEXT } from '../constants'

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

  const [isLegendVisible, setIsLegendVisible] = useState(false)

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

      {/* Smart Fallback Hint */}
      {hasSearched && searchMode === 'Peringkat' && /^\d+$/.test(lastSearchedQuery) && (
        <div className="search-fallback-hint">
          <span className="search-fallback-hint__icon">💡</span>
          <span className="search-fallback-hint__text">
            {SUMMARY_TEXT.SMART_HINT_PRE} <strong>{lastSearchedQuery}</strong>. Apakah Anda ingin mencari{' '}
            <button
              type="button"
              className="search-fallback-hint__link"
              onClick={() => handleSearch('Nomor Peserta')}
              disabled={loading}
            >
              {SUMMARY_TEXT.SMART_HINT_LINK} "{lastSearchedQuery}"
            </button>
            ?
          </span>
        </div>
      )}

      <div className="meta">
        <strong>{SUMMARY_TEXT.PROGRES}</strong> {progress}
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

      <div className="stat-summary" style={{ marginBottom: 10 }}>
        <div className="stat-summary__toggle-row">
          <button
            type="button"
            className="stat-summary__toggle-btn"
            onClick={() => setIsLegendVisible(v => !v)}
            aria-expanded={isLegendVisible}
            style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stat-summary__btn-icon" aria-hidden="true" style={{ width: 16, height: 16 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            {SUMMARY_TEXT.PAGE_LEGEND}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`stat-summary__chevron${isLegendVisible ? ' stat-summary__chevron--up' : ''}`} aria-hidden="true" style={{ width: 16, height: 16 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
        {isLegendVisible && (
          <div className="stat-legend" style={{ marginTop: 10 }}>
            {STATUS_LEGEND.map(({ key, color, label }) => (
              <span key={key} className="stat-legend__item">
                <span className="stat-legend__dot" style={{ backgroundColor: color }}></span>
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
