import React from 'react'
import BaseResultsTable from '../common/BaseResultsTable'
import { getJabatanSlug } from '../../utils/searchUtils'
import { TABLE_TEXT } from '../../config/constants'

const getStatusColor = (status) => {
  const s = String(status || '').trim().toUpperCase()
  if (s === 'L' || s === 'LULUS') return '#10b981'
  if (s === 'MS') return '#3b82f6'
  if (s === 'TMS') return '#f43f5e'
  return 'inherit'
}

const formatRowData = (r, i, indexOfFirstItem) => {
  const raw = r.contextItems || []
  const vals = raw.map((v) => String(v || '').trim())

  // Mapping contextItems:
  //   vals[0]  = Peringkat (row[1])
  //   vals[1]  = Nomor Peserta / NKU (row[2])
  //   vals[2]  = Nama Peserta (row[3])
  //   vals[3]  = Kognitif (row[4])
  //   vals[4]  = Substansi (row[5])
  //   vals[5]  = Status / Hasil Pelatihan (row[6])
  //   vals[6]  = No urut Satdik (row[8])
  //   vals[7]  = Status Layer 3 (row[9])
  //   vals[12] = SATDIK (row[14])
  return {
    noCol: vals[6] || (indexOfFirstItem + i + 1),
    peringkat: vals[0] || '',
    peserta: vals[1] || r.firstCol || '',
    nama: vals[2] || r.matchText || '',
    kognitif: vals[3] || '',
    substansi: vals[4] || '',
    status: vals[5] || '',
    satdik: vals[12] || '',
    jabatan: r.jabatan || '',
    status_setelah_l3: vals[7] || '',
    error: r.error
  }
}

const columns = [
  // { key: 'urut', label: TABLE_TEXT.HEADERS.URUT, sortable: true },
  { key: 'peringkat', label: TABLE_TEXT.HEADERS.PERINGKAT, sortable: true },
  { key: 'noPeserta', label: TABLE_TEXT.HEADERS.NO_PESERTA, sortable: true },
  { key: 'nama', label: TABLE_TEXT.HEADERS.NAMA, sortable: true },
  { key: 'kognitif', label: TABLE_TEXT.HEADERS.KOGNITIF, sortable: false },
  { key: 'substansi', label: TABLE_TEXT.HEADERS.SUBSTANSI, sortable: false },
  { key: 'status', label: TABLE_TEXT.HEADERS.STATUS, sortable: false },
  { key: 'satdik', label: 'SATDIK', sortable: false },
  { key: 'jabatan', label: TABLE_TEXT.HEADERS.JABATAN, sortable: true },
]

export default function PelatihanLulusResultsTable(props) {
  const renderRow = (r, i, indexOfFirstItem) => {
    const {
      error,
      noCol,
      peringkat,
      peserta,
      nama,
      kognitif,
      substansi,
      status,
      satdik,
      jabatan,
      status_setelah_l3
    } = formatRowData(r, i, indexOfFirstItem)

    if (error) {
      return (
        <tr key={i} className="empty-row">
          <td colSpan={8}>{error}</td>
        </tr>
      )
    }

    return (
      <tr key={i}>
        {/* <td data-label="No Urut Satdik">
          <span style={{ fontWeight: 'bold' }}>{noCol}</span>
        </td> */}
        <td data-label="Peringkat">
          <span style={{ fontWeight: 'bold' }}>{peringkat}</span>
        </td>
        <td data-label="No Peserta">
          <span>{peserta}</span>
        </td>
        <td data-label="Nama">
          <span>{nama}</span>
        </td>
        <td data-label="Kognitif">
          <span>{kognitif}</span>
        </td>
        <td data-label="Substansi">
          <span>{substansi}</span>
        </td>
        <td data-label="Status">
          <div>
            <span style={{ fontWeight: 'bold', color: getStatusColor(status) }}>
              {status}
            </span>
            {/* {status_setelah_l3 && status_setelah_l3 !== '-' && (
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                Layer 3: {status_setelah_l3}
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
