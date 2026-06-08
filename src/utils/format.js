export function fmtNum(value) {
  if (value == null || value === '') return '—';
  const n = Number(String(value).replace(',', '.'));
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('id-ID');
}
