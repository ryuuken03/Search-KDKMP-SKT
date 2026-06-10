import React from 'react'
import SummarySkt from '../components/skt/SummarySkt'
import { useSKSearch } from '../hooks/useSKSearch'
import { DATASET_PATH_AKHIR } from '../utils/searchUtils'
import SkSearchControls from '../components/sk/SkSearchControls'
import SktResultsTable from '../components/skt/SktResultsTable'
import JabatanFilter from '../components/sk/KnmpJabatanFilter'
import SmartFallbackHint from '../components/common/SmartFallbackHint'
import SktLegendSection from '../components/skt/SktLegendSection'
import { SUMMARY_TEXT } from '../config/constants'

export default function SktPage() {
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
  } = useSKSearch(DATASET_PATH_AKHIR)

  return (
    <div className="skt-page sk-page">
      <SummarySkt summary={summary} />

      {!hasSearched && (
        <JabatanFilter
          selectedJabatan={selectedJabatan}
          setSelectedJabatan={setSelectedJabatan}
          summaries={summary?.jabatan || {}}
        />
      )}

      <SkSearchControls
        query={query}
        setQuery={setQuery}
        handleSearch={handleSearch}
        loading={loading}
        cancelSearch={cancelSearch}
        hasSearched={hasSearched}
        handleClear={handleClear}
      />

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
          <SktResultsTable
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

      <SktLegendSection />
    </div>
  )
}
