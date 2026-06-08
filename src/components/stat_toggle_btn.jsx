import React from 'react';

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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="stat-summary__btn-icon" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
        {label}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`stat-summary__chevron${isOpen || isBottom ? ' stat-summary__chevron--up' : ''}`}
          aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
