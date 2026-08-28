import SummaryPelatihanLulus from '../components/pelatihan_lulus/SummaryPelatihanLulus'
import { useSKSearch } from '../hooks/useSKSearch'
import { DATASET_PATH_PELATIHAN_LULUS } from '../utils/searchUtils'
import SkSearchControls from '../components/sk/SkSearchControls'
import PelatihanLulusResultsTable from '../components/pelatihan_lulus/PelatihanLulusResultsTable'
import JabatanFilter from '../components/sk/KnmpJabatanFilter'
import SatdikFilterPelatihanLulus from '../components/pelatihan_lulus/SatdikFilterPelatihanLulus'
import SmartFallbackHint from '../components/common/SmartFallbackHint'
import PelatihanLulusLegendSection from '../components/pelatihan_lulus/PelatihanLulusLegendSection'
import { SUMMARY_TEXT } from '../config/constants'

export default function PelatihanLulus() {
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
  } = useSKSearch(DATASET_PATH_PELATIHAN_LULUS)

  return (
    <div className="skt-page sk-page">
      <SummaryPelatihanLulus summary={summary} />

      {!hasSearched && !selectedSatdik && (
        <JabatanFilter
          selectedJabatan={selectedJabatan}
          setSelectedJabatan={setSelectedJabatan}
          summaries={summary?.jabatan || {}}
        />
      )}

      <SatdikFilterPelatihanLulus
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
          <PelatihanLulusResultsTable
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

      <PelatihanLulusLegendSection />
    </div>
  )
}
