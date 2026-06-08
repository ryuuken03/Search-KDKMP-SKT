import React from 'react';
import { IconPanel, IconChevron } from './icons';

export default function StatToggleBtn({ isOpen, onClick, label, isBottom = false }) {
  return (
    <div className="stat-summary__toggle-row" style={isBottom ? { marginTop: '1rem', justifyContent: 'center' } : {}}>
      <button
        type="button"
        className="stat-summary__toggle-btn"
        onClick={onClick}
        aria-expanded={!isBottom ? isOpen : undefined}
        aria-controls="stat-summary-panel"
      >
        <IconPanel className="stat-summary__btn-icon" />
        {label}
        <IconChevron className={`stat-summary__chevron${isOpen || isBottom ? ' stat-summary__chevron--up' : ''}`} />
      </button>
    </div>
  );
}
