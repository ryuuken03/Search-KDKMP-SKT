import React, { useState } from 'react'
import { SUMMARY_TEXT, STATUS_LEGEND } from '../../config/constants'
import { IconInfo, IconChevron } from '../common/Icons'

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
          <IconInfo className="stat-summary__btn-icon" />
          {SUMMARY_TEXT.PAGE_LEGEND}
          <IconChevron className={`stat-summary__chevron${isLegendVisible ? ' stat-summary__chevron--up' : ''}`} />
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
