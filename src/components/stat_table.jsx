import React from 'react';
import { getJabatanSlug } from '../utils/searchUtils';
import { fmtNum } from '../utils/format';

export default function StatTable({ summary, activeGroups, jabatanCols, visibleRows, summaryText, rowIcons }) {
  return (
    <div className="stat-table-wrapper">
      <table className="stat-table" aria-label="Statistik kelulusan seleksi">
        <thead>
          <tr>
            <th className="stat-table__th stat-table__th--kategori" scope="col" rowSpan={2} style={{ verticalAlign: 'middle' }}>{summaryText.TABLE_KATEGORI}</th>
            <th className="stat-table__th stat-table__th--total" scope="col" rowSpan={2} style={{ verticalAlign: 'middle' }}>{summaryText.TABLE_TOTAL}</th>
            {activeGroups.map((group) => (
              <th
                key={group.label}
                className="stat-table__th stat-table__th--jabatan-group"
                scope="colgroup"
                colSpan={group.cols.length}
                style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
              >
                {group.label}
              </th>
            ))}
          </tr>
          <tr>
            {jabatanCols.map(({ key, label }) => (
              <th
                key={key}
                className={`stat-table__th stat-table__th--jabatan stat-table__th--${getJabatanSlug(key)}`}
                scope="col"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(({ key, label, icon, colorClass, field }) => {
            const totalVal = field(summary);
            return (
              <tr key={key} className={`stat-table__row ${colorClass}`}>
                <td className="stat-table__td stat-table__td--kategori">
                  {rowIcons[icon]}
                  <span>{label}</span>
                </td>
                <td className="stat-table__td stat-table__td--num stat-table__td--total">
                  {fmtNum(totalVal)}
                </td>
                {jabatanCols.map(({ key: colKey, data }) => (
                  <td key={colKey} className="stat-table__td stat-table__td--num">
                    {data ? fmtNum(field(data)) : '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
