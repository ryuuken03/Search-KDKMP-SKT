import React from 'react';
import { SUMMARY_TEXT } from '../constants';
import { ROW_ICONS } from './icons';
import StatCard from './stat_card';
import StatTable from './stat_table';
import StatToggleBtn from './stat_toggle_btn';
import StatLegend from './stat_legend';

// Baris statistik yang ditampilkan
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
  { key: 'pl', label: 'Lulus (P/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P/L']) || 0 },
  { key: 'p1l', label: 'Lulus (P1/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P1/L']) || 0 },
  { key: 'p2l', label: 'Lulus (P2/L)', icon: 'lulus', colorClass: 'stat-table__row--lulus', field: (s) => Number(s?.statusCounts?.['P2/L']) || 0 },
  { key: 'tl', label: 'TL', icon: 'tidakLulus', colorClass: 'stat-table__row--tidak-lulus', field: (s) => Number(s?.statusCounts?.['TL']) || 0 },
  { key: 'th', label: 'TH', icon: 'tidakHadir', colorClass: 'stat-table__row--tidak-hadir', field: (s) => Number(s?.statusCounts?.['TH']) || 0 },
  { key: 'tms', label: 'TMS', icon: 'tidakLulus', colorClass: 'stat-table__row--tms', field: (s) => Number(s?.statusCounts?.['TMS']) || 0 },
  { key: 'aps', label: 'APS', icon: 'tidakLulus', colorClass: 'stat-table__row--aps', field: (s) => Number(s?.statusCounts?.['APS']) || 0 },
];

// Grup dan urutan kolom jabatan yang ditampilkan
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

/**
 * SummarySK — Tabel statistik kelulusan gabungan.
 *
 * Props:
 *   summary — dari combined/sk/summary.json
 */
export default function SummarySK({ summary }) {
  const [isVisible, setIsVisible] = React.useState(false);

  // Ambil data per jabatan sesuai urutan (flattened untuk baris tabel)
  const jabatanCols = JABATAN_GROUPS
    .flatMap(group => group.cols.map(col => ({
      ...col,
      groupLabel: group.label,
      data: summary?.jabatan?.[col.key] ?? null,
    })));

  // Buat struktur grup dinamis berdasarkan kolom yang datanya tersedia
  const activeGroups = JABATAN_GROUPS.map(group => {
    const activeCols = group.cols.filter(col => jabatanCols.some(jc => jc.key === col.key));
    return { ...group, cols: activeCols };
  }).filter(group => group.cols.length > 0);

  // Tentukan baris statistik yang akan ditampilkan (sembunyikan yang bernilai 0 di semua kolom, kecuali beberapa field yang wajib)
  const visibleRows = ROW_DEFS.filter(({ key, field }) => {
    if (!summary) return true; // Tampilkan semua baris saat loading
    if (key === 'formasi' || key === 'total' || key === 'tms' || key === 'aps') return true;
    const totalVal = field(summary);
    if (totalVal > 0) return true;
    return jabatanCols.some(col => field(col.data) > 0);
  });

  const closePanel = () => {
    setIsVisible(false);
    setTimeout(() => {
      const target = document.querySelector('.stat-summary');
      if (target) {
        const y = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <div className="stat-summary" style={{ marginBottom: 10 }}>
      {/* Tombol toggle (Atas) */}
      <StatToggleBtn
        isOpen={isVisible}
        onClick={() => setIsVisible(v => !v)}
        label={SUMMARY_TEXT.TOGGLE_OPEN}
      />

      {/* Panel tabel */}
      {isVisible && (
        <div id="stat-summary-panel" className="stat-summary__panel">
          
          {/* Tabel Desktop */}
          <StatTable
            summary={summary}
            activeGroups={activeGroups}
            jabatanCols={jabatanCols}
            visibleRows={visibleRows}
            summaryText={SUMMARY_TEXT}
            rowIcons={ROW_ICONS}
          />

          {/* Tampilan Card untuk Mobile (Sembunyi di Desktop) */}
          <div className="stat-cards-wrapper">
            {/* Card Total */}
            <StatCard
              title={SUMMARY_TEXT.CARD_TOTAL_ALL}
              total={summary?.totalRows}
              data={summary}
              visibleRows={visibleRows}
              rowIcons={ROW_ICONS}
              summaryText={SUMMARY_TEXT}
            />

            {/* Cards per Jabatan */}
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

          {/* Keterangan legend */}
          <StatLegend />

          {/* Tombol tutup di bawah */}
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
