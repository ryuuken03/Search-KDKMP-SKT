import React from 'react'
import SummarySK from '../components/summary_sk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk_search_controls'
import SKResultsTable from '../components/sk_results_table'
import JabatanFilter from '../components/knmp_jabatan_filter'
import SmartFallbackHint from '../components/smart_fallback_hint'
import SKLegendSection from '../components/sk_legend_section'
import { SUMMARY_TEXT } from '../constants'

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
      <SmartFallbackHint
        hasSearched={hasSearched}
        searchMode={searchMode}
        lastSearchedQuery={lastSearchedQuery}
        handleSearch={handleSearch}
        loading={loading}
      />

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

      <SKLegendSection />
    </div>
  )
}
