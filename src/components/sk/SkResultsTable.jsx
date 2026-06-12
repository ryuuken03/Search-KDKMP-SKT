import React from 'react'
import BaseResultsTable from '../common/BaseResultsTable'
import { getJabatanSlug } from '../../utils/searchUtils'
import { TABLE_TEXT } from '../../config/constants'

const formatRowData = (r, i, indexOfFirstItem) => {
  const raw = r.contextItems || []
  const vals = raw.map((v) => String(v || '').trim()).filter((v) => v.length > 0)
  return {
    noCol: vals[0] ?? (indexOfFirstItem + i + 1),
    peserta: vals[1] ?? r.firstCol ?? '',
    nama: vals[2] ?? r.matchText ?? '',
    kognitif: vals[3] ?? '',
    substansi: vals[4] ?? '',
    status: vals[5] ?? r.lastCol ?? '',
    jabatan: r.jabatan ?? '',
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
  { key: 'jabatan', label: TABLE_TEXT.HEADERS.JABATAN, sortable: true },
]

export default function SKResultsTable(props) {
  const renderRow = (r, i, indexOfFirstItem) => {
    const { error, noCol, peserta, nama, kognitif, substansi, status, jabatan } = formatRowData(r, i, indexOfFirstItem)

    if (error) {
      return (
        <tr key={i} className="empty-row">
          <td colSpan={7}>{error}</td>
        </tr>
      )
    }
    return (
      <tr key={i}>
        <td data-label="Peringkat"><span>{noCol}</span></td>
        <td data-label="No Peserta"><span>{peserta}</span></td>
        <td data-label="Nama"><span>{nama}</span></td>
        <td data-label="Kognitif"><span>{kognitif}</span></td>
        <td data-label="Substansi"><span>{substansi}</span></td>
        <td data-label="Status"><span>{status}</span></td>
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
      colSpan={7}
      {...props}
    />
  )
}
