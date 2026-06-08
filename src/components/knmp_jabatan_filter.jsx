import React from 'react'
import { JABATAN_LABELS, getJabatanSlug } from '../utils/searchUtils'
import { SEARCH_TEXT } from '../constants'
import { IconFilter, IconChevron } from './icons'

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
              <IconFilter className="jabatan-filter__icon" />
              {SEARCH_TEXT.FILTER_JABATAN}
            </span>
            <button
              type="button"
              className="jabatan-filter__toggle mobile-only"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
            >
              <span>{selectedJabatan}</span>
              <IconChevron 
                strokeWidth="2" 
                className="jabatan-filter__toggle-icon" 
                style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }} 
              />
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
