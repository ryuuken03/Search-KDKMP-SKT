import React from 'react'
import SummarySktL3 from '../components/skt_l3/SummarySktL3'
import { useSKSearch } from '../hooks/useSKSearch'
import { DATASET_PATH_AKHIR_L3 } from '../utils/searchUtils'
import SkSearchControls from '../components/sk/SkSearchControls'
import SktL3ResultsTable from '../components/skt_l3/SktL3ResultsTable'
import JabatanFilter from '../components/sk/KnmpJabatanFilter'
import SatdikFilterL3 from '../components/skt_l3/SatdikFilterL3'
import SmartFallbackHint from '../components/common/SmartFallbackHint'
import SktL3LegendSection from '../components/skt_l3/SktL3LegendSection'
import { SUMMARY_TEXT } from '../config/constants'

export default function SktL3Page() {
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
    selectedSatdik,
    setSelectedSatdik,
    satdikList,
  } = useSKSearch(DATASET_PATH_AKHIR_L3)

  return (
    <div className="skt-page sk-page">
      <SummarySktL3 summary={summary} />

      {!hasSearched && !selectedSatdik && (
        <JabatanFilter
          selectedJabatan={selectedJabatan}
          setSelectedJabatan={setSelectedJabatan}
          summaries={summary?.jabatan || {}}
        />
      )}

      <SatdikFilterL3
        selectedSatdik={selectedSatdik}
        setSelectedSatdik={setSelectedSatdik}
        satdikList={satdikList}
        loading={loading}
      />

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
          <SktL3ResultsTable
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

      <SktL3LegendSection />
    </div>
  )
}
