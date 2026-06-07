import React from 'react';
import { getJabatanSlug } from '../hooks/useSKSearch';

function fmtNum(value) {
  if (value == null || value === '') return '—';
  const n = Number(String(value).replace(',', '.'));
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('id-ID');
}

const ROW_ICONS = {
  pelamar: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="stat-table__row-icon stat-table__row-icon--pelamar" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  lulus: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="stat-table__row-icon stat-table__row-icon--lulus" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  tidakLulus: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="stat-table__row-icon stat-table__row-icon--tidak-lulus" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  tidakHadir: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="stat-table__row-icon stat-table__row-icon--tidak-hadir" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

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

const STATUS_LEGEND = [
  { key: 'lulus', color: '#10b981', label: 'P/P1/P2/L = Lulus' },
  { key: 'tl', color: '#f43f5e', label: 'TL = Tidak Lulus' },
  { key: 'th', color: '#eab308', label: 'TH = Tidak Hadir' },
  { key: 'lainnya', color: '#6b7280', label: 'TMS/APS = Lainnya' },
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
 *     {
 *       totalRows,
 *       statusCounts,
 *       jabatan: {
 *         [label]: { label, totalRows, statusCounts, source }
 *       }
 *     }
 */
export default function SummarySK({ summary }) {
  const [isVisible, setIsVisible] = React.useState(false);

  if (!summary) return null;

  // Ambil data per jabatan sesuai urutan (flattened untuk baris tabel)
  const jabatanCols = JABATAN_GROUPS
    .flatMap(group => group.cols.map(col => ({
      ...col,
      groupLabel: group.label,
      data: summary.jabatan?.[col.key] ?? null,
    })))
    .filter(col => col.data !== null);

  // Buat struktur grup dinamis berdasarkan kolom yang datanya tersedia
  const activeGroups = JABATAN_GROUPS.map(group => {
    const activeCols = group.cols.filter(col => jabatanCols.some(jc => jc.key === col.key));
    return { ...group, cols: activeCols };
  }).filter(group => group.cols.length > 0);

  // Tentukan baris statistik yang akan ditampilkan (sembunyikan yang bernilai 0 di semua kolom, kecuali beberapa field yang wajib)
  const visibleRows = ROW_DEFS.filter(({ key, field }) => {
    if (key === 'formasi' || key === 'total' || key === 'tms' || key === 'aps') return true;
    const totalVal = field(summary);
    if (totalVal > 0) return true;
    return jabatanCols.some(col => field(col.data) > 0);
  });

  return (
    <div className="stat-summary" style={{ marginBottom: 10 }}>
      {/* Tombol toggle */}
      <div className="stat-summary__toggle-row">
        <button
          type="button"
          className="stat-summary__toggle-btn"
          onClick={() => setIsVisible(v => !v)}
          aria-expanded={isVisible}
          aria-controls="stat-summary-panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="stat-summary__btn-icon" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
          Statistik Kelulusan
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`stat-summary__chevron${isVisible ? ' stat-summary__chevron--up' : ''}`}
            aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Panel tabel */}
      {isVisible && (
        <div id="stat-summary-panel" className="stat-summary__panel">
          <div className="stat-table-wrapper">
            <table className="stat-table" aria-label="Statistik kelulusan seleksi">
              <thead>
                <tr>
                  <th className="stat-table__th stat-table__th--kategori" scope="col" rowSpan={2} style={{ verticalAlign: 'middle' }}>KATEGORI</th>
                  <th className="stat-table__th stat-table__th--total" scope="col" rowSpan={2} style={{ verticalAlign: 'middle' }}>TOTAL</th>
                  {activeGroups.map((group) => (
                    <th
                      key={group.label}
                      className="stat-table__th stat-table__th--jabatan-group"
                      scope="colgroup"
                      colSpan={group.cols.length}
                      style={{ textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>
                <tr>
                  {jabatanCols.map(({ key, label }) => (
                    <th
                      key={key}
                      className={`stat-table__th stat-table__th--jabatan stat-table__th--${getJabatanSlug(key)}`}
                      scope="col"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(({ key, label, icon, colorClass, field }) => {
                  const totalVal = field(summary)
                  return (
                    <tr key={key} className={`stat-table__row ${colorClass}`}>
                      <td className="stat-table__td stat-table__td--kategori">
                        {ROW_ICONS[icon]}
                        <span>{label}</span>
                      </td>
                      <td className="stat-table__td stat-table__td--num stat-table__td--total">
                        {fmtNum(totalVal)}
                      </td>
                      {jabatanCols.map(({ key, data }) => (
                        <td key={key} className="stat-table__td stat-table__td--num">
                          {data ? fmtNum(field(data)) : '—'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Tampilan Card untuk Mobile (Sembunyi di Desktop) */}
          <div className="stat-cards-wrapper">
            {/* Card Total */}
            <div className="stat-card">
              <div className="stat-card__header">
                <div className="stat-card__title">Total Seluruh Peserta</div>
                <div className="stat-card__total-pill">
                  Total: <strong>{fmtNum(summary?.totalRows)}</strong>
                </div>
              </div>
              <div className="stat-card__body">
                {visibleRows.filter(r => r.key !== 'total').map(({ key, label, icon, colorClass, field }) => {
                  const val = field(summary);
                  const shortLabel = label.replace('Lulus ', '').replace(/[()]/g, '');
                  return (
                    <div key={key} className={`stat-card__stat-item ${colorClass.replace('stat-table__row', 'stat-card__row')}`}>
                      <div className="stat-card__stat-label">
                        <span className="stat-card__icon-wrapper">{ROW_ICONS[icon]}</span>
                        <span>{shortLabel}</span>
                      </div>
                      <span className="stat-card__value">{fmtNum(val)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cards per Jabatan */}
            {jabatanCols.map(({ key: jKey, label: jLabel, groupLabel, data }) => (
              <div key={jKey} className="stat-card">
                <div className="stat-card__header">
                  <div className="stat-card__title">{groupLabel} - {jLabel}</div>
                  <div className="stat-card__total-pill">
                    Total: <strong>{fmtNum(data?.totalRows || 0)}</strong>
                  </div>
                </div>
                <div className="stat-card__body">
                  {visibleRows.filter(r => r.key !== 'total').map(({ key, label, icon, colorClass, field }) => {
                    const val = data ? field(data) : 0;
                    const shortLabel = label.replace('Lulus ', '').replace(/[()]/g, '');
                    return (
                      <div key={key} className={`stat-card__stat-item ${colorClass.replace('stat-table__row', 'stat-card__row')}`}>
                        <div className="stat-card__stat-label">
                          <span className="stat-card__icon-wrapper">{ROW_ICONS[icon]}</span>
                          <span>{shortLabel}</span>
                        </div>
                        <span className="stat-card__value">{fmtNum(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Keterangan legend */}
          <div className="stat-legend">
            {STATUS_LEGEND.map(({ key, color, label }) => (
              <span key={key} className="stat-legend__item">
                <span className="stat-legend__dot" style={{ backgroundColor: color }}></span>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
