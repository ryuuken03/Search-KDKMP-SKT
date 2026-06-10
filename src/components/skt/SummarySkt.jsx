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
      if (s?.source?.jumlahFormasi) return Number(s.source.jumlahFormasi);
      if (s?.jabatan) {
        return Object.values(s.jabatan).reduce((sum, j) => sum + (Number(j?.source?.jumlahFormasi) || 0), 0);
      }
      return 0;
    }
  },
  { key: 'total', label: 'Total Peserta', icon: 'pelamar', colorClass: '', field: (s) => s?.totalRows || 0 },
  { key: 'l', label: 'Lulus (L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['L']) || 0 },
  { key: 'ms', label: 'Memenuhi Syarat (MS)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['MS']) || 0 },
  { key: 'tms', label: 'Tidak Memenuhi Syarat (TMS)', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusCounts?.['TMS']) || 0 }
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
      if (!summary) return true;
      if (key === 'formasi' || key === 'total' || key === 'tms') return true;
      const totalVal = field(summary);
      if (totalVal > 0) return true;
      return jCols.some(col => field(col.data) > 0);
    });

    return { jabatanCols: jCols, activeGroups: aGroups, visibleRows: vRows };
  }, [summary]);

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
