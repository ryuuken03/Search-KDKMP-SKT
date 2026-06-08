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
      <div className="controls__fields">
        <input
          id="search-query"
          type="text"
          placeholder="Cari Nama, Nomor Peserta, atau Peringkat..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <div className="controls__actions">
        <button onClick={() => handleSearch()} disabled={loading} aria-label="Cari">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginRight: 8 }}
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Cari
        </button>
        {loading && hasSearched && (
          <button type="button" className="secondary" onClick={cancelSearch}>
            Batal
          </button>
        )}
        {!loading && hasSearched && (
          <button type="button" className="secondary" onClick={handleClear} aria-label="Clear">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
