import React, { useState, useEffect } from 'react'
import Pagination from '../common/Pagination'
import { getJabatanSlug } from '../../utils/searchUtils'
import { TABLE_TEXT, APP_TEXT } from '../../config/constants'

const getStatusColor = (status) => {
  const s = String(status || '').trim().toUpperCase()
  if (s === 'L') return '#10b981'
  if (s === 'MS') return '#3b82f6'
  if (s === 'TMS') return '#f43f5e'
  if (s === 'TH') return '#6b7280'
  return 'inherit'
}

const formatRowData = (r, i, indexOfFirstItem) => {
  const raw = r.contextItems || []
  // Avoid filtering out empty strings so column indexing is stable
  const vals = raw.map((v) => String(v || '').trim())
  
  // If vals is empty, try to fallback
  return {
    noCol: vals[0] || (indexOfFirstItem + i + 1),
    peserta: vals[1] || r.firstCol || '',
    nama: vals[2] || r.matchText || '',
    jabatanFormasi: vals[3] || '', // now kognitif
    pendidikan: vals[4] || '',     // now substansi
    status: vals[5] || r.lastCol || '',
    status_sk: vals[6] || '',      // now status_sk
    jabatan: r.jabatan || '',
    error: r.error
  }
}

export default function SktResultsTable({
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
  const colSpan = 7

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

  const renderHeader = (key, label) => {
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
            {renderHeader('peringkat', TABLE_TEXT.HEADERS.PERINGKAT)}
            {renderHeader('noPeserta', TABLE_TEXT.HEADERS.NO_PESERTA)}
            {renderHeader('nama', TABLE_TEXT.HEADERS.NAMA)}
            <th>{TABLE_TEXT.HEADERS.KOGNITIF}</th>
            <th>{TABLE_TEXT.HEADERS.SUBSTANSI}</th>
            <th>{TABLE_TEXT.HEADERS.STATUS}</th>
            {renderHeader('jabatan', TABLE_TEXT.HEADERS.JABATAN)}
          </tr>
        </thead>
        <tbody>
          {displayItems.map((r, i) => {
            const { error, noCol, peserta, nama, jabatanFormasi, pendidikan, status, status_sk, jabatan } = formatRowData(r, i, indexOfFirstItem)

            if (error) {
              return (
                <tr key={i} className="empty-row">
                  <td colSpan={colSpan}>{error}</td>
                </tr>
              )
            }
            return (
              <tr key={i}>
                <td data-label="Peringkat"><span>{noCol}</span></td>
                <td data-label="No Peserta"><span>{peserta}</span></td>
                <td data-label="Nama"><span>{nama}</span></td>
                <td data-label="Kognitif"><span>{jabatanFormasi}</span></td>
                <td data-label="Substansi"><span>{pendidikan}</span></td>
                <td data-label="Status">
                  <div>
                    <span style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
                      {status}
                    </span>
                    {status_sk && status_sk !== '-' && (
                      <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                        SK: {status_sk}
                      </div>
                    )}
                  </div>
                </td>
                <td data-label="Jabatan">
                  <span className={`jabatan-badge jabatan-badge--${getJabatanSlug(jabatan)}`}>
                    {jabatan}
                  </span>
                </td>
              </tr>
            )
          })}
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
