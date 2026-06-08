import React from 'react'

export default function Pagination({
  currentPage,
  setCurrentPage,
  totalItems,
  totalPages,
  indexOfFirstItem,
  indexOfLastItem,
  hasSearched,
  itemsPerPage
}) {
  if (totalItems <= itemsPerPage) return null

  const getPageNumbers = () => {
    const pages = []
    const range = 2

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      let start = Math.max(2, currentPage - range)
      let end = Math.min(totalPages - 1, currentPage + range)

      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push('...')
      }

      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="pagination">
      <div className="pagination__info">
        Menampilkan <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, totalItems)}</strong> dari <strong>{totalItems}</strong> {hasSearched ? 'hasil' : 'data'}
      </div>
      <div className="pagination__buttons">
        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          aria-label="Halaman Pertama"
        >
          &laquo;
        </button>
        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          aria-label="Halaman Sebelumnya"
        >
          &lsaquo;
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return <span key={`ellipsis-${idx}`} className="pagination__ellipsis">&hellip;</span>
          }
          return (
            <button
              key={`page-${p}`}
              className={`pagination__btn ${currentPage === p ? 'active' : ''}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          )
        })}

        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          aria-label="Halaman Berikutnya"
        >
          &rsaquo;
        </button>
        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Halaman Terakhir"
        >
          &raquo;
        </button>
      </div>
    </div>
  )
}
