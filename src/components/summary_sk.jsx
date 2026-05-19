import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';

function fmtNum(value) {
  if (value == null || value === '') return '—'
  const n = Number(String(value).replace(',', '.'))
  if (Number.isNaN(n)) return String(value)
  if (String(value).includes('.')) return n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return n.toLocaleString('id-ID')
}

export default function SummarySK({ summary }) {
  if (!summary) {
    return <p className="page1-info__empty">Data rekap halaman 1 tidak ditemukan.</p>;
  }

  const [isExpanded, setIsExpanded] = React.useState(false);

  const totalPeserta = Number(summary.jumlahPeserta) || 0;
  const jumlahFormasi = Number(summary.jumlahFormasi) || 0;

  // Section 1: Kelulusan dan Tidak Lulus
  const lulus = Number(summary.kelulusan?.jumlah) || 0;
  const tidakLulus = Math.max(0, totalPeserta - lulus);
  const lulusPersen = summary.kelulusan?.persen != null
    ? Number(summary.kelulusan.persen)
    : totalPeserta > 0 ? (lulus / totalPeserta) * 100 : 0;
  const tidakLulusPersen = Math.max(0, 100 - lulusPersen);

  const kelulusanData = [
    { name: 'Lulus', value: lulus },
    { name: 'Tidak Lulus', value: tidakLulus }
  ];
  const KELULUSAN_COLORS = ['#6366f1', '#64748b']; // Indigo and Slate

  // Section 2: Kehadiran (Hadir dan Tidak Hadir)
  const hadir = Number(summary.kehadiran?.hadir) || 0;
  const tidakHadir = Number(summary.kehadiran?.tidakHadir) || 0;
  const totalKehadiran = hadir + tidakHadir || totalPeserta;
  const hadirPersen = totalKehadiran > 0 ? (hadir / totalKehadiran) * 100 : 0;
  const tidakHadirPersen = totalKehadiran > 0 ? (tidakHadir / totalKehadiran) * 100 : 0;

  const kehadiranData = [
    { name: 'Hadir', value: hadir },
    { name: 'Tidak Hadir', value: tidakHadir }
  ];
  const KEHADIRAN_COLORS = ['#10b981', '#f43f5e']; // Emerald/Green and Rose/Red

  // Section 3: Statistik Nilai
  const kognitifTinggi = Number(summary.nilaiKognitif?.tertinggi) || 0;
  const kognitifRendah = Number(summary.nilaiKognitif?.terendah) || 0;
  const substansiTinggi = Number(summary.nilaiSubstansi?.tertinggi) || 0;
  const substansiRendah = Number(summary.nilaiSubstansi?.terendah) || 0;

  // Let's assume max scores for Kognitif is 200 and Substansi is 100
  const kognitifMax = 200;
  const kognitifStartPct = Math.min(100, Math.max(0, (kognitifRendah / kognitifMax) * 100));
  const kognitifWidthPct = Math.min(100, Math.max(0, ((kognitifTinggi - kognitifRendah) / kognitifMax) * 100));

  const substansiMax = 100;
  const substansiStartPct = Math.min(100, Math.max(0, (substansiRendah / substansiMax) * 100));
  const substansiWidthPct = Math.min(100, Math.max(0, ((substansiTinggi - substansiRendah) / substansiMax) * 100));

  // Section 4: Rekapitulasi Status Kelulusan & Legend
  const plCount = Number(summary.statusCounts?.['P/L']) || 0;
  const p1lCount = Number(summary.statusCounts?.['P1/L']) || 0;
  const p2lCount = Number(summary.statusCounts?.['P2/L']) || 0;
  const tlCount = Number(summary.statusCounts?.['TL']) || 0;
  const thCount = Number(summary.statusCounts?.['TH']) || 0;
  const tmsCount = Number(summary.statusCounts?.['TMS']) || 0;
  const apsCount = Number(summary.statusCounts?.['APS']) || 0;

  const statusData = [
    { name: 'P/L', value: plCount, label: 'P/L', description: 'Peserta seleksi kompetensi memenuhi NAB sub tes kognitif ≥ 110 dan mengikuti seleksi kompetensi tambahan' },
    { name: 'P1/L', value: p1lCount, label: 'P1/L', description: 'Peserta seleksi kompetensi memenuhi NAB sub tes kognitif ≥ 100 dan mengikuti seleksi kompetensi tambahan' },
    { name: 'P2/L', value: p2lCount, label: 'P2/L', description: 'Peserta seleksi kompetensi memenuhi NAB sub tes kognitif ≥ 90 dan sub tes substansi ≥ 71 serta mengikuti seleksi kompetensi tambahan' },
    { name: 'TL', value: tlCount, label: 'TL', description: 'Peserta Tidak Lulus' },
    { name: 'TH', value: thCount, label: 'TH / HT', description: 'Peserta Tidak Hadir' },
    { name: 'TMS', value: tmsCount, label: 'TMS', description: 'Gugur dikarenakan tidak memenuhi syarat yang ditentukan oleh panselnas' },
    { name: 'APS', value: apsCount, label: 'APS', description: 'Peserta yang mengajukan pengunduran diri atas permintaan sendiri' }
  ];

  const STATUS_COLORS = [
    '#6366f1', // Indigo for P/L
    '#3b82f6', // Blue for P1/L
    '#06b6d4', // Cyan for P2/L
    '#f43f5e', // Rose for TL
    '#eab308', // Amber/Yellow for TH
    '#f97316', // Orange for TMS
    '#a855f7'  // Purple for APS
  ];

  return (
    <div className="summary-dashboard">
      {/* Mobile Toggle Button */}
      <button
        type="button"
        className={`summary-dashboard__toggle-btn ${isExpanded ? 'summary-dashboard__toggle-btn--expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="summary-dashboard-content"
      >
        <span>{isExpanded ? 'Sembunyikan Ringkasan Seleksi' : 'Tampilkan Ringkasan Seleksi'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="summary-dashboard__toggle-icon"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {/* Main Content Area */}
      <div
        id="summary-dashboard-content"
        className={`summary-dashboard__content ${isExpanded ? 'summary-dashboard__content--expanded' : ''}`}
      >
        {/* KPI Cards: Jumlah Peserta & Jumlah Formasi */}
        <div className="summary-dashboard__kpis">
          <div className="summary-dashboard__kpi-card">
            <div className="summary-dashboard__kpi-header">
              <span className="summary-dashboard__kpi-title">Jumlah Peserta</span>
              <div className="summary-dashboard__kpi-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="summary-dashboard__kpi-icon">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>
            <div className="summary-dashboard__kpi-value-container">
              <h2 className="summary-dashboard__kpi-value">{fmtNum(totalPeserta)}</h2>
              <span className="summary-dashboard__kpi-badge">Peserta Terdaftar</span>
            </div>
          </div>

          <div className="summary-dashboard__kpi-card">
            <div className="summary-dashboard__kpi-header">
              <span className="summary-dashboard__kpi-title">Jumlah Formasi</span>
              <div className="summary-dashboard__kpi-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="summary-dashboard__kpi-icon">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
            </div>
            <div className="summary-dashboard__kpi-value-container">
              <h2 className="summary-dashboard__kpi-value">{fmtNum(jumlahFormasi)}</h2>
              <span className="summary-dashboard__kpi-badge">Kuota Formasi</span>
            </div>
          </div>
        </div>

        <div className="summary-dashboard__grid">
          {/* Section 1: Kelulusan dan Tidak Lulus */}
          <div className="summary-dashboard__card">
            <h3 className="summary-dashboard__card-title">1. Kelulusan & Tidak Lulus</h3>
            <div className="summary-dashboard__chart-container">
              {kelulusanData[0].value === 0 && kelulusanData[1].value === 0 ? (
                <span className="summary-dashboard__empty-chart">Data tidak tersedia</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kelulusanData}
                      cx="50%"
                      cy="43%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {kelulusanData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={KELULUSAN_COLORS[index % KELULUSAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => fmtNum(value)}
                      contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ marginTop: '40px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="summary-dashboard__stats-list">
              <div className="summary-dashboard__stat-row">
                <span className="summary-dashboard__stat-label">Lulus</span>
                <span className="summary-dashboard__stat-value">
                  {fmtNum(lulus)} ({fmtNum(lulusPersen)}%)
                </span>
              </div>
              <div className="summary-dashboard__stat-row">
                <span className="summary-dashboard__stat-label">Tidak Lulus</span>
                <span className="summary-dashboard__stat-value">
                  {fmtNum(tidakLulus)} ({fmtNum(tidakLulusPersen)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Hadir dan Tidak Hadir */}
          <div className="summary-dashboard__card">
            <h3 className="summary-dashboard__card-title">2. Kehadiran & Ketidakhadiran</h3>
            <div className="summary-dashboard__chart-container">
              {kehadiranData[0].value === 0 && kehadiranData[1].value === 0 ? (
                <span className="summary-dashboard__empty-chart">Data tidak tersedia</span>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={kehadiranData}
                      cx="50%"
                      cy="43%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {kehadiranData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={KEHADIRAN_COLORS[index % KEHADIRAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => fmtNum(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend wrapperStyle={{ marginTop: '40px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="summary-dashboard__stats-list">
              <div className="summary-dashboard__stat-row">
                <span className="summary-dashboard__stat-label">Hadir</span>
                <span className="summary-dashboard__stat-value">
                  {fmtNum(hadir)} ({fmtNum(hadirPersen)}%)
                </span>
              </div>
              <div className="summary-dashboard__stat-row">
                <span className="summary-dashboard__stat-label">Tidak Hadir</span>
                <span className="summary-dashboard__stat-value">
                  {fmtNum(tidakHadir)} ({fmtNum(tidakHadirPersen)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Statistik Nilai */}
          <div className="summary-dashboard__card">
            <h3 className="summary-dashboard__card-title">3. Statistik Nilai</h3>
            <div className="summary-dashboard__nilai-container">

              {/* Nilai Kognitif */}
              <div className="summary-dashboard__range-container">
                <div className="summary-dashboard__range-header">
                  <span className="summary-dashboard__range-title">Nilai Kognitif</span>
                  <span className="summary-dashboard__range-span">{fmtNum(kognitifRendah)} - {fmtNum(kognitifTinggi)}</span>
                </div>
                <div className="summary-dashboard__range-track-wrapper">
                  <span className="summary-dashboard__range-min-val">0</span>
                  <div className="summary-dashboard__range-track">
                    <div
                      className="summary-dashboard__range-fill"
                      style={{ left: `${kognitifStartPct}%`, width: `${kognitifWidthPct}%` }}
                    />
                  </div>
                  <span className="summary-dashboard__range-max-val">200</span>
                </div>
                <div className="summary-dashboard__range-details">
                  <div className="summary-dashboard__range-detail-item">
                    <span className="summary-dashboard__range-detail-label">Terendah</span>
                    <span className="summary-dashboard__range-detail-value">{fmtNum(kognitifRendah)}</span>
                  </div>
                  <div className="summary-dashboard__range-detail-item">
                    <span className="summary-dashboard__range-detail-label">Tertinggi</span>
                    <span className="summary-dashboard__range-detail-value">{fmtNum(kognitifTinggi)}</span>
                  </div>
                </div>
              </div>

              {/* Nilai Substansi */}
              <div className="summary-dashboard__range-container">
                <div className="summary-dashboard__range-header">
                  <span className="summary-dashboard__range-title">Nilai Substansi</span>
                  <span className="summary-dashboard__range-span">{fmtNum(substansiRendah)} - {fmtNum(substansiTinggi)}</span>
                </div>
                <div className="summary-dashboard__range-track-wrapper">
                  <span className="summary-dashboard__range-min-val">0</span>
                  <div className="summary-dashboard__range-track">
                    <div
                      className="summary-dashboard__range-fill summary-dashboard__range-fill--substansi"
                      style={{ left: `${substansiStartPct}%`, width: `${substansiWidthPct}%` }}
                    />
                  </div>
                  <span className="summary-dashboard__range-max-val">100</span>
                </div>
                <div className="summary-dashboard__range-details">
                  <div className="summary-dashboard__range-detail-item">
                    <span className="summary-dashboard__range-detail-label">Terendah</span>
                    <span className="summary-dashboard__range-detail-value">{fmtNum(substansiRendah)}</span>
                  </div>
                  <div className="summary-dashboard__range-detail-item">
                    <span className="summary-dashboard__range-detail-label">Tertinggi</span>
                    <span className="summary-dashboard__range-detail-value">{fmtNum(substansiTinggi)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 4: Rekapitulasi Status Kelulusan & Legend */}
          <div className="summary-dashboard__card summary-dashboard__card--full">
            <h3 className="summary-dashboard__card-title">4. Rekapitulasi Status Kelulusan & Legend</h3>
            <div className="summary-dashboard__section4-content">
              <div className="summary-dashboard__section4-chart">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="currentColor" fontSize={11} tickLine={false} />
                    <YAxis stroke="currentColor" fontSize={11} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val} />
                    <Tooltip
                      formatter={(value) => fmtNum(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="summary-dashboard__section4-legend" style={{ marginTop: '40px' }}>
                <div className="summary-dashboard__legend-grid">
                  {statusData.map((item, idx) => (
                    <div key={idx} className="summary-dashboard__legend-item">
                      <div className="summary-dashboard__legend-header-row">
                        <span className="summary-dashboard__legend-badge" style={{ backgroundColor: STATUS_COLORS[idx % STATUS_COLORS.length] }}>
                          {item.label}
                        </span>
                        <span className="summary-dashboard__legend-count">
                          <strong>{fmtNum(item.value)}</strong> ({totalPeserta > 0 ? ((item.value / totalPeserta) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                      <p className="summary-dashboard__legend-desc">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
