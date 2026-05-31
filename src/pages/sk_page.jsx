import React from 'react'
import SummarySK from '../components/summary_sk'
import { useSKSearch } from '../hooks/useSKSearch'
import SKSearchControls from '../components/sk_search_controls'
import SKResultsTable from '../components/sk_results_table'

export default function SKPage({ isKnmp }) {
  const {
    query,
    setQuery,
    searchMode,
    setSearchMode,
    results,
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
    displayItems
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
            <SummarySK summary={page1Info.summary} isKnmp={isKnmp} />
          </div>
        </section>
      )}

      <SKSearchControls
        query={query}
        setQuery={setQuery}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        handleSearch={handleSearch}
        loading={loading}
        cancelSearch={cancelSearch}
        hasSearched={hasSearched}
        handleClear={handleClear}
      />

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
          />
        </section>
      </div>
    </div>
  )
}
