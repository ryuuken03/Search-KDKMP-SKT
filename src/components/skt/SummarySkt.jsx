import React from 'react';
import BaseSummary from '../common/BaseSummary';
import { STATUS_LEGEND_AKHIR } from '../../config/constants';

const ROW_DEFS = [
  {
    key: 'formasi',
    label: 'Jumlah Formasi',
    icon: 'pelamar',
    colorClass: '',
    alwaysShow: true,
    field: (s) => {
      if (s?.source?.jumlahFormasi) return Number(s.source.jumlahFormasi) || '-';
      if (s?.jabatan) {
        const sum = Object.values(s.jabatan).reduce((sum, j) => sum + (Number(j?.source?.jumlahFormasi) || 0), 0);
        return sum || '-';
      }
      return '-';
    }
  },
  { key: 'total', label: 'Total Peserta', icon: 'pelamar', colorClass: '', alwaysShow: true, field: (s) => s?.totalRows || '-' },
  { key: 'l', label: 'Lulus (L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['L']) || '-' },
  { key: 'ms', label: 'Memenuhi Syarat (MS)', icon: 'peringatanBiru', colorClass: '', field: (s) => Number(s?.statusCounts?.['MS']) || '-' },
  { key: 'tms', label: 'Tidak Memenuhi Syarat (TMS)', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', alwaysShow: true, field: (s) => Number(s?.statusCounts?.['TMS']) || '-' },
  { key: 'pl_l', label: 'P/L jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusChangeCounts?.['P/L_jadi_L']) || '-' },
  { key: 'pl_ms', label: 'P/L jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => Number(s?.statusChangeCounts?.['P/L_jadi_MS']) || '-' },
  { key: 'pl_tms', label: 'P/L jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusChangeCounts?.['P/L_jadi_TMS']) || '-' },
  { key: 'p1l_l', label: 'P1/L jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusChangeCounts?.['P1/L_jadi_L']) || '-' },
  { key: 'p1l_ms', label: 'P1/L jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => Number(s?.statusChangeCounts?.['P1/L_jadi_MS']) || '-' },
  { key: 'p1l_tms', label: 'P1/L jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusChangeCounts?.['P1/L_jadi_TMS']) || '-' },
  { key: 'p2l_l', label: 'P2/L jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusChangeCounts?.['P2/L_jadi_L']) || '-' },
  { key: 'p2l_ms', label: 'P2/L jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => Number(s?.statusChangeCounts?.['P2/L_jadi_MS']) || '-' },
  { key: 'p2l_tms', label: 'P2/L jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusChangeCounts?.['P2/L_jadi_TMS']) || '-' }
];

const detailKeys = ['pl_l', 'pl_ms', 'pl_tms', 'p1l_l', 'p1l_ms', 'p1l_tms', 'p2l_l', 'p2l_ms', 'p2l_tms'];

export default function SummarySkt({ summary }) {
  return (
    <BaseSummary
      summary={summary}
      rowDefs={ROW_DEFS}
      detailKeys={detailKeys}
      legendItems={STATUS_LEGEND_AKHIR}
    />
  );
}
