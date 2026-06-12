import React, { useState, useRef, useMemo } from 'react';
import { SUMMARY_TEXT } from '../../config/constants';
import { ROW_ICONS } from './Icons';
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

export default function BaseSummary({
  summary,
  rowDefs,
  detailKeys = [],
  legendItems,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const summaryRef = useRef(null);

  const { jabatanCols, activeGroups, visibleRows } = useMemo(() => {
    const jCols = JABATAN_GROUPS
      .flatMap(group => group.cols.map(col => ({
        ...col,
        groupLabel: group.label,
        data: summary?.jabatan?.[col.key] ?? null,
      })));

    const aGroups = JABATAN_GROUPS;

    const vRows = rowDefs.filter(({ key, field, alwaysShow }) => {
      if (detailKeys.includes(key)) {
        return showDetails;
      }

      if (!summary) return true;
      if (alwaysShow) return true;
      
      const totalVal = field(summary);
      if (totalVal !== '-' && totalVal > 0) return true;
      
      return jCols.some(col => {
        const val = field(col.data);
        return val !== '-' && val > 0;
      });
    });

    return { jabatanCols: jCols, activeGroups: aGroups, visibleRows: vRows };
  }, [summary, showDetails, rowDefs, detailKeys]);

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

          {detailKeys.length > 0 && (
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
          )}

          <StatLegend items={legendItems} />

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
