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
    <div className="summary-dashboard" style={styles.dashboard}>
      <div style={styles.grid}>
        {/* Card: Formasi & Peserta */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Peserta & Formasi</h3>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Jumlah Formasi</span>
            <span style={styles.statValue}>{fmtNum(summary.jumlahFormasi)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Jumlah Peserta</span>
            <span style={styles.statValue}>{fmtNum(summary.jumlahPeserta)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Kelulusan</span>
            <span style={styles.statValue}>
              {fmtNum(summary.kelulusan?.jumlah)} ({summary.kelulusan?.persen != null ? `${fmtNum(summary.kelulusan.persen)}%` : '—'})
            </span>
          </div>
        </div>

        {/* Card: Chart Kehadiran */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Statistik Kehadiran</h3>
          <div style={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {kehadiranData[0].value === 0 && kehadiranData[1].value === 0 ? (
              <span style={{ color: '#9ca3af' }}>Data tidak tersedia</span>
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
                  <Tooltip formatter={(value) => fmtNum(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Card: Nilai Tertinggi & Terendah */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Statistik Nilai</h3>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Kognitif Tertinggi</span>
            <span style={styles.statValue}>{fmtNum(summary.nilaiKognitif?.tertinggi)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Kognitif Terendah</span>
            <span style={styles.statValue}>{fmtNum(summary.nilaiKognitif?.terendah)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Substansi Tertinggi</span>
            <span style={styles.statValue}>{fmtNum(summary.nilaiSubstansi?.tertinggi)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>Substansi Terendah</span>
            <span style={styles.statValue}>{fmtNum(summary.nilaiSubstansi?.terendah)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboard: {
    padding: '20px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #f3f4f6',
    paddingBottom: '8px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '14px',
  },
  statValue: {
    color: '#111827',
    fontWeight: '600',
    fontSize: '15px',
  }
};
