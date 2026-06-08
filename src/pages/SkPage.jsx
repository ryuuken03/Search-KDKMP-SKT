import React from 'react'
import SummarySK from '../components/sk/SummarySk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk/SkSearchControls'
import SKResultsTable from '../components/sk/SkResultsTable'
import JabatanFilter from '../components/sk/KnmpJabatanFilter'
import SmartFallbackHint from '../components/common/SmartFallbackHint'
import SKLegendSection from '../components/sk/SkLegendSection'
import { SUMMARY_TEXT } from '../config/constants'

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
