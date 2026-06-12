import React from 'react';
import { SUMMARY_TEXT, STATUS_LEGEND_AKHIR } from '../../config/constants';
import { ROW_ICONS } from '../common/Icons';
import StatCard from '../stats/StatCard';
import StatTable from '../stats/StatTable';
import StatToggleBtn from '../stats/StatToggleBtn';
import StatLegend from '../stats/StatLegend';

const ROW_DEFS = [
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
  const [isVisible, setIsVisible] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const summaryRef = React.useRef(null);

  const { jabatanCols, activeGroups, visibleRows } = React.useMemo(() => {
    const jCols = JABATAN_GROUPS
      .flatMap(group => group.cols.map(col => ({
        ...col,
        groupLabel: group.label,
        data: summary?.jabatan?.[col.key] ?? null,
      })));

    const aGroups = JABATAN_GROUPS;

    const vRows = ROW_DEFS.filter(({ key, field }) => {
      const detailKeys = ['pl_l', 'pl_ms', 'pl_tms', 'p1l_l', 'p1l_ms', 'p1l_tms', 'p2l_l', 'p2l_ms', 'p2l_tms'];
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
