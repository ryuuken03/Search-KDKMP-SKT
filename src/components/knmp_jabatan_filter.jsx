import React from 'react'
import { KNMP_JABATAN } from '../hooks/useSKSearch'

/**
 * KnmpJabatanFilter — pill buttons untuk filter jabatan KNMP.
 * Reusable: dipakai di sk_page.jsx dan summary_sk.jsx.
 *
 * Props:
 *  - selectedJabatan  : slug jabatan aktif
 *  - setSelectedJabatan : setter
 *  - knmpSummaries    : { [slug]: summaryData } — opsional, untuk tampilkan count
 *  - compact          : boolean — mode ringkas (tanpa border panel, padding kecil)
 */
export default function KnmpJabatanFilter({
  selectedJabatan,
  setSelectedJabatan,
  knmpSummaries = {},
  compact = false,
}) {
  return (
    <div
      className={compact ? 'jabatan-filter jabatan-filter--compact' : 'jabatan-filter'}
      aria-label="Filter jabatan KNMP"
    >
      <div className="jabatan-filter__inner">
        {!compact && (
          <span className="jabatan-filter__label">
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
            Jabatan
          </span>
        )}

        <div className="jabatan-filter__pills" role="group" aria-label="Pilih jabatan">
          {KNMP_JABATAN.map(({ slug, label }) => {
            const summaryData = knmpSummaries[slug]
            const isActive = selectedJabatan === slug
            return (
              <button
                type="button"
                key={slug}
                id={`jabatan-pill-${slug}`}
                className={`jabatan-pill jabatan-pill--${slug}${isActive ? ' jabatan-pill--active' : ''}`}
                onClick={() => setSelectedJabatan(slug)}
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
