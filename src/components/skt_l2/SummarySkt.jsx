import React, { useState, useEffect, useMemo } from 'react';
import BaseSummary from '../common/BaseSummary';
import { STATUS_LEGEND_AKHIR } from '../../config/constants';

export default function SummarySkt({ summary }) {
  const [summaryPerubahanL2, setSummaryPerubahanL2] = useState(null);

  useEffect(() => {
    fetch('/assets/combined/perbedaan/summary_perubahan_l2.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => setSummaryPerubahanL2(data))
      .catch(err => console.error("Failed to load summary L2:", err));
  }, []);

  const ROW_DEFS = useMemo(() => [
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
    { key: 'tetap_l', label: 'Tetap L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL2?.['tetap L'] : s?.statusChangeCounts?.['tetap L']) || '-' },
    { key: 'tetap_ms', label: 'Tetap MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL2?.['tetap MS'] : s?.statusChangeCounts?.['tetap MS']) || '-' },
    { key: 'tetap_tms', label: 'Tetap TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL2?.['tetap TMS'] : s?.statusChangeCounts?.['tetap TMS']) || '-' },
    { key: 'l_jadi_ms', label: 'L jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL2?.['L jadi MS'] : s?.statusChangeCounts?.['L jadi MS']) || '-' },
    { key: 'l_jadi_tms', label: 'L jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL2?.['L jadi TMS'] : s?.statusChangeCounts?.['L jadi TMS']) || '-' },
    { key: 'ms_jadi_l', label: 'MS jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL2?.['MS jadi L'] : s?.statusChangeCounts?.['MS jadi L']) || '-' },
    { key: 'ms_jadi_tms', label: 'MS jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL2?.['MS jadi TMS'] : s?.statusChangeCounts?.['MS jadi TMS']) || '-' },
    { key: 'tms_jadi_l', label: 'TMS jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL2?.['TMS jadi L'] : s?.statusChangeCounts?.['TMS jadi L']) || '-' },
    { key: 'tms_jadi_ms', label: 'TMS jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL2?.['TMS jadi MS'] : s?.statusChangeCounts?.['TMS jadi MS']) || '-' }
  ], [summary, summaryPerubahanL2]);

  const detailKeys = ['tetap_l', 'tetap_ms', 'tetap_tms', 'l_jadi_ms', 'l_jadi_tms', 'ms_jadi_l', 'ms_jadi_tms', 'tms_jadi_l', 'tms_jadi_ms'];

  return (
    <BaseSummary
      summary={summary}
      rowDefs={ROW_DEFS}
      detailKeys={detailKeys}
      legendItems={STATUS_LEGEND_AKHIR}
    />
  );
}
