import React, { useState, useEffect, useMemo } from 'react';
import BaseSummary from '../common/BaseSummary';
import { STATUS_LEGEND_AKHIR } from '../../config/constants';

export default function SummaryPelatihanLulus({ summary }) {
  const [summaryPerubahan, setSummaryPerubahan] = useState(null);

  useEffect(() => {
    fetch('/assets/combined/perbedaan/summary_perubahan_pelatihan_lulus.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => setSummaryPerubahan(data))
      .catch(err => console.error("Failed to load summary Pelatihan Lulus:", err));
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
      alwaysShow: true,
      field: (s) => Number(s?.statusCounts?.['LULUS']) || Number(s?.statusCounts?.['L']) || '-'
    },
    // {
    //   key: 'tetap_l',
    //   label: 'Tetap Lulus (L)',
    //   icon: 'lulus',
    //   colorClass: 'stat-table__row--lulus',
    //   field: (s) => (s === summary ? summaryPerubahan?.['tetap L'] : s?.statusChangeCounts?.['tetap L']) || '-'
    // },
    // {
    //   key: 'tms_jadi_l',
    //   label: 'TMS jadi Lulus',
    //   icon: 'lulus',
    //   colorClass: 'stat-table__row--lulus',
    //   field: (s) => (s === summary ? summaryPerubahan?.['TMS jadi L'] : s?.statusChangeCounts?.['TMS jadi L']) || '-'
    // },
  ], [summary, summaryPerubahan]);

  const detailKeys = ['tetap_l', 'tms_jadi_l'];

  return (
    <BaseSummary
      showButton={false}
      summary={summary}
      rowDefs={ROW_DEFS}
      detailKeys={detailKeys}
      legendItems={STATUS_LEGEND_AKHIR}
    />
  );
}

