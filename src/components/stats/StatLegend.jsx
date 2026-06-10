import React from 'react';
import { STATUS_LEGEND } from '../../config/constants';

export default function StatLegend({ items = STATUS_LEGEND }) {
  return (
    <div className="stat-legend">
      {items.map(({ key, color, label }) => (
        <span key={key} className="stat-legend__item">
          <span className="stat-legend__dot" style={{ backgroundColor: color }}></span>
          {label}
        </span>
      ))}
    </div>
  );
}
