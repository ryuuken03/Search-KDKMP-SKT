import React from 'react'
import Pagination from './pagination'

export default function SKResultsTable({
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
  requestSort
}) {
  const renderHeader = (key, label) => {
    const isSorted = sortConfig?.key === key
    const direction = sortConfig?.direction

    const handleClick = () => {
      if (hasSearched) {
        requestSort(key)
      }
    }

    const titleText = hasSearched
      ? `Klik untuk mengurutkan berdasarkan ${label}`
      : 'Cari Nama atau Nomor Peserta terlebih dahulu untuk mengurutkan seluruh hasil'

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
            {renderHeader('peringkat', 'Peringkat')}
            {renderHeader('noPeserta', 'No Peserta')}
            {renderHeader('nama', 'Nama')}
            <th>Kognitif</th>
            <th>Substansi</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((r, i) => {
            const raw = r.contextItems || []
            const vals = raw.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
            const noCol = vals[0] ?? (indexOfFirstItem + i + 1)
            const peserta = vals[1] ?? r.firstCol ?? ''
            const nama = vals[2] ?? r.matchText ?? ''
            const kognitif = vals[3] ?? ''
            const substansi = vals[4] ?? ''
            const status = vals[5] ?? r.lastCol ?? ''
            if (r.error) {
              return (
                <tr key={i} className="empty-row">
                  <td colSpan={6}>{r.error}</td>
                </tr>
              )
            }
            return (
              <tr key={i}>
                <td data-label="Peringkat"><span>{noCol}</span></td>
                <td data-label="No Peserta"><span>{peserta}</span></td>
                <td data-label="Nama"><span>{nama}</span></td>
                <td data-label="Kognitif"><span>{kognitif}</span></td>
                <td data-label="Substansi"><span>{substansi}</span></td>
                <td data-label="Status"><span>{status}</span></td>
              </tr>
            )
          })}
          {loading && resultsLength === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>Sedang mencari…</td>
            </tr>
          )}
          {!loading && !hasSearched && !currentChunk && (
            <tr className="empty-row">
              <td colSpan={6}>Memuat data...</td>
            </tr>
          )}
          {!loading && hasSearched && resultsLength === 0 && (
            <tr className="empty-row">
              <td colSpan={6}>Hasil tidak ditemukan.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
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
    </div>
  )
}
