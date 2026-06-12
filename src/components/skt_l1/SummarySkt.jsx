import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SUMMARY_TEXT, STATUS_LEGEND_AKHIR } from '../../config/constants';
import { ROW_ICONS } from '../common/Icons';
import StatCard from '../stats/StatCard';
import StatTable from '../stats/StatTable';
import StatToggleBtn from '../stats/StatToggleBtn';
import StatLegend from '../stats/StatLegend';

const JABATAN_GROUPS = [
  {
    label: 'KDKMP',
    cols: [
      { key: 'KDKMP - Manajer', label: 'Manajer' }
    ]
  },
  {
    label: 'KNMP',
    cols: [
      { key: 'KNMP - Manajer Operasional', label: 'Manajer Operasional' },
      { key: 'KNMP - Kepala Produksi', label: 'Kepala Produksi' },
      { key: 'KNMP - Penjamin Mutu', label: 'Penjamin Mutu' },
      { key: 'KNMP - Administrasi Keuangan', label: 'Administrasi Keuangan' },
    ]
  }
];

export default function SummarySkt({ summary }) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [summaryPerubahanL1, setSummaryPerubahanL1] = useState(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    fetch('/assets/combined/perbedaan/summary_perubahan_l1.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => setSummaryPerubahanL1(data))
      .catch(err => console.error("Failed to load summary L1:", err));
  }, []);

  const ROW_DEFS = useMemo(() => [
    {
      key: 'formasi',
      label: 'Jumlah Formasi',
      icon: 'pelamar',
      colorClass: '',
      field: (s) => {
        if (s?.source?.jumlahFormasi) return Number(s.source.jumlahFormasi) || '-';
        if (s?.jabatan) {
          const sum = Object.values(s.jabatan).reduce((sum, j) => sum + (Number(j?.source?.jumlahFormasi) || 0), 0);
          return sum || '-';
        }
        return '-';
      }
    },
    { key: 'total', label: 'Total Peserta', icon: 'pelamar', colorClass: '', field: (s) => s?.totalRows || '-' },
    { key: 'l', label: 'Lulus (L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['L']) || '-' },
    { key: 'ms', label: 'Memenuhi Syarat (MS)', icon: 'peringatanBiru', colorClass: '', field: (s) => Number(s?.statusCounts?.['MS']) || '-' },
    { key: 'tms', label: 'Tidak Memenuhi Syarat (TMS)', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusCounts?.['TMS']) || '-' },
    { key: 'tetap_l', label: 'Tetap L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL1?.['tetap L'] : s?.statusChangeCounts?.['tetap L']) || '-' },
    { key: 'tetap_ms', label: 'Tetap MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL1?.['tetap MS'] : s?.statusChangeCounts?.['tetap MS']) || '-' },
    { key: 'tetap_tms', label: 'Tetap TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL1?.['tetap TMS'] : s?.statusChangeCounts?.['tetap TMS']) || '-' },
    { key: 'l_jadi_ms', label: 'L jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL1?.['L jadi MS'] : s?.statusChangeCounts?.['L jadi MS']) || '-' },
    { key: 'l_jadi_tms', label: 'L jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL1?.['L jadi TMS'] : s?.statusChangeCounts?.['L jadi TMS']) || '-' },
    { key: 'ms_jadi_l', label: 'MS jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL1?.['MS jadi L'] : s?.statusChangeCounts?.['MS jadi L']) || '-' },
    { key: 'ms_jadi_tms', label: 'MS jadi TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => (s === summary ? summaryPerubahanL1?.['MS jadi TMS'] : s?.statusChangeCounts?.['MS jadi TMS']) || '-' },
    { key: 'tms_jadi_l', label: 'TMS jadi L', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => (s === summary ? summaryPerubahanL1?.['TMS jadi L'] : s?.statusChangeCounts?.['TMS jadi L']) || '-' },
    { key: 'tms_jadi_ms', label: 'TMS jadi MS', icon: 'peringatanBiru', colorClass: '', field: (s) => (s === summary ? summaryPerubahanL1?.['TMS jadi MS'] : s?.statusChangeCounts?.['TMS jadi MS']) || '-' }
  ], [summary, summaryPerubahanL1]);

  const { jabatanCols, activeGroups, visibleRows } = useMemo(() => {
    const jCols = JABATAN_GROUPS
      .flatMap(group => group.cols.map(col => ({
        ...col,
        groupLabel: group.label,
        data: summary?.jabatan?.[col.key] ?? null,
      })));

    const aGroups = JABATAN_GROUPS;

    const vRows = ROW_DEFS.filter(({ key, field }) => {
      const detailKeys = ['tetap_l', 'tetap_ms', 'tetap_tms', 'l_jadi_ms', 'l_jadi_tms', 'ms_jadi_l', 'ms_jadi_tms', 'tms_jadi_l', 'tms_jadi_ms'];
      if (detailKeys.includes(key)) {
        return showDetails; // Always show if showDetails is true, else hide
      }

      if (!summary) return true;
      if (key === 'formasi' || key === 'total' || key === 'tms') return true;
      
      const totalVal = field(summary);
      if (totalVal !== '-' && totalVal > 0) return true;
      
      return jCols.some(col => {
        const val = field(col.data);
        return val !== '-' && val > 0;
      });
    });

    return { jabatanCols: jCols, activeGroups: aGroups, visibleRows: vRows };
  }, [summary, showDetails]);

  const closePanel = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (summaryRef.current) {
        const y = summaryRef.current.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div ref={summaryRef} className="stat-summary" style={{ marginBottom: 10 }}>
      <StatToggleBtn
        isOpen={isVisible}
        onClick={() => setIsVisible(v => !v)}
        label={SUMMARY_TEXT.TOGGLE_OPEN}
      />

      {isVisible && (
        <div id="stat-summary-panel" className="stat-summary__panel">
          <StatTable
            summary={summary}
            activeGroups={activeGroups}
            jabatanCols={jabatanCols}
            visibleRows={visibleRows}
            summaryText={SUMMARY_TEXT}
            rowIcons={ROW_ICONS}
          />

          <div className="stat-cards-wrapper">
            <StatCard
              title={SUMMARY_TEXT.CARD_TOTAL_ALL}
              total={summary?.totalRows}
              data={summary}
              visibleRows={visibleRows}
              rowIcons={ROW_ICONS}
              summaryText={SUMMARY_TEXT}
            />

            {jabatanCols.map(({ key: jKey, label: jLabel, groupLabel, data }) => (
              <StatCard
                key={jKey}
                title={`${groupLabel} - ${jLabel}`}
                total={data?.totalRows || 0}
                data={data}
                visibleRows={visibleRows}
                rowIcons={ROW_ICONS}
                summaryText={SUMMARY_TEXT}
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="stat-summary__toggle-btn"
              onClick={() => setShowDetails(v => !v)}
              style={{ fontSize: '0.9rem', padding: '6px 12px' }}
            >
              {showDetails ? 'Sembunyikan Detail Perubahan' : 'Detail Selengkapnya'}
            </button>
          </div>

          <StatLegend items={STATUS_LEGEND_AKHIR} />

          <StatToggleBtn
            isOpen={isVisible}
            onClick={closePanel}
            label={SUMMARY_TEXT.TOGGLE_CLOSE}
            isBottom={true}
          />
        </div>
      )}
    </div>
  );
}
