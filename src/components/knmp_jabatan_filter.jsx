import React from 'react'
import { JABATAN_LABELS, getJabatanSlug } from '../hooks/useSKSearch'
import { SEARCH_TEXT } from '../constants'

/**
 * JabatanFilter — pill buttons untuk filter jabatan.
 *
 * Props:
 *  - selectedJabatan  : label jabatan aktif
 *  - setSelectedJabatan : setter
 *  - summaries        : { [label]: summaryData }
 *  - compact          : boolean — mode ringkas
 */
export default function JabatanFilter({
  selectedJabatan,
  setSelectedJabatan,
  summaries = {},
  compact = false,
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  return (
    <div
      className={compact ? 'jabatan-filter jabatan-filter--compact' : 'jabatan-filter'}
      aria-label="Filter jabatan KNMP"
    >
      <div className="jabatan-filter__inner">
        {!compact && (
          <div className="jabatan-filter__header">
            <span className="jabatan-filter__label desktop-only">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="jabatan-filter__icon"
                aria-hidden="true"
              >
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              {SEARCH_TEXT.FILTER_JABATAN}
            </span>
            <button
              type="button"
              className="jabatan-filter__toggle mobile-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
            >
              <span>{selectedJabatan}</span>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="jabatan-filter__toggle-icon"
                style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}

        <div className={`jabatan-filter__pills${isCollapsed && !compact ? ' mobile-hidden' : ''}`} role="group" aria-label="Pilih jabatan">
          {JABATAN_LABELS.map((label) => {
            const slug = getJabatanSlug(label)
            const summaryData = summaries[label]
            const isActive = selectedJabatan === label
            return (
              <button
                type="button"
                key={label}
                id={`jabatan-pill-${slug}`}
                className={`jabatan-pill jabatan-pill--${slug}${isActive ? ' jabatan-pill--active' : ''}`}
                onClick={() => setSelectedJabatan(label)}
                aria-pressed={isActive}
              >
                {label}
                {summaryData && (
                  <span className="jabatan-pill__count">
                    {(summaryData.totalRows || 0).toLocaleString('id-ID')}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
