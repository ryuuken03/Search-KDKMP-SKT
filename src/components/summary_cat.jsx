import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function fmtNum(value){
  if(value == null || value === '') return '—'
  const n = Number(String(value).replace(',', '.'))
  if(Number.isNaN(n)) return String(value)
  if(String(value).includes('.')) return n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return n.toLocaleString('id-ID')
}

export default function SummaryCat({ summary }) {
  if (!summary) {
    return <p className="page1-info__empty">Data rekap halaman 1 tidak ditemukan.</p>;
  }

  const kehadiranData = [
    { name: 'Hadir', value: Number(summary.kehadiran?.hadir) || 0 },
    { name: 'Tidak Hadir', value: Number(summary.kehadiran?.tidakHadir) || 0 }
  ];

  const COLORS = ['#10b981', '#f43f5e']; // Green for Hadir, Red for Tidak Hadir

  return (
    <div className="summary-dashboard">
      <div className="summary-dashboard__grid">
        {/* Card: Formasi & Peserta */}
        <div className="summary-dashboard__card">
          <h3 className="summary-dashboard__card-title">Peserta & Formasi</h3>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Jumlah Formasi</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.jumlahFormasi)}</span>
          </div>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Jumlah Peserta</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.jumlahPeserta)}</span>
          </div>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Kelulusan</span>
            <span className="summary-dashboard__stat-value">
              {fmtNum(summary.kelulusan?.jumlah)} ({summary.kelulusan?.persen != null ? `${fmtNum(summary.kelulusan.persen)}%` : '—'})
            </span>
          </div>
        </div>

        {/* Card: Chart Kehadiran */}
        <div className="summary-dashboard__card">
          <h3 className="summary-dashboard__card-title">Statistik Kehadiran</h3>
          <div className="summary-dashboard__chart-container">
            {kehadiranData[0].value === 0 && kehadiranData[1].value === 0 ? (
              <span className="summary-dashboard__empty-chart">Data tidak tersedia</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kehadiranData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {kehadiranData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => fmtNum(value)}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Card: Nilai Tertinggi & Terendah */}
        <div className="summary-dashboard__card">
          <h3 className="summary-dashboard__card-title">Statistik Nilai</h3>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Kognitif Tertinggi</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.nilaiKognitif?.tertinggi)}</span>
          </div>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Kognitif Terendah</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.nilaiKognitif?.terendah)}</span>
          </div>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Substansi Tertinggi</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.nilaiSubstansi?.tertinggi)}</span>
          </div>
          <div className="summary-dashboard__stat-row">
            <span className="summary-dashboard__stat-label">Substansi Terendah</span>
            <span className="summary-dashboard__stat-value">{fmtNum(summary.nilaiSubstansi?.terendah)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
