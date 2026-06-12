import React from 'react';
import BaseSummary from '../common/BaseSummary';

const ROW_DEFS = [
  {
    key: 'formasi',
    label: 'Jumlah Formasi',
    icon: 'pelamar',
    colorClass: '',
    alwaysShow: true,
    field: (s) => {
      if (s?.source?.jumlahFormasi) return Number(s.source.jumlahFormasi);
      if (s?.jabatan) {
        return Object.values(s.jabatan).reduce((sum, j) => sum + (Number(j?.source?.jumlahFormasi) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'total', label: 'Total Peserta', icon: 'pelamar', colorClass: '', alwaysShow: true, field: (s) => s?.totalRows || 0 },
  { key: 'pl', label: 'Lulus (P/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P/L']) || 0 },
  { key: 'p1l', label: 'Lulus (P1/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P1/L']) || 0 },
  { key: 'p2l', label: 'Lulus (P2/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P2/L']) || 0 },
  { key: 'tl', label: 'TL', icon: 'tidakLulus', colorClass: 'stat-table__row--tidak-lulus', field: (s) => Number(s?.statusCounts?.['TL']) || 0 },
  { key: 'th', label: 'TH', icon: 'tidakHadir', colorClass: 'stat-table__row--tidak-hadir', field: (s) => Number(s?.statusCounts?.['TH']) || 0 },
  { key: 'tms', label: 'TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', alwaysShow: true, field: (s) => Number(s?.statusCounts?.['TMS']) || 0 },
  { key: 'aps', label: 'APS', icon: 'tidakLulus', colorClass: 'stat-table__row--aps', alwaysShow: true, field: (s) => Number(s?.statusCounts?.['APS']) || 0 },
];

export default function SummarySK({ summary }) {
  return (
    <BaseSummary
      summary={summary}
      rowDefs={ROW_DEFS}
    />
  );
}
