import React, { useState } from 'react'
import { SUMMARY_TEXT, STATUS_LEGEND } from '../constants'

export default function SKLegendSection() {
  const [isLegendVisible, setIsLegendVisible] = useState(false)

  return (
    <div className="stat-summary stat-summary--legend">
      <div className="stat-summary__toggle-row">
        <button
          type="button"
          className="stat-summary__toggle-btn stat-summary__toggle-btn--large"
          onClick={() => setIsLegendVisible(v => !v)}
          aria-expanded={isLegendVisible}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stat-summary__btn-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          {SUMMARY_TEXT.PAGE_LEGEND}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`stat-summary__chevron${isLegendVisible ? ' stat-summary__chevron--up' : ''}`} aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {isLegendVisible && (
        <div className="stat-legend stat-legend--spaced">
          {STATUS_LEGEND.map(({ key, color, label }) => (
            <span key={key} className="stat-legend__item">
              <span className="stat-legend__dot" style={{ backgroundColor: color }}></span>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
