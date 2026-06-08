import React from 'react'
import { SUMMARY_TEXT } from '../constants'

export default function SmartFallbackHint({ hasSearched, searchMode, lastSearchedQuery, handleSearch, loading }) {
  if (!(hasSearched && searchMode === 'Peringkat' && /^\d+$/.test(lastSearchedQuery))) {
    return null
  }

  return (
    <div className="search-fallback-hint">
      <span className="search-fallback-hint__icon">💡</span>
      <span className="search-fallback-hint__text">
        {SUMMARY_TEXT.SMART_HINT_PRE} <strong>{lastSearchedQuery}</strong>. Apakah Anda ingin mencari{' '}
        <button
          type="button"
          className="search-fallback-hint__link"
          onClick={() => handleSearch('Nomor Peserta')}
          disabled={loading}
        >
          {SUMMARY_TEXT.SMART_HINT_LINK} "{lastSearchedQuery}"
        </button>
        ?
      </span>
    </div>
  )
}
