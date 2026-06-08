import { SEARCH_TEXT } from '../constants'
import { IconClose } from './icons'

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
          placeholder={SEARCH_TEXT.PLACEHOLDER}
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
            <IconClose />
          </button>
        )}
      </div>
      {loading && hasSearched && (
        <div className="controls__actions">
          <button type="button" className="secondary" onClick={cancelSearch}>
            {SEARCH_TEXT.CANCEL}
          </button>
        </div>
      )}
    </div>
  )
}
