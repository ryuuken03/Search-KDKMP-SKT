import React from 'react'
import BaseResultsTable from '../common/BaseResultsTable'
import { getJabatanSlug } from '../../utils/searchUtils'
import { TABLE_TEXT } from '../../config/constants'

const getStatusColor = (status) => {
  const s = String(status || '').trim().toUpperCase()
  if (s === 'L') return '#10b981'
  if (s === 'MS') return '#3b82f6'
  if (s === 'TMS') return '#f43f5e'
  return 'inherit'
}

const formatRowData = (r, i, indexOfFirstItem) => {
  const raw = r.contextItems || []
  const vals = raw.map((v) => String(v || '').trim())

  // contextItems dari hook (melewati row[0]=Page dan row[7]=Jabatan_Label):
  //   [0]=No  [1]=NKU  [2]=Nama  [3]=''  [4]=''  [5]=Keterangan
  //   [6]=peringkat_sebelum_l3  [7]=status_sebelum_l3  [12]=satdik
  return {
    noCol: vals[0] || (indexOfFirstItem + i + 1),
    peserta: vals[1] || r.firstCol || '',
    nama: vals[2] || r.matchText || '',
    status: vals[5] || r.lastCol || '',
    jabatan: r.jabatan || '',
    satdik: vals[12] || '',
    peringkat_sebelum_l3: vals[6] || '',
    status_sebelum_l3: vals[7] || '',
    error: r.error
  }
}

const columns = [
  { key: 'peringkat', label: TABLE_TEXT.HEADERS.PERINGKAT, sortable: true },
  { key: 'noPeserta', label: TABLE_TEXT.HEADERS.NO_PESERTA, sortable: true },
  { key: 'nama', label: TABLE_TEXT.HEADERS.NAMA, sortable: true },
  { key: 'status', label: TABLE_TEXT.HEADERS.STATUS, sortable: false },
  { key: 'satdik', label: 'SATDIK', sortable: false },
  { key: 'jabatan', label: TABLE_TEXT.HEADERS.JABATAN, sortable: true },
]

export default function SktL3ResultsTable(props) {
  const renderRow = (r, i, indexOfFirstItem) => {
    const { error, noCol, peserta, nama, status, jabatan, satdik, peringkat_sebelum_l3, status_sebelum_l3 } =
      formatRowData(r, i, indexOfFirstItem)

    if (error) {
      return (
        <tr key={i} className="empty-row">
          <td colSpan={6}>{error}</td>
        </tr>
      )
    }
    return (
      <tr key={i}>
        <td data-label="Peringkat">
          <div>
            <span style={{ fontWeight: 'bold' }}>{noCol}</span>
            {peringkat_sebelum_l3 && peringkat_sebelum_l3 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Layer 2: {peringkat_sebelum_l3}
              </div>
            )}
          </div>
        </td>
        <td data-label="No Peserta"><span>{peserta}</span></td>
        <td data-label="Nama"><span>{nama}</span></td>
        <td data-label="Status">
          <div>
            <span style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
              {status}
            </span>
            {status_sebelum_l3 && status_sebelum_l3 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Layer 2: {status_sebelum_l3}
              </div>
            )}
          </div>
        </td>
        <td data-label="SATDIK">
          <span>{satdik && satdik !== '-' ? satdik : '-'}</span>
        </td>
        <td data-label="Jabatan">
          <span className={`jabatan-badge jabatan-badge--${getJabatanSlug(jabatan)}`}>
            {jabatan}
          </span>
        </td>
      </tr>
    )
  }

  return (
    <BaseResultsTable
      columns={columns}
      renderRow={renderRow}
      colSpan={6}
      {...props}
    />
  )
}
