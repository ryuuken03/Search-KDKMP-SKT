import React, { useState, useEffect, useMemo } from 'react';
import BaseSummary from '../common/BaseSummary';
import { STATUS_LEGEND_AKHIR } from '../../config/constants';

export default function SummaryPelatihanLulus({ summary }) {
  const [summaryPerubahanL3, setSummaryPerubahanL3] = useState(null);

  useEffect(() => {
    fetch('/assets/combined/perbedaan/summary_perubahan_l3.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => setSummaryPerubahanL3(data))
      .catch(err => console.error("Failed to load summary L3:", err));
  }, []);

  const ROW_DEFS = useMemo(() => [
    {
      key: 'total',
      label: 'Total Peserta',
      icon: 'pelamar',
      colorClass: '',
      alwaysShow: true,
      field: (s) => s?.totalRows || '-'
    },
    {
      key: 'l',
      label: 'Lulus (L)',
      icon: 'lulus',
      colorClass: 'stat-table__row--lulus',
      field: (s) => Number(s?.statusCounts?.['L']) || Number(s?.statusCounts?.['LULUS']) || '-'
    },
    {
      key: 'ms',
      label: 'Memenuhi Syarat (MS)',
      icon: 'peringatanBiru',
      colorClass: '',
      field: (s) => Number(s?.statusCounts?.['MS']) || '-'
    },
    {
      key: 'tms',
      label: 'Tidak Memenuhi Syarat (TMS)',
      icon: 'tidakLulus',
      colorClass: 'stat-table__row--tms',
      alwaysShow: true,
      field: (s) => Number(s?.statusCounts?.['TMS']) || '-'
    },
    {
      key: 'tetap_l',
      label: 'Tetap L',
      icon: 'lulus',
      colorClass: 'stat-table__row--lulus',
      field: (s) => (s === summary ? summaryPerubahanL3?.['tetap L'] : s?.statusChangeCounts?.['tetap L']) || '-'
    },
    {
      key: 'tetap_ms',
      label: 'Tetap MS',
      icon: 'peringatanBiru',
      colorClass: '',
      field: (s) => (s === summary ? summaryPerubahanL3?.['tetap MS'] : s?.statusChangeCounts?.['tetap MS']) || '-'
    },
    {
      key: 'tetap_tms',
      label: 'Tetap TMS',
      icon: 'tidakLulus',
      colorClass: 'stat-table__row--tms',
      field: (s) => (s === summary ? summaryPerubahanL3?.['tetap TMS'] : s?.statusChangeCounts?.['tetap TMS']) || '-'
    },
    {
      key: 'l_jadi_tms',
      label: 'L jadi TMS',
      icon: 'tidakLulus',
      colorClass: 'stat-table__row--tms',
      field: (s) => (s === summary ? summaryPerubahanL3?.['L jadi TMS'] : s?.statusChangeCounts?.['L jadi TMS']) || '-'
    },
    {
      key: 'ms_jadi_l',
      label: 'MS jadi L',
      icon: 'lulus',
      colorClass: 'stat-table__row--lulus',
      field: (s) => (s === summary ? summaryPerubahanL3?.['MS jadi L'] : s?.statusChangeCounts?.['MS jadi L']) || '-'
    },
  ], [summary, summaryPerubahanL3]);

  const detailKeys = ['tetap_l', 'tetap_ms', 'tetap_tms', 'l_jadi_tms', 'ms_jadi_l'];

  return (
    <BaseSummary
      summary={summary}
      rowDefs={ROW_DEFS}
      detailKeys={detailKeys}
      legendItems={STATUS_LEGEND_AKHIR}
    />
  );
}
