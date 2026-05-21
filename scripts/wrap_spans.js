const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'src', 'pages', 'sk_page.jsx')
let c = fs.readFileSync(file, 'utf8')

const pairs = [
  ['data-label="No">{noCol}<', 'data-label="No"><span>{noCol}</span><'],
  ['data-label="Nomor Peserta">{peserta}<', 'data-label="Nomor Peserta"><span>{peserta}</span><'],
  ['data-label="Nama">{nama}<', 'data-label="Nama"><span>{nama}</span><'],
  ['data-label="Kognitif">{kognitif}<', 'data-label="Kognitif"><span>{kognitif}</span><'],
  ['data-label="Substansi">{substansi}<', 'data-label="Substansi"><span>{substansi}</span><'],
  ['data-label="Status">{status}<', 'data-label="Status"><span>{status}</span><'],
]

pairs.forEach(([from, to]) => {
  c = c.split(from).join(to)
})

fs.writeFileSync(file, c, 'utf8')
console.log('done')
