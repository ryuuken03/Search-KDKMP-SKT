import React from 'react'

export default function SKSearchControls({
  query,
  setQuery,
  searchMode,
  setSearchMode,
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
          type={searchMode === 'Peringkat' ? 'number' : 'text'}
          placeholder={
            searchMode === 'Nama'
              ? 'Cari Nama Peserta...'
              : searchMode === 'Nomor Peserta'
              ? 'Cari Nomor Peserta...'
              : 'Cari Peringkat (angka)...'
          }
          value={query}
          onChange={(e) => {
            const val = e.target.value
            if (searchMode === 'Nomor Peserta') {
              let cleaned = ''
              const first = val[0]
              if (first && (first === 'p' || first === 'P')) {
                cleaned = 'P' + val.slice(1).replace(/[^0-9]/g, '')
              } else {
                cleaned = val.replace(/[^0-9]/g, '')
              }
              setQuery(cleaned)
            } else {
              setQuery(val)
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <div className="controls__actions">
        <select
          id="search-mode"
          value={searchMode}
          onChange={(e) => {
            setSearchMode(e.target.value)
            setQuery('')
          }}
          aria-label="Mode Pencarian"
        >
          <option value="Nama">Nama</option>
          <option value="Nomor Peserta">Nomor Peserta</option>
          <option value="Peringkat">Peringkat</option>
        </select>
        <button onClick={handleSearch} disabled={loading} aria-label="Cari">
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
        {loading && (
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
