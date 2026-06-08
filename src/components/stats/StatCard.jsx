import React from 'react';
import { fmtNum } from '../../utils/format';

export default function StatCard({ title, total, data, visibleRows, rowIcons, summaryText }) {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <div className="stat-card__title">{title}</div>
        <div className="stat-card__total-pill">
          {summaryText.CARD_TOTAL} <strong>{fmtNum(total)}</strong>
        </div>
      </div>
      <div className="stat-card__body">
        {visibleRows.filter(r => r.key !== 'total').map(({ key, label, icon, colorClass, field }) => {
          const val = data ? field(data) : 0;
          const shortLabel = label.replace('Lulus ', '').replace(/[()]/g, '');
          return (
            <div key={key} className={`stat-card__stat-item ${colorClass.replace('stat-table__row', 'stat-card__row')}`}>
              <div className="stat-card__stat-label">
                <span className="stat-card__icon-wrapper">{rowIcons[icon]}</span>
                <span>{shortLabel}</span>
              </div>
              <span className="stat-card__value">{fmtNum(val)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
