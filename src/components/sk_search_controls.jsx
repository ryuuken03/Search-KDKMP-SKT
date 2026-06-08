import React from 'react'

export default function SKSearchControls({
  query,
  setQuery,
  handleSearch,
  loading,
  cancelSearch,
  hasSearched,
  handleClear
}) {
  return (
    <div className="controls">
      <div className="controls__fields" style={{ position: 'relative', width: '100%', display: 'flex' }}>
        <input
          id="search-query"
          type="text"
          placeholder="Nama/Nomor Peserta/Peringkat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          style={{ width: '100%', paddingRight: query ? '40px' : undefined }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="search-clear-btn"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      {loading && hasSearched && (
        <div className="controls__actions">
          <button type="button" className="secondary" onClick={cancelSearch}>
            Batal
          </button>
        </div>
      )}
    </div>
  )
}
