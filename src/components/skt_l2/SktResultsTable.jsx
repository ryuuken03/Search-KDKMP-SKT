import React from 'react'
import BaseResultsTable from '../common/BaseResultsTable'
import { getJabatanSlug } from '../../utils/searchUtils'
import { TABLE_TEXT } from '../../config/constants'

const getStatusColor = (status) => {
  const s = String(status || '').trim().toUpperCase()
  if (s === 'L') return '#10b981'
  if (s === 'MS') return '#3b82f6'
  if (s === 'TMS') return '#f43f5e'
  if (s === 'TH') return '#6b7280'
  return 'inherit'
}

const formatRowData = (r, i, indexOfFirstItem) => {
  const raw = r.contextItems || []
  const vals = raw.map((v) => String(v || '').trim())

  return {
    noCol: vals[0] || (indexOfFirstItem + i + 1),
    peserta: vals[1] || r.firstCol || '',
    nama: vals[2] || r.matchText || '',
    jabatanFormasi: vals[3] || '',
    pendidikan: vals[4] || '',
    status: vals[5] || r.lastCol || '',
    status_sk: vals[6] || '',
    peringkat_sk: vals[7] || '',
    status_sebelum_l1: vals[8] || '',
    peringkat_sebelum_l1: vals[9] || '',
    status_sebelum_l2: vals[10] || '',
    peringkat_sebelum_l2: vals[11] || '',
    satdik: vals[12] || '',
    jabatan: r.jabatan || '',
    error: r.error
  }
}

const columns = [
  { key: 'peringkat', label: TABLE_TEXT.HEADERS.PERINGKAT, sortable: true },
  { key: 'noPeserta', label: TABLE_TEXT.HEADERS.NO_PESERTA, sortable: true },
  { key: 'nama', label: TABLE_TEXT.HEADERS.NAMA, sortable: true },
  { key: 'kognitif', label: TABLE_TEXT.HEADERS.KOGNITIF, sortable: false },
  { key: 'substansi', label: TABLE_TEXT.HEADERS.SUBSTANSI, sortable: false },
  { key: 'status', label: TABLE_TEXT.HEADERS.STATUS, sortable: false },
  { key: 'satdik', label: 'SATDIK', sortable: false },
  { key: 'jabatan', label: TABLE_TEXT.HEADERS.JABATAN, sortable: true },
]

export default function SktResultsTable(props) {
  const renderRow = (r, i, indexOfFirstItem) => {
    const { error, noCol, peserta, nama, jabatanFormasi, pendidikan, status, status_sk, peringkat_sk, status_sebelum_l1, peringkat_sebelum_l1, status_sebelum_l2, peringkat_sebelum_l2, satdik, jabatan } = formatRowData(r, i, indexOfFirstItem)

    if (error) {
      return (
        <tr key={i} className="empty-row">
          <td colSpan={8}>{error}</td>
        </tr>
      )
    }
    return (
      <tr key={i}>
        <td data-label="Peringkat">
          <div>
            <span style={{ fontWeight: 'bold' }}>{noCol}</span>
            {peringkat_sebelum_l2 && peringkat_sebelum_l2 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Layer 1: {peringkat_sebelum_l2}
              </div>
            )}
            {/* {peringkat_sebelum_l1 && peringkat_sebelum_l1 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                SKT Asli: {peringkat_sebelum_l1}
              </div>
            )}
            {peringkat_sk && peringkat_sk !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                SK: {peringkat_sk}
              </div>
            )} */}
          </div>
        </td>
        <td data-label="No Peserta"><span>{peserta}</span></td>
        <td data-label="Nama"><span>{nama}</span></td>
        <td data-label="Kognitif"><span>{jabatanFormasi}</span></td>
        <td data-label="Substansi"><span>{pendidikan}</span></td>
        <td data-label="Status">
          <div>
            <span style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
              {status}
            </span>
            {status_sebelum_l2 && status_sebelum_l2 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Layer 1: {status_sebelum_l2}
              </div>
            )}
            {/* {status_sebelum_l1 && status_sebelum_l1 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                SKT Asli: {status_sebelum_l1}
              </div>
            )}
            {status_sk && status_sk !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                SK: {status_sk}
              </div>
            )} */}
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
      colSpan={8}
      {...props}
    />
  )
}
