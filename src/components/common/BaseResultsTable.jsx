import React, { useState, useEffect } from 'react'
import Pagination from './Pagination'
import { TABLE_TEXT, APP_TEXT } from '../../config/constants'

export default function BaseResultsTable({
  columns,
  renderRow,
  colSpan,
  displayItems,
  loading,
  hasSearched,
  currentChunk,
  indexOfFirstItem,
  resultsLength,
  currentPage,
  setCurrentPage,
  totalItems,
  totalPages,
  indexOfLastItem,
  ITEMS_PER_PAGE,
  sortConfig,
  requestSort,
}) {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderHeader = (col, idx) => {
    if (!col.sortable) {
      return <th key={idx}>{col.label}</th>
    }

    const { key, label } = col;
    const isSorted = sortConfig?.key === key
    const direction = sortConfig?.direction

    const handleClick = () => {
      if (hasSearched) requestSort(key)
    }

    const titleText = hasSearched
      ? `${TABLE_TEXT.SORT_TIP} ${label}`
      : TABLE_TEXT.SORT_TIP_DISABLED

    return (
      <th
        key={idx}
        onClick={handleClick}
        className={hasSearched ? 'sortable' : 'sortable disabled'}
        style={{ cursor: hasSearched ? 'pointer' : 'default', userSelect: 'none' }}
        title={titleText}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span>{label}</span>
          <span
            className="sort-indicator"
            style={{
              opacity: isSorted ? 1 : (hasSearched ? 0.35 : 0.15),
              fontSize: '10px'
            }}
          >
            {isSorted ? (direction === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    )
  }

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => renderHeader(col, idx))}
          </tr>
        </thead>
        <tbody>
          {displayItems.map((r, i) => renderRow(r, i, indexOfFirstItem))}
          {loading && resultsLength === 0 && (
            <tr className="empty-row">
              <td colSpan={colSpan}>{TABLE_TEXT.LOADING}</td>
            </tr>
          )}
          {!loading && !hasSearched && !currentChunk && (
            <tr className="empty-row">
              <td colSpan={colSpan}>{TABLE_TEXT.INITIAL_LOADING}</td>
            </tr>
          )}
          {!loading && hasSearched && resultsLength === 0 && (
            <tr className="empty-row">
              <td colSpan={colSpan}>{TABLE_TEXT.NO_RESULTS}</td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={totalItems}
        totalPages={totalPages}
        indexOfFirstItem={indexOfFirstItem}
        indexOfLastItem={indexOfLastItem}
        hasSearched={hasSearched}
        itemsPerPage={ITEMS_PER_PAGE}
      />
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="scroll-to-top-btn"
          aria-label={APP_TEXT.SCROLL_TOP}
          title={APP_TEXT.SCROLL_TOP}
        >
          ↑
        </button>
      )}
    </div>
  )
}
